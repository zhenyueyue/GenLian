import AVFoundation
import CryptoKit
import Foundation
import Observation
import TrainingCoach
import UserNotifications

@MainActor
@Observable
final class TrainingNotificationScheduler: NSObject, UNUserNotificationCenterDelegate {
    nonisolated private static let identifier = "com.genlian.rest-end"
    private let center = UNUserNotificationCenter.current()
    private let renderer = RestSpeechRenderer()
    private(set) var authorization: UNAuthorizationStatus = .notDetermined
    private(set) var soundEnabled = false
    private(set) var scheduleFailed = false
    private var desired: RestReminder?
    private var installed: RestReminder?
    private var installedSound: String?
    private var preferences = VoiceCoachPreferences()
    private var inForeground = false
    private var installer: Task<Void, Never>?
    private var renderTask: Task<Void, Never>?
    private var renderFailure: String?

    override init() {
        super.init()
        center.delegate = self
        removeReminder()
    }

    var permissionDescription: String {
        switch authorization {
        case .authorized, .ephemeral:
            if !soundEnabled { return "通知声音已关闭" }
            return scheduleFailed ? "提醒安排失败" : "通知与声音已允许"
        case .provisional: return "临时授权 · 系统可能静默投递"
        case .denied: return "通知被拒绝 · 后台休息提醒不可用"
        case .notDetermined: return "尚未授权 · 后台休息提醒不可用"
        @unknown default: return "通知状态不可用"
        }
    }

    var canSchedule: Bool {
        authorization == .authorized || authorization == .provisional || authorization == .ephemeral
    }

    func refreshPermission() async {
        let settings = await center.notificationSettings()
        authorization = settings.authorizationStatus
        soundEnabled = settings.soundSetting == .enabled
        if !canSchedule { removeReminder() }
        install()
        renderIfNeeded()
    }

    func requestPermission() async {
        _ = try? await center.requestAuthorization(options: [.alert, .sound])
        await refreshPermission()
    }

    func update(_ reminder: RestReminder?, preferences: VoiceCoachPreferences, foreground: Bool) {
        let desired = CoachPolicy.allowsNotification(preferences, permitted: true) ? reminder : nil
        let soundChanged = preferences.rate != self.preferences.rate || preferences.volume != self.preferences.volume
        let changed = self.desired != desired || soundChanged
        self.desired = desired
        self.preferences = preferences
        inForeground = foreground
        if changed {
            removeReminder()
            renderFailure = nil
            install()
        }
        renderIfNeeded()
    }

    private func removeReminder() {
        center.removePendingNotificationRequests(withIdentifiers: [Self.identifier])
        center.removeDeliveredNotifications(withIdentifiers: [Self.identifier])
        installed = nil
        installedSound = nil
        scheduleFailed = false
    }

    private func install() {
        guard installer == nil, CoachPolicy.allowsNotification(preferences, permitted: canSchedule), desired != nil else { return }
        installer = Task { [weak self] in
            guard let self else { return }
            defer { installer = nil }
            while canSchedule, let reminder = desired, reminder.deadline.timeIntervalSinceNow >= 1 {
                let sound = cachedSound(reminder)
                if installed == reminder && installedSound == sound { return }
                let content = UNMutableNotificationContent()
                content.title = "跟练 · 休息结束"
                content.body = reminder.phrase
                content.sound = sound.map { UNNotificationSound(named: UNNotificationSoundName(rawValue: $0)) } ?? .default
                let trigger = UNTimeIntervalNotificationTrigger(
                    timeInterval: max(1, reminder.deadline.timeIntervalSinceNow), repeats: false
                )
                do {
                    try await center.add(UNNotificationRequest(identifier: Self.identifier, content: content, trigger: trigger))
                } catch {
                    if desired != reminder { continue }
                    scheduleFailed = true
                    return
                }
                if desired != reminder || !canSchedule {
                    removeReminder()
                    continue
                }
                scheduleFailed = false
                installed = reminder
                installedSound = sound
            }
        }
    }

    private func soundLocation(_ reminder: RestReminder) -> URL? {
        guard let library = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first else { return nil }
        let key = "\(reminder.phrase)|\(preferences.rate)|\(preferences.volume)"
        let hash = SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", Int($0)) }.joined()
        return library.appendingPathComponent("Sounds", isDirectory: true)
            .appendingPathComponent("genlian-\(hash).caf")
    }

    private func cachedSound(_ reminder: RestReminder) -> String? {
        guard let file = soundLocation(reminder), FileManager.default.fileExists(atPath: file.path) else { return nil }
        return file.lastPathComponent
    }

    private func renderIfNeeded() {
        guard inForeground, canSchedule, soundEnabled, renderTask == nil,
              let reminder = desired, reminder.deadline.timeIntervalSinceNow > 3,
              let file = soundLocation(reminder), cachedSound(reminder) == nil,
              renderFailure != file.lastPathComponent else { return }
        let rate = preferences.rate
        let volume = preferences.volume
        renderTask = Task { [weak self] in
            guard let self else { return }
            do {
                try await renderer.render(reminder.phrase, rate: rate, volume: volume, to: file)
            } catch {
                renderFailure = file.lastPathComponent
            }
            renderTask = nil
            install()
            renderIfNeeded()
        }
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter, willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        // Foreground transitions are announced by VoiceCoachService.
        notification.request.identifier == Self.identifier ? [] : [.banner, .sound]
    }
}

@MainActor
private final class RestSpeechRenderer {
    private let synthesizer = AVSpeechSynthesizer()

    func render(_ text: String, rate: Double, volume: Double, to file: URL) async throws {
        try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        let temporary = file.deletingLastPathComponent().appendingPathComponent("\(UUID()).caf")
        defer { try? FileManager.default.removeItem(at: temporary) }
        synthesizer.usesApplicationAudioSession = false
        let utterance = VoiceCoachService.utterance(text, rate: rate, volume: volume)
        if utterance.voice == nil { throw RestSpeechError.unavailable }
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            let writer = RestSpeechWriter(url: temporary, continuation: continuation)
            synthesizer.write(utterance) { buffer in writer.receive(buffer) }
        }
        try FileManager.default.moveItem(at: temporary, to: file)
    }
}

private enum RestSpeechError: Error { case unavailable, invalidAudio }

// The speech callback may arrive on a secondary queue. Buffers never leave that callback.
private final class RestSpeechWriter: @unchecked Sendable {
    private let lock = NSLock()
    private let url: URL
    private var continuation: CheckedContinuation<Void, Error>?
    private var file: AVAudioFile?
    private var frames = 0

    init(url: URL, continuation: CheckedContinuation<Void, Error>) {
        self.url = url
        self.continuation = continuation
    }

    func receive(_ buffer: AVAudioBuffer) {
        lock.lock()
        defer { lock.unlock() }
        guard let continuation else { return }
        do {
            guard let buffer = buffer as? AVAudioPCMBuffer else { throw RestSpeechError.invalidAudio }
            if buffer.frameLength == 0 {
                guard frames > 0 else { throw RestSpeechError.invalidAudio }
                file = nil
                self.continuation = nil
                continuation.resume()
                return
            }
            guard Double(frames + Int(buffer.frameLength)) < 29 * buffer.format.sampleRate else {
                throw RestSpeechError.invalidAudio
            }
            if file == nil {
                file = try AVAudioFile(forWriting: url, settings: [
                    AVFormatIDKey: kAudioFormatLinearPCM,
                    AVSampleRateKey: buffer.format.sampleRate,
                    AVNumberOfChannelsKey: buffer.format.channelCount,
                    AVLinearPCMBitDepthKey: 16
                ], commonFormat: buffer.format.commonFormat, interleaved: buffer.format.isInterleaved)
            }
            try file?.write(from: buffer)
            frames += Int(buffer.frameLength)
        } catch {
            file = nil
            self.continuation = nil
            continuation.resume(throwing: error)
        }
    }
}
