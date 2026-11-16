import AVFoundation
import CryptoKit
import Foundation
import Observation
import OSLog
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
    private(set) var scheduleError: String?
    private(set) var renderStatus: String?
    private var desired: RestReminder?
    private var preparing: String?
    private var requested: RestNotificationRequest?
    private var attempted: RestNotificationRequest?
    private var installed: RestNotificationRequest?
    private var preferences = VoiceCoachPreferences()
    private var inForeground = false
    private var installer: Task<Void, Never>?
    private var renderTask: Task<Void, Never>?
    private var audioFile: URL?
    private var audio: RestNotificationRequest.Audio = .waiting
    private let logger = Logger(subsystem: "com.genlian.app", category: "RestNotification")

    override init() {
        super.init()
        center.delegate = self
        removeReminder()
    }

    var permissionDescription: String {
        switch authorization {
        case .authorized, .ephemeral:
            if !soundEnabled { return "通知声音已关闭" }
            return "通知与声音已允许"
        case .provisional: return "临时授权 · 系统可能静默投递"
        case .denied: return "通知被拒绝 · 后台休息提醒不可用"
        case .notDetermined: return "尚未授权 · 后台休息提醒不可用"
        @unknown default: return "通知状态不可用"
        }
    }

    var deliveryDescription: String? {
        if let scheduleError { return "提醒安排失败：\(scheduleError)" }
        if let installed {
            switch installed.sound {
            case .speech: return "休息提醒已安排 · 普通话语音"
            case .systemDefault: return "休息提醒已安排 · 系统默认提示音"
            case .silent: return "休息提醒已安排 · 通知声音已关闭"
            }
        }
        return nil
    }

    var canSchedule: Bool {
        authorization == .authorized || authorization == .provisional || authorization == .ephemeral
    }

    func refreshPermission() async {
        let settings = await center.notificationSettings()
        authorization = settings.authorizationStatus
        soundEnabled = settings.soundSetting == .enabled
        reconcile()
    }

    func requestPermission() async {
        _ = try? await center.requestAuthorization(options: [.alert, .sound])
        await refreshPermission()
    }

    func update(_ reminder: RestReminder?, preparing: String?, preferences: VoiceCoachPreferences, foreground: Bool) {
        let enabled = CoachPolicy.allowsNotification(preferences, permitted: true)
        if foreground && !inForeground && scheduleError != nil { attempted = nil }
        self.desired = enabled ? reminder : nil
        self.preparing = enabled ? preparing : nil
        self.preferences = preferences
        inForeground = foreground
        reconcile()
    }

    private func removeReminder() {
        center.removePendingNotificationRequests(withIdentifiers: [Self.identifier])
        center.removeDeliveredNotifications(withIdentifiers: [Self.identifier])
        installed = nil
    }

    private func reconcile() {
        prepareAudio()
        let request = RestNotificationRequest.resolve(
            desired, permitted: canSchedule, soundEnabled: soundEnabled, audio: audio, now: .now
        )
        if requested != request {
            requested = request
            attempted = nil
            scheduleError = nil
            removeReminder()
        }
        installIfNeeded()
    }

    private func installIfNeeded() {
        guard installer == nil, requested != nil, requested != attempted else { return }
        installer = Task { [weak self] in
            guard let self else { return }
            defer { installer = nil }
            while let request = requested, request != attempted {
                attempted = request
                let remaining = request.reminder.deadline.timeIntervalSinceNow
                guard remaining > 0 else { return }
                let content = UNMutableNotificationContent()
                content.title = "跟练 · 休息结束"
                content.body = request.reminder.phrase
                switch request.sound {
                case .speech(let filename): content.sound = UNNotificationSound(named: .init(rawValue: filename))
                case .systemDefault: content.sound = .default
                case .silent: content.sound = nil
                }
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: remaining, repeats: false)
                do {
                    try await center.add(UNNotificationRequest(identifier: Self.identifier, content: content, trigger: trigger))
                } catch {
                    if requested != request { continue }
                    scheduleError = error.localizedDescription
                    logger.error("Unable to submit rest notification: \(error.localizedDescription, privacy: .public)")
                    continue
                }
                if requested != request {
                    removeReminder()
                    continue
                }
                scheduleError = nil
                installed = request
                attempted = request
                logger.info("Rest notification accepted: \(String(describing: request.sound), privacy: .public)")
            }
        }
    }

    private func soundLocation(_ phrase: String) -> URL? {
        guard let library = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first else { return nil }
        let key = "\(phrase)|\(preferences.rate)|\(preferences.volume)"
        let hash = SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", Int($0)) }.joined()
        return library.appendingPathComponent("Sounds", isDirectory: true)
            .appendingPathComponent("genlian-\(hash).caf")
    }

    private func prepareAudio() {
        guard canSchedule, soundEnabled, let phrase = desired?.phrase ?? preparing else {
            audioFile = nil
            audio = .waiting
            renderStatus = nil
            return
        }
        guard let file = soundLocation(phrase) else {
            audio = .failed
            renderStatus = "语音生成失败：找不到 Library/Sounds"
            return
        }
        if audioFile != file {
            audioFile = file
            audio = .waiting
            renderStatus = nil
            if FileManager.default.fileExists(atPath: file.path) {
                do {
                    try RestNotificationAudio.validate(file)
                    try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: file.path)
                    audio = .verified(file.lastPathComponent)
                    renderStatus = "普通话语音已校验（缓存）"
                } catch {
                    logger.error("Invalid cached CAF: \(error.localizedDescription, privacy: .public)")
                    do {
                        try FileManager.default.removeItem(at: file)
                    } catch {
                        audio = .failed
                        renderStatus = "无法替换无效 CAF：\(error.localizedDescription)"
                    }
                }
            }
        }
        guard inForeground, renderTask == nil, audio == .waiting else { return }
        let rate = preferences.rate
        let volume = preferences.volume
        renderStatus = "正在生成普通话提醒"
        renderTask = Task { [weak self] in
            guard let self else { return }
            do {
                try await renderer.render(phrase, rate: rate, volume: volume, to: file)
                if audioFile == file {
                    audio = .verified(file.lastPathComponent)
                    renderStatus = "普通话语音已生成并校验"
                }
                logger.info("Verified CAF: \(file.lastPathComponent, privacy: .public)")
            } catch {
                if audioFile == file {
                    audio = .failed
                    renderStatus = "语音生成失败：\(error.localizedDescription)"
                }
                logger.error("Rest speech failed: \(error.localizedDescription, privacy: .public)")
            }
            renderTask = nil
            reconcile()
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
        guard utterance.voice?.language == "zh-CN" else { throw RestSpeechError.unavailable }
        var timeout: Task<Void, Never>?
        defer { timeout?.cancel() }
        let frames = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<AVAudioFramePosition, Error>) in
            let writer = RestSpeechWriter(url: temporary, continuation: continuation)
            timeout = Task { [synthesizer] in
                do { try await Task.sleep(for: .seconds(8)) } catch { return }
                if writer.fail(RestSpeechError.incomplete) { synthesizer.stopSpeaking(at: .immediate) }
            }
            synthesizer.write(utterance) { buffer in writer.receive(buffer) }
        }
        try RestNotificationAudio.validate(temporary, expectedFrames: frames)
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: temporary.path)
        try FileManager.default.moveItem(at: temporary, to: file)
    }
}

private enum RestSpeechError: LocalizedError {
    case unavailable, invalidAudio, incomplete

    var errorDescription: String? {
        switch self {
        case .unavailable: "系统普通话语音不可用"
        case .invalidAudio: "系统没有输出有效的 PCM 语音"
        case .incomplete: "系统语音写入未结束"
        }
    }
}

// The speech callback may arrive on a secondary queue. Buffers never leave that callback.
private final class RestSpeechWriter: @unchecked Sendable {
    private let lock = NSLock()
    private let url: URL
    private var continuation: CheckedContinuation<AVAudioFramePosition, Error>?
    private var file: AVAudioFile?
    private var frames = 0

    init(url: URL, continuation: CheckedContinuation<AVAudioFramePosition, Error>) {
        self.url = url
        self.continuation = continuation
    }

    func fail(_ error: Error) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard let continuation else { return false }
        file?.close()
        file = nil
        self.continuation = nil
        continuation.resume(throwing: error)
        return true
    }

    func receive(_ buffer: AVAudioBuffer) {
        lock.lock()
        defer { lock.unlock() }
        guard let continuation else { return }
        do {
            guard let buffer = buffer as? AVAudioPCMBuffer else { throw RestSpeechError.invalidAudio }
            if buffer.frameLength == 0 {
                guard frames > 0 else { throw RestSpeechError.invalidAudio }
                file?.close()
                file = nil
                self.continuation = nil
                continuation.resume(returning: AVAudioFramePosition(frames))
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
            file?.close()
            file = nil
            self.continuation = nil
            continuation.resume(throwing: error)
        }
    }
}
