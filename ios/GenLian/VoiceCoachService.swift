import AVFoundation
import Foundation
import TrainingCoach

@MainActor
final class VoiceCoachService: NSObject, AVSpeechSynthesizerDelegate {
    private var synthesizer = AVSpeechSynthesizer()
    private let audio = AVAudioSession.sharedInstance()
    private var queue = CoachQueue()
    private var context: String?
    private var sessionID: UUID?
    private var utteranceID: ObjectIdentifier?
    private var sessionActive = false
    private var blocksPlayback = false
    private var inForeground = false
    private var preferences = VoiceCoachPreferences()

    override init() {
        super.init()
        synthesizer.delegate = self
        synthesizer.usesApplicationAudioSession = true
        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(interruption(_:)), name: AVAudioSession.interruptionNotification, object: audio)
        center.addObserver(self, selector: #selector(routeChanged(_:)), name: AVAudioSession.routeChangeNotification, object: audio)
        center.addObserver(self, selector: #selector(mediaReset), name: AVAudioSession.mediaServicesWereResetNotification, object: audio)
    }

    func update(
        sessionID: UUID?, context: String?, prompts: [CoachPrompt],
        preferences: VoiceCoachPreferences, foreground: Bool
    ) {
        if self.context != context || self.preferences != preferences { stop() }
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
        case .speak:
            for prompt in prompts { queue.enqueue(prompt) }
            speakNext()
        }
    }

    private func speakNext() {
        guard inForeground, !blocksPlayback, utteranceID == nil, let prompt = queue.next() else { return }
        let options: AVAudioSession.CategoryOptions = preferences.duckMusic
            ? [.duckOthers, .interruptSpokenAudioAndMixWithOthers] : [.mixWithOthers]
        do {
            try audio.setCategory(.playback, mode: .voicePrompt, options: options)
            try audio.setActive(true)
            sessionActive = true
        } catch {
            stop()
            return
        }
        let utterance = Self.utterance(prompt.text, rate: preferences.rate, volume: preferences.volume)
        utteranceID = ObjectIdentifier(utterance)
        synthesizer.speak(utterance)
    }

    static func utterance(_ text: String, rate: Double, volume: Double) -> AVSpeechUtterance {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-CN")
        utterance.rate = Float(rate)
        utterance.volume = Float(volume)
        return utterance
    }

    private func stop() {
        queue.cancelPending()
        utteranceID = nil
        synthesizer.stopSpeaking(at: .immediate)
        releaseAudio()
    }

    private func releaseAudio() {
        guard sessionActive else { return }
        sessionActive = false
        try? audio.setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func didStop(_ id: ObjectIdentifier) {
        guard utteranceID == id else { return }
        utteranceID = nil
        releaseAudio()
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
            blocksPlayback = false
            stop()
            synthesizer = AVSpeechSynthesizer()
            synthesizer.delegate = self
            synthesizer.usesApplicationAudioSession = true
        }
    }
}
