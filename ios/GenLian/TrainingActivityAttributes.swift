import ActivityKit
import Foundation

struct TrainingActivityAttributes: ActivityAttributes {
    enum Stage: String, Codable, Hashable, Sendable {
        case ready = "准备"
        case exercise = "动作"
        case rest = "休息"
        case restReady = "休息结束"
        case paused = "暂停"
    }

    struct ContentState: Codable, Hashable, Sendable {
        let stage: Stage
        let exercise: String
        let nextExercise: String?
        let round: Int
        let rounds: Int
        let restDeadline: Date?
    }

    let sessionID: UUID
    let course: String
}
