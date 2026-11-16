import Foundation

public enum WorkoutCategory: String, Codable, Sendable {
    case strengthA = "力量 A"
    case strengthB = "力量 B"
    case cardio = "有氧"
    case recovery = "恢复日"
}

public enum SetMeasurement: Codable, Equatable, Sendable {
    case repetitions(Int)
    case seconds(Int)

    public enum Unit: Equatable, Sendable { case repetitions, seconds }

    public var unit: Unit {
        switch self {
        case .repetitions: .repetitions
        case .seconds: .seconds
        }
    }

    public var value: Int {
        switch self {
        case .repetitions(let value), .seconds(let value): value
        }
    }
}

public struct Exercise: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let movementID: String
    public let name: String
    public let muscleGroup: String
    public let targetMuscle: String
    public let dumbbellCount: Int
    public let unilateral: Bool
    public let setsPerRound: Int
    public let target: SetMeasurement
    public let tempo: String
    public let coachingCue: String
    public let preparationCue: String
}

public struct WorkoutPlan: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let category: WorkoutCategory
    public let title: String
    public let subtitle: String
    public let estimatedMinutesRange: String
    public let rounds: Int
    public let exerciseRestSeconds: Int
    public let roundRestSeconds: Int
    public let exercises: [Exercise]

    public var plannedSetCount: Int {
        rounds * exercises.reduce(0) { $0 + $1.setsPerRound * ($1.unilateral ? 2 : 1) }
    }

    var isValid: Bool {
        rounds > 0 && exerciseRestSeconds >= 5 && roundRestSeconds >= 5 && !exercises.isEmpty &&
            exercises.allSatisfy {
                $0.setsPerRound > 0 && $0.target.value > 0 && (0...2).contains($0.dumbbellCount)
            }
    }
}

public enum BuiltInCatalog {
    public static func load() throws -> [WorkoutPlan] {
        guard let url = Bundle.module.url(forResource: "WorkoutPlans", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try JSONDecoder().decode([WorkoutPlan].self, from: Data(contentsOf: url))
    }
}

public struct RestSettings: Codable, Equatable, Sendable {
    public let exerciseSeconds: Int
    public let roundSeconds: Int
    public let autoAdvance: Bool

    public init(exerciseSeconds: Int, roundSeconds: Int, autoAdvance: Bool = true) {
        self.exerciseSeconds = max(5, exerciseSeconds)
        self.roundSeconds = max(5, roundSeconds)
        self.autoAdvance = autoAdvance
    }

    public init(plan: WorkoutPlan) {
        self.init(exerciseSeconds: plan.exerciseRestSeconds, roundSeconds: plan.roundRestSeconds)
    }
}

public enum Side: String, Codable, Hashable, Sendable {
    case left, right, bilateral
}

public struct SetPosition: Codable, Hashable, Sendable {
    public let round: Int
    public let exerciseIndex: Int
    public let set: Int

    public init(round: Int, exerciseIndex: Int, set: Int) {
        self.round = round
        self.exerciseIndex = exerciseIndex
        self.set = set
    }

    static let first = SetPosition(round: 1, exerciseIndex: 0, set: 1)
}

public struct SetKey: Codable, Hashable, Sendable {
    public let position: SetPosition
    public let side: Side

    public init(position: SetPosition, side: Side) {
        self.position = position
        self.side = side
    }
}

public enum Effort: String, Codable, Sendable {
    case easy, appropriate, hard
}

public enum RecordedLoad: Codable, Equatable, Sendable {
    case unspecified
    case bodyweight
    case platesPerDumbbell(grams: Int)
    case measuredPerDumbbell(grams: Int)

    func isValid(for exercise: Exercise) -> Bool {
        switch self {
        case .unspecified: true
        case .bodyweight: exercise.dumbbellCount == 0
        case .platesPerDumbbell(let grams): exercise.dumbbellCount > 0 && grams >= 0
        case .measuredPerDumbbell(let grams): exercise.dumbbellCount > 0 && grams > 0
        }
    }
}

public struct SetResult: Codable, Equatable, Sendable {
    public let measurement: SetMeasurement
    public let load: RecordedLoad
    public let effort: Effort?

    public init(_ measurement: SetMeasurement, load: RecordedLoad = .unspecified, effort: Effort? = nil) {
        self.measurement = measurement
        self.load = load
        self.effort = effort
    }

    func validated(for exercise: Exercise) -> SetResult? {
        guard measurement.unit == exercise.target.unit, measurement.value > 0, load.isValid(for: exercise) else {
            return nil
        }
        if exercise.dumbbellCount == 0 {
            return SetResult(measurement, load: .bodyweight, effort: effort)
        }
        return self
    }
}

public struct SetDraft: Codable, Equatable, Sendable {
    public var measurement: SetMeasurement?
    public var load: RecordedLoad?

    public init(measurement: SetMeasurement? = nil, load: RecordedLoad? = nil) {
        self.measurement = measurement
        self.load = load
    }
}

public enum RestKind: String, Codable, Sendable {
    case exercise, round
}

public struct LoggedSet: Codable, Equatable, Sendable {
    public let key: SetKey
    public let startedAt: Date
    public let endedAt: Date
    public internal(set) var result: SetResult
    public internal(set) var rest: RestTiming?
}

public struct SkippedSet: Codable, Equatable, Sendable {
    public let key: SetKey
    public let date: Date
}

public struct TrainingTotals: Equatable, Sendable {
    public let completedSets: Int
    public let skippedSets: Int
    public let repetitions: Int
    public let holdSeconds: Int
}

public struct PlateInventory: Equatable, Sendable {
    public static let builtIn = PlateInventory(available: [1250: 4, 1500: 4, 2000: 4, 2500: 4])
    public let available: [Int: Int]

    public var totalGrams: Int {
        available.reduce(0) { $0 + $1.key * $1.value }
    }

    // Counts must fit across the four sides of two equally loaded dumbbells.
    public func symmetricPlatesPerDumbbell(gramsPerSide: [Int]) -> Int? {
        var used: [Int: Int] = [:]
        for grams in gramsPerSide {
            guard let count = available[grams], used[grams, default: 0] + 4 <= count else { return nil }
            used[grams, default: 0] += 4
        }
        return 2 * gramsPerSide.reduce(0, +)
    }
}
