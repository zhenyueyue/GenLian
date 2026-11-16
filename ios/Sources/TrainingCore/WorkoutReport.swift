import Foundation

public struct WorkoutReport: Sendable {
    public enum SetStatus: Equatable, Sendable {
        case completed(LoggedSet)
        case skipped(SkippedSet)
        case unfinished

        var isCompleted: Bool {
            if case .completed = self { return true }
            return false
        }
    }

    public struct Entry: Identifiable, Sendable {
        public let key: SetKey
        public let exercise: Exercise
        public let status: SetStatus
        public var id: SetKey { key }
    }

    public struct Round: Identifiable, Sendable {
        public let number: Int
        public let entries: [Entry]
        public var id: Int { number }
    }

    public let session: WorkoutSession
    public let totals: TrainingTotals
    public let completedExercises: Int
    public let plannedExercises: Int
    public let unfinishedSets: Int
    public let completedRounds: [Round]
    public let incompleteRounds: [Round]

    public init(session: WorkoutSession) {
        self.session = session
        totals = session.totals
        plannedExercises = session.plan.rounds * session.plan.exercises.count
        let logged = Dictionary(session.loggedSets.map { ($0.key, $0) }, uniquingKeysWith: { first, _ in first })
        let skipped = Dictionary(session.skippedSets.map { ($0.key, $0) }, uniquingKeysWith: { first, _ in first })
        var exercisesDone = 0
        var missing = 0
        var completed: [Round] = []
        var incomplete: [Round] = []
        for round in 1...session.plan.rounds {
            var done: [Entry] = []
            var remaining: [Entry] = []
            for (index, exercise) in session.plan.exercises.enumerated() {
                let sides: [Side] = exercise.unilateral ? [.left, .right] : [.bilateral]
                let before = done.count
                for set in 1...exercise.setsPerRound {
                    let position = SetPosition(round: round, exerciseIndex: index, set: set)
                    for side in sides {
                        let key = SetKey(position: position, side: side)
                        if let result = logged[key] {
                            done.append(Entry(key: key, exercise: exercise, status: .completed(result)))
                        } else if let result = skipped[key] {
                            remaining.append(Entry(key: key, exercise: exercise, status: .skipped(result)))
                        } else {
                            remaining.append(Entry(key: key, exercise: exercise, status: .unfinished))
                            missing += 1
                        }
                    }
                }
                if done.count - before == exercise.setsPerRound * sides.count {
                    exercisesDone += 1
                }
            }
            if !done.isEmpty { completed.append(Round(number: round, entries: done)) }
            if !remaining.isEmpty { incomplete.append(Round(number: round, entries: remaining)) }
        }
        completedExercises = exercisesDone
        unfinishedSets = missing
        completedRounds = completed
        incompleteRounds = incomplete
    }

    public var usesRepetitions: Bool { session.plan.exercises.contains { $0.target.unit == .repetitions } }
    public var usesSeconds: Bool { session.plan.exercises.contains { $0.target.unit == .seconds } }
}

public extension WorkoutSession {
    /// Distinct real loads in recording order. Plan defaults do not contribute.
    var recordedLoads: [RecordedLoad] {
        loggedSets.reduce(into: []) { values, log in
            if !values.contains(log.result.load) { values.append(log.result.load) }
        }
    }
}
