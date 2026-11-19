import AVFoundation
import Foundation
import OSLog
import TrainingCoach

@MainActor
final class VoiceCoachService: NSObject, AVSpeechSynthesizerDelegate {
    private enum AudioState {
        case inactive, activating, active(duckMusic: Bool), deactivating
    }

    private var synthesizer = AVSpeechSynthesizer()
    private let audio = VoiceCoachAudioSession()
    private let logger = Logger(subsystem: "com.genlian.app", category: "VoiceCoach")
    private var queue = CoachQueue()
    private var context: String?
    private var sessionID: UUID?
    private var utteranceID: ObjectIdentifier?
    private var audioState: AudioState = .inactive
    private var mediaGeneration = 0
    private var blocksPlayback = false
    private var inForeground = false
    private var preferences = VoiceCoachPreferences()

    override init() {
        super.init()
        synthesizer.delegate = self
        synthesizer.usesApplicationAudioSession = true
        let center = NotificationCenter.default
        let session = AVAudioSession.sharedInstance()
        center.addObserver(self, selector: #selector(interruption(_:)), name: AVAudioSession.interruptionNotification, object: session)
        center.addObserver(self, selector: #selector(routeChanged(_:)), name: AVAudioSession.routeChangeNotification, object: session)
        center.addObserver(self, selector: #selector(mediaReset), name: AVAudioSession.mediaServicesWereResetNotification, object: session)
    }

    func update(
        sessionID: UUID?, context: String?, prompts: [CoachPrompt],
        preferences: VoiceCoachPreferences, foreground: Bool
    ) {
        if self.context != context || self.preferences != preferences { cancelSpeech() }
        if self.sessionID != sessionID { queue = CoachQueue() }
        self.sessionID = sessionID
        self.context = context
        self.preferences = preferences
        inForeground = foreground
        switch CoachPolicy.audioAccess(
            preferences, hasContext: context != nil, foreground: foreground, interrupted: blocksPlayback
        ) {
        case .stop:
            stop()
        case .finishCurrent:
            queue.cancelPending()
            if utteranceID == nil { releaseAudio() }
        case .speak:
            for prompt in prompts { queue.enqueue(prompt) }
            speakNext()
        }
    }

    private func speakNext() {
        guard utteranceID == nil else { return }
        let now = ContinuousClock.now
        guard inForeground, !blocksPlayback, queue.firstReady(at: now) != nil else {
            releaseAudio()
            return
        }
        switch audioState {
        case .inactive:
            activateAudio(duckMusic: preferences.duckMusic)
        case .activating, .deactivating:
            break
        case .active(let duckMusic):
            guard duckMusic == preferences.duckMusic else {
                releaseAudio()
                return
            }
            guard let prompt = queue.next(at: now) else { return }
            let utterance = Self.utterance(prompt.text, rate: preferences.rate, volume: preferences.volume)
            utteranceID = ObjectIdentifier(utterance)
            synthesizer.speak(utterance)
        }
    }

    private func activateAudio(duckMusic: Bool) {
        audioState = .activating
        let generation = mediaGeneration
        Task {
            do {
                guard try await audio.activate(duckMusic: duckMusic) else {
                    activationFailed(generation: generation)
                    logger.warning("Audio session activation declined")
                    return
                }
                audioState = .active(duckMusic: duckMusic)
                if generation == mediaGeneration { speakNext() }
                else { releaseAudio() }
            } catch {
                activationFailed(generation: generation)
                logger.error("Audio session activation failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    private func activationFailed(generation: Int) {
        audioState = .inactive
        if generation == mediaGeneration { queue.cancelPending() }
        else { speakNext() }
    }

    static func utterance(_ text: String, rate: Double, volume: Double) -> AVSpeechUtterance {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-CN")
        utterance.rate = Float(rate)
        utterance.volume = Float(volume)
        return utterance
    }

    private func stop() {
        cancelSpeech()
        releaseAudio()
    }

    private func cancelSpeech() {
        queue.cancelPending()
        guard utteranceID != nil else { return }
        utteranceID = nil
        synthesizer.stopSpeaking(at: .immediate)
    }

    private func releaseAudio() {
        guard case .active = audioState else { return }
        audioState = .deactivating
        Task {
            do { try await audio.deactivate() }
            catch { logger.error("Audio session deactivation failed: \(error.localizedDescription, privacy: .public)") }
            audioState = .inactive
            speakNext()
        }
    }

    private func didStop(_ id: ObjectIdentifier) {
        guard utteranceID == id else { return }
        utteranceID = nil
        speakNext()
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        let id = ObjectIdentifier(utterance)
        Task { @MainActor [weak self] in self?.didStop(id) }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        let id = ObjectIdentifier(utterance)
        Task { @MainActor [weak self] in self?.didStop(id) }
    }

    @objc nonisolated private func interruption(_ notification: Notification) {
        let raw = (notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? NSNumber)?.uintValue
        guard let raw, let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
        Task { @MainActor [weak self] in
            self?.blocksPlayback = type == .began
            self?.stop()
        }
    }

    @objc nonisolated private func routeChanged(_ notification: Notification) {
        let raw = (notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? NSNumber)?.uintValue
        guard let raw, let reason = AVAudioSession.RouteChangeReason(rawValue: raw),
              reason == .oldDeviceUnavailable || reason == .newDeviceAvailable else { return }
        Task { @MainActor [weak self] in self?.stop() }
    }

    @objc nonisolated private func mediaReset() {
        Task { @MainActor [weak self] in
            guard let self else { return }
            mediaGeneration += 1
            blocksPlayback = false
            stop()
            synthesizer = AVSpeechSynthesizer()
            synthesizer.delegate = self
            synthesizer.usesApplicationAudioSession = true
        }
    }
}

private actor VoiceCoachAudioSession {
    func activate(duckMusic: Bool) async throws -> Bool {
        let session = AVAudioSession.sharedInstance()
        let options: AVAudioSession.CategoryOptions = duckMusic
            ? [.duckOthers, .interruptSpokenAudioAndMixWithOthers] : [.mixWithOthers]
        try session.setCategory(.playback, mode: .voicePrompt, options: options)
        if #available(iOS 27.0, *) {
            return try await session.activate()
        }
        try session.setActive(true)
        return true
    }

    func deactivate() async throws {
        let session = AVAudioSession.sharedInstance()
        if #available(iOS 27.0, *) {
            _ = try await session.deactivate(options: .notifyOthersOnDeactivation)
        } else {
            try session.setActive(false, options: .notifyOthersOnDeactivation)
        }
    }
}
