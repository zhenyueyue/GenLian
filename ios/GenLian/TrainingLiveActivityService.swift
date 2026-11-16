@preconcurrency import ActivityKit
import Foundation
import TrainingCore

@MainActor
final class TrainingLiveActivityService {
    private struct Snapshot: Equatable {
        let id: UUID
        let course: String
        let content: TrainingActivityAttributes.ContentState
    }

    private let defaults: UserDefaults
    private let requestedKey = "genlian.live-activity-session"
    private var desired: Snapshot?
    private var interactive = false
    private var applied: Snapshot?
    private var worker: Task<Void, Never>?
    private var initialized = false

    init(defaults: UserDefaults) { self.defaults = defaults }

    func update(_ session: WorkoutSession?, deadline: Date?, foreground: Bool) {
        let snapshot = session.map { session in
            let stage: TrainingActivityAttributes.Stage
            if session.isPaused {
                stage = .paused
            } else {
                switch session.phase {
                case .prepare, .nextTransition: stage = .ready
                case .rest: stage = .rest
                case .restReady: stage = .restReady
                case .active, .setComplete, .summary: stage = .exercise
                }
            }
            return Snapshot(id: session.id, course: session.plan.title, content: .init(
                stage: stage,
                exercise: session.currentExercise.name,
                nextExercise: session.upcomingPosition.map { session.plan.exercises[$0.exerciseIndex].name },
                round: session.position.round,
                rounds: session.plan.rounds,
                restDeadline: stage == .rest ? deadline : nil
            ))
        }
        guard !initialized || snapshot != desired || foreground != interactive else { return }
        initialized = true
        desired = snapshot
        interactive = foreground
        reconcile()
    }

    private func reconcile() {
        guard worker == nil else { return }
        worker = Task { [weak self] in
            guard let self else { return }
            defer { worker = nil }
            while true {
                let target = desired
                let wasInteractive = interactive
                await apply(target, interactive: wasInteractive)
                if desired == target && interactive == wasInteractive { return }
            }
        }
    }

    private func apply(_ target: Snapshot?, interactive: Bool) async {
        let active = Activity<TrainingActivityAttributes>.activities
        for activity in active where activity.attributes.sessionID != target?.id {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        guard let target else {
            defaults.removeObject(forKey: requestedKey)
            applied = nil
            return
        }
        let content = ActivityContent(state: target.content, staleDate: target.content.restDeadline)
        if let activity = active.first(where: { $0.attributes.sessionID == target.id }) {
            if applied != target { await activity.update(content) }
        } else if interactive, ActivityAuthorizationInfo().areActivitiesEnabled,
                  defaults.string(forKey: requestedKey) != target.id.uuidString {
            do {
                _ = try Activity.request(
                    attributes: TrainingActivityAttributes(sessionID: target.id, course: target.course),
                    content: content, pushType: nil
                )
                defaults.set(target.id.uuidString, forKey: requestedKey)
            } catch {
                // Workout operation continues when system Live Activities are unavailable.
            }
        }
        applied = target
    }
}
