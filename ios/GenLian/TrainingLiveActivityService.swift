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

    func update(_ session: WorkoutSession?, restDeadline: Date?, now: Date, foreground: Bool) {
        let snapshot = session.flatMap { session -> Snapshot? in
            guard !session.needsResume else { return nil }
            let stage: TrainingActivityAttributes.Stage
            if session.isPaused {
                stage = .paused
            } else {
                switch session.phase {
                case .prepare, .nextTransition: stage = .ready
                case .rest: stage = .rest
                case .restReady: stage = .restReady
                case .active, .setComplete: stage = .exercise
                case .summary:
                    guard session.outcome == .completed else { return nil }
                    stage = .completed
                }
            }
            let next = session.upcomingPosition
            var preparationDeadline: Date?
            var timerStart: Date?
            if stage == .rest, let restDeadline, let rest = session.rest {
                timerStart = restDeadline.addingTimeInterval(-rest.targetSeconds)
            } else if stage == .ready, foreground, let remaining = session.countdownSeconds, remaining > 0 {
                let estimate = now.addingTimeInterval(remaining)
                let previous = desired?.content
                if desired?.id == session.id, previous?.movementID == session.currentExercise.movementID,
                   previous?.round == session.position.round, let end = previous?.preparationDeadline,
                   abs(end.timeIntervalSince(estimate)) < 1 {
                    preparationDeadline = end
                    timerStart = previous?.timerStart
                } else {
                    preparationDeadline = estimate
                    timerStart = now
                }
            }
            let requiredSets = session.plan.plannedSetCount / session.plan.rounds
            let rounds = Dictionary(grouping: session.loggedSets, by: { $0.key.position.round })
                .filter { $0.value.count == requiredSets }.keys.sorted()
            return Snapshot(id: session.id, course: session.plan.title, content: .init(
                stage: stage,
                exercise: session.currentExercise.name,
                nextExercise: next.map { session.plan.exercises[$0.exerciseIndex].name },
                round: session.position.round,
                rounds: session.plan.rounds,
                restDeadline: stage == .rest ? restDeadline : nil,
                nextRound: next?.round,
                autoAdvance: session.restSettings.autoAdvance,
                movementID: session.currentExercise.movementID,
                timerStart: timerStart,
                preparationDeadline: preparationDeadline,
                preparationSeconds: stage == .ready && !foreground
                    ? session.countdownSeconds.map { Int($0.rounded(.up)) } : nil,
                completedRounds: rounds
            ))
        }
        if snapshot == nil, desired?.content.stage == .completed, desired != applied { return }
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
        let active = Activity<TrainingActivityAttributes>.activities.filter {
            $0.activityState == .active || $0.activityState == .stale
        }
        for activity in active where activity.attributes.sessionID != target?.id {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        guard let target else {
            defaults.removeObject(forKey: requestedKey)
            applied = nil
            return
        }
        let content = ActivityContent(state: target.content, staleDate: target.content.restDeadline)
        if target.content.stage == .completed {
            if let activity = active.first(where: { $0.attributes.sessionID == target.id }) {
                await activity.end(content, dismissalPolicy: .after(.now.addingTimeInterval(60)))
            }
            applied = target
            return
        }
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
