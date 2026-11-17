import ActivityKit
import Foundation

struct TrainingActivityAttributes: ActivityAttributes {
    enum Stage: String, Codable, Hashable, Sendable {
        case ready = "准备"
        case exercise = "动作"
        case rest = "休息"
        case restReady = "休息结束"
        case paused = "暂停"
        case completed = "完成"
    }

    struct ContentState: Codable, Hashable, Sendable {
        let stage: Stage
        let exercise: String
        let nextExercise: String?
        let round: Int
        let rounds: Int
        let restDeadline: Date?
        var nextRound: Int? = nil
        var autoAdvance: Bool? = nil
        var movementID: String? = nil
        var timerStart: Date? = nil
        var preparationDeadline: Date? = nil
        var preparationSeconds: Int? = nil
        var completedRounds: [Int]? = nil
    }

    let sessionID: UUID
    let course: String
}
