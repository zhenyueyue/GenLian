import Foundation
import TrainingCoach
import TrainingCore

@MainActor
final class TrainingCoachCoordinator {
    let notifications = TrainingNotificationScheduler()
    private let voice = VoiceCoachService()
    private let live: TrainingLiveActivityService
    private var reminder: RestReminder?

    init(defaults: UserDefaults) {
        live = TrainingLiveActivityService(defaults: defaults)
    }

    func synchronize(
        from old: WorkoutSession?, to session: WorkoutSession?, preferences: VoiceCoachPreferences,
        foreground: Bool, announce: Bool
    ) {
        let now = Date.now
        reminder = CoachPolicy.reminder(for: session, previous: reminder, now: now)
        notifications.update(
            reminder, preparing: CoachPolicy.upcomingRestSpeech(session), preferences: preferences,
            foreground: foreground
        )
        let liveSession = CoachPolicy.liveSession(session)
        live.update(liveSession, deadline: reminder?.deadline, foreground: foreground)

        let prompts = foreground && announce ? session.map {
            CoachPolicy.prompts(from: old, to: $0, preferences: preferences)
        } ?? [] : []
        let canSpeak = session.map { !$0.isPaused && !$0.needsResume } ?? false
        voice.update(
            sessionID: session?.id,
            context: canSpeak ? session.map(CoachPolicy.context) : nil,
            prompts: prompts, preferences: preferences, foreground: foreground
        )
    }
}
