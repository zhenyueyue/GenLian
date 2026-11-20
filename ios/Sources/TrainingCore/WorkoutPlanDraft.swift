import Foundation

public struct WorkoutPlanDraft: Sendable {
    public struct Item: Identifiable, Sendable {
        public let exercise: Exercise
        public var sets: Int
        public var targetValue: Int

        public var id: String { exercise.id }
        public var targetRange: ClosedRange<Int> { exercise.target.unit == .seconds ? 1...600 : 1...100 }
        public var target: SetMeasurement {
            switch exercise.target.unit {
            case .repetitions: .repetitions(targetValue)
            case .seconds: .seconds(targetValue)
            }
        }

        public init(_ exercise: Exercise) {
            self.exercise = exercise
            sets = exercise.setsPerRound
            targetValue = exercise.target.value
        }

        fileprivate var configuredExercise: Exercise {
            Exercise(
                id: id, movementID: exercise.movementID, name: exercise.name,
                muscleGroup: exercise.muscleGroup, targetMuscle: exercise.targetMuscle,
                dumbbellCount: exercise.dumbbellCount, unilateral: exercise.unilateral,
                setsPerRound: sets, target: target, tempo: exercise.tempo,
                coachingCue: exercise.coachingCue, preparationCue: exercise.preparationCue
            )
        }
    }

    public static let titleLimit = 32
    public static let roundsRange = 1...10
    public static let restRange = 5...300
    public static let setsRange = 1...12

    public let id: String
    public var title: String
    public var rounds: Int
    public var exerciseRestSeconds: Int
    public var roundRestSeconds: Int
    public var items: [Item]

    public init() {
        id = "custom-\(UUID().uuidString.lowercased())"
        title = ""
        rounds = 1
        exerciseRestSeconds = 30
        roundRestSeconds = 60
        items = []
    }

    public init(editing plan: WorkoutPlan, rest: RestSettings) {
        id = plan.id
        title = plan.title
        rounds = plan.rounds
        exerciseRestSeconds = min(Self.restRange.upperBound, rest.exerciseSeconds)
        roundRestSeconds = min(Self.restRange.upperBound, rest.roundSeconds)
        items = plan.exercises.map(Item.init)
    }

    public func makePlan() -> WorkoutPlan? {
        let name = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard id.hasPrefix("custom-"), !name.isEmpty, name.count <= Self.titleLimit,
              Self.roundsRange.contains(rounds), Self.restRange.contains(exerciseRestSeconds),
              Self.restRange.contains(roundRestSeconds),
              Set(items.map(\.id)).count == items.count,
              items.allSatisfy({ Self.setsRange.contains($0.sets) && $0.targetRange.contains($0.targetValue) }) else {
            return nil
        }
        let plan = WorkoutPlan(
            id: id, category: .custom, title: name, subtitle: "按自定顺序训练",
            estimatedMinutesRange: "", rounds: rounds,
            exerciseRestSeconds: exerciseRestSeconds, roundRestSeconds: roundRestSeconds,
            exercises: items.map(\.configuredExercise)
        )
        return plan.isValid ? plan : nil
    }
}
