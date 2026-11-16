import Foundation
import TrainingCore

public struct VoiceCoachPreferences: Codable, Equatable, Sendable {
    public var enabled = true
    public var background = false
    public var restEnd = true
    public var timeHints = true
    public var technique = true
    public var encouragement = false
    public var duckMusic = true
    public var rate: Double = 0.48
    public var volume: Double = 0.85

    public init(enabled: Bool = true) { self.enabled = enabled }
}

public struct CoachPrompt: Equatable, Sendable {
    public let id: String
    public let text: String
    public let expiresAt: ContinuousClock.Instant?

    public init(id: String, text: String, expiresAt: ContinuousClock.Instant? = nil) {
        self.id = id
        self.text = text
        self.expiresAt = expiresAt
    }
}

/// Delivery history lives only for the in-memory training session.
public struct CoachQueue {
    public private(set) var pending: [CoachPrompt] = []
    private var seen: Set<String> = []

    public init() {}

    public mutating func enqueue(_ prompt: CoachPrompt) {
        guard seen.insert(prompt.id).inserted else { return }
        pending.append(prompt)
    }

    public mutating func next(at now: ContinuousClock.Instant = .now) -> CoachPrompt? {
        while !pending.isEmpty {
            let next = pending.removeFirst()
            if next.expiresAt.map({ $0 > now }) != false { return next }
        }
        return nil
    }

    public mutating func cancelPending() { pending.removeAll() }
}

public struct RestReminder: Equatable, Sendable {
    public let event: String
    public let nextExercise: String
    public let deadline: Date

    public init(event: String, nextExercise: String, deadline: Date) {
        self.event = event
        self.nextExercise = nextExercise
        self.deadline = deadline
    }

    public var phrase: String { "休息结束，准备开始\(nextExercise)。" }
}

public enum CoachPolicy {
    public static func liveSession(_ session: WorkoutSession?) -> WorkoutSession? {
        guard let session, session.phase != .summary, !session.needsResume else { return nil }
        return session
    }

    public static func reminder(for session: WorkoutSession?, previous: RestReminder?, now: Date) -> RestReminder? {
        guard let session = liveSession(session), !session.isPaused, session.phase == .rest,
              let rest = session.rest, rest.remainingSeconds > 0, let next = session.upcomingPosition,
              let owner = session.restOwner else { return nil }
        let event = "\(session.id)-\(key(owner))-\(rest.targetSeconds)"
        let name = session.plan.exercises[next.exerciseIndex].name
        // Normal timer ticks do not replace an already scheduled notification.
        let candidate = now.addingTimeInterval(rest.remainingSeconds)
        if let previous, previous.event == event, abs(previous.deadline.timeIntervalSince(candidate)) < 1.5 {
            return previous
        }
        return RestReminder(event: event, nextExercise: name, deadline: candidate)
    }

    public static func context(_ session: WorkoutSession) -> String {
        let phase = session.phase == .nextTransition ? WorkoutPhase.active : session.phase
        return "\(session.id)-\(phase.rawValue)-\(key(session.currentKey))-\(session.isPaused)-\(session.needsResume)"
    }

    public static func allowsNotification(_ preferences: VoiceCoachPreferences, permitted: Bool) -> Bool {
        permitted && preferences.enabled && preferences.background && preferences.restEnd
    }

    public static func prompts(
        from old: WorkoutSession?, to session: WorkoutSession, preferences: VoiceCoachPreferences
    ) -> [CoachPrompt] {
        guard preferences.enabled, let old, old.id == session.id, !session.isPaused,
              !session.needsResume, !old.needsResume else { return [] }

        let id = "\(session.id)-\(key(session.currentKey))"
        if old.phase != .summary && session.phase == .summary {
            return session.outcome == .completed ? [.init(id: "\(session.id)-done", text: "今天的训练完成，做得不错。")] : []
        }
        if preferences.restEnd,
           old.phase == .rest && (session.phase == .restReady || session.phase == .nextTransition),
           let next = old.upcomingPosition, let owner = old.restOwner {
            let text = "休息结束，准备开始\(old.plan.exercises[next.exerciseIndex].name)。"
            return [.init(id: "\(session.id)-\(key(owner))-rest-end", text: text)]
        }
        if old.phase != .active && session.phase == .active {
            let exercise = session.currentExercise
            var text = "接下来是\(exercise.name)。"
            if preferences.technique {
                text += "\(exercise.coachingCue)。"
                if exercise.tempo.split(separator: "-").count == 3 {
                    text += "节奏\(exercise.tempo.replacingOccurrences(of: "-", with: "、"))。"
                }
            }
            return [.init(id: "\(id)-start", text: text)]
        }
        if old.phase == .active && session.phase == .active && old.position == session.position,
           old.side != session.side && session.loggedSets.dropFirst(old.loggedSets.count).contains(where: { $0.key == old.currentKey }) {
            let text = session.side == .right ? "左侧完成，接下来右侧。" : "右侧完成，接下来左侧。"
            return [.init(id: "\(id)-side", text: text)]
        }
        if preferences.encouragement, old.phase == .active,
           session.rest?.kind == .round && old.rest == nil,
           session.loggedSets.filter({ $0.key.position.round == session.position.round }).count
               == session.plan.plannedSetCount / session.plan.rounds {
            return [.init(id: "\(session.id)-round-\(session.position.round)", text: "第\(session.position.round)轮完成，继续保持。")]
        }
        guard preferences.timeHints, old.phase == .active, session.phase == .active,
              old.currentKey == session.currentKey, session.reviewPosition == nil,
              old.reviewPosition == nil, !old.isPaused,
              case .seconds(let target) = session.currentExercise.target else { return [] }
        for (remaining, text) in [(3.0, "三、二、一。"), (10.0, "还剩十秒。")] {
            let threshold = Double(target) - remaining
            let elapsed = session.currentActionSeconds
            if threshold > 0, old.currentActionSeconds < threshold, elapsed >= threshold, elapsed - threshold < 1 {
                return [.init(id: "\(id)-time-\(Int(remaining))", text: text, expiresAt: .now + .seconds(1))]
            }
        }
        return []
    }

    private static func key(_ key: SetKey) -> String {
        "\(key.position.round)-\(key.position.exerciseIndex)-\(key.position.set)-\(key.side.rawValue)"
    }
}
