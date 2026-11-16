import Foundation

public enum RestActivityPresentation: Equatable {
    case countdown(until: Date)
    case next(exercise: String?, round: Int, waitsForConfirmation: Bool)

    public static func resolve(
        deadline: Date?, isStale: Bool, now: Date,
        nextExercise: String?, nextRound: Int, autoAdvance: Bool
    ) -> Self {
        if !isStale, let deadline, now < deadline { return .countdown(until: deadline) }
        return .next(exercise: nextExercise, round: nextRound, waitsForConfirmation: !autoAdvance)
    }
}
