import Foundation

public enum WorkoutPhase: String, Codable, Sendable {
    case prepare, active, setComplete, rest, restReady, nextTransition, summary
}

public enum WorkoutOutcome: String, Codable, Sendable {
    case completed, partial, zeroSets
}

public enum WorkoutEndReason: String, Codable, Sendable {
    case reachedEndOfPlan, endedByUser
}

public struct RestTiming: Codable, Equatable, Sendable {
    public let kind: RestKind
    public internal(set) var targetSeconds: TimeInterval
    public internal(set) var actualSeconds: TimeInterval = 0

    public var remainingSeconds: TimeInterval {
        max(0, targetSeconds - actualSeconds)
    }
}

public enum RestAdjustment: Int, Sendable {
    case subtractFifteen = -15
    case addFifteen = 15
}

public enum WorkoutAction: Sendable {
    case startPreparedAction(WorkoutPhase, SetPosition)
    case chooseSide(Side, SetPosition)
    case updateDraft(SetKey, SetDraft)
    case completeDraft(SetKey)
    case complete(SetKey, SetResult)
    case editConfirmedSet(SetKey, SetResult)
    case startRest(SetKey)
    case adjustRest(SetKey, RestAdjustment)
    case finishRest(SetKey)
    case skipExercise(SetKey)
    case reviewPrevious(SetPosition)
    case returnToCurrent
    case pause
    case resume
    case saveForLater
    case end
}

public struct WorkoutSession: Codable, Equatable, Identifiable, Sendable {
    public let id: UUID
    public let plan: WorkoutPlan
    public let restSettings: RestSettings
    public let startedAt: Date
    public let timeZoneIdentifier: String?
    public let defaultLoad: RecordedLoad?
    public private(set) var endedAt: Date?
    public private(set) var outcome: WorkoutOutcome?
    public private(set) var endReason: WorkoutEndReason?
    public private(set) var phase: WorkoutPhase = .prepare
    public private(set) var position: SetPosition = .first
    public private(set) var side: Side
    public private(set) var reviewPosition: SetPosition?
    public private(set) var loggedSets: [LoggedSet] = []
    public private(set) var skippedSets: [SkippedSet] = []
    public private(set) var isPaused = false
    public private(set) var needsResume = false
    public private(set) var elapsedSeconds: TimeInterval = 0
    public private(set) var activitySeconds: TimeInterval = 0
    public private(set) var pausedSeconds: TimeInterval = 0
    public private(set) var rest: RestTiming?
    public private(set) var restOwner: SetKey?
    public private(set) var confirmationHeld = false
    public private(set) var checkpointAt: Date

    private var phaseSecondsRemaining: TimeInterval = 4
    private var currentSetStartedAt: Date?
    private var drafts: [SetKey: SetDraft]?
    private var setActivity: [SetKey: TimeInterval]?

    init(
        plan: WorkoutPlan, restSettings: RestSettings, defaultLoad: RecordedLoad? = nil,
        at date: Date, timeZone: TimeZone = .current
    ) {
        self.id = UUID()
        self.plan = plan
        self.restSettings = restSettings
        self.startedAt = date
        self.timeZoneIdentifier = timeZone.identifier
        self.defaultLoad = defaultLoad
        self.checkpointAt = date
        self.side = plan.exercises[0].unilateral ? .left : .bilateral
    }

    public var currentExercise: Exercise { plan.exercises[position.exerciseIndex] }
    public var currentKey: SetKey { SetKey(position: position, side: side) }
    public var currentDraft: SetDraft { drafts?[currentKey] ?? SetDraft() }
    public var currentActionSeconds: TimeInterval { setActivity?[currentKey] ?? 0 }
    public var canReviewPrevious: Bool { previousPosition(before: reviewPosition ?? position) != nil }

    public func initialLoad(for exercise: Exercise) -> RecordedLoad {
        exercise.dumbbellCount == 0 ? .bodyweight : defaultLoad ?? .unspecified
    }

    public var currentResult: SetResult {
        let measurement: SetMeasurement
        if let chosen = currentDraft.measurement {
            measurement = chosen
        } else if currentExercise.target.unit == .seconds {
            measurement = .seconds(Int(currentActionSeconds.rounded(.down)))
        } else {
            measurement = currentExercise.target
        }
        return SetResult(measurement, load: currentDraft.load ?? initialLoad(for: currentExercise))
    }
    public var countdownSeconds: TimeInterval? {
        switch phase {
        case .rest: rest?.remainingSeconds
        case .prepare, .setComplete, .nextTransition: phaseSecondsRemaining
        case .active, .restReady, .summary: nil
        }
    }

    public var totals: TrainingTotals {
        var repetitions = 0
        var holdSeconds = 0
        for log in loggedSets {
            switch log.result.measurement {
            case .repetitions(let count): repetitions += count
            case .seconds(let count): holdSeconds += count
            }
        }
        return TrainingTotals(
            completedSets: loggedSets.count, skippedSets: skippedSets.count,
            repetitions: repetitions, holdSeconds: holdSeconds
        )
    }

    mutating func apply(_ action: WorkoutAction, at date: Date) -> Bool {
        guard phase != .summary else { return false }
        switch action {
        case .end:
            finish(reason: .endedByUser, at: date)
            return true
        case .pause:
            guard !isPaused, !needsResume else { return false }
            isPaused = true
            return true
        case .resume:
            guard isPaused || needsResume else { return false }
            isPaused = false
            needsResume = false
            return true
        case .saveForLater:
            guard !needsResume else { return false }
            needsResume = true
            isPaused = false
            return true
        case .updateDraft(let key, let draft):
            // Load editing may temporarily pause the active action.
            guard phase == .active, !needsResume, reviewPosition == nil, key == currentKey else { return false }
            if let value = draft.measurement, value.unit != currentExercise.target.unit || value.value <= 0 { return false }
            if let load = draft.load, !load.isValid(for: currentExercise) { return false }
            var updated = drafts ?? [:]
            updated[key] = draft
            drafts = updated
            return true
        default:
            guard !isPaused, !needsResume else { return false }
            return applyRunningAction(action, at: date)
        }
    }

    private mutating func applyRunningAction(_ action: WorkoutAction, at date: Date) -> Bool {
        switch action {
        case .startPreparedAction(let expectedPhase, let expectedPosition):
            guard phase == expectedPhase, position == expectedPosition,
                  phase == .prepare || phase == .nextTransition else { return false }
            enterActive(at: date)
        case .chooseSide(let nextSide, let expectedPosition):
            guard phase == .active, reviewPosition == nil, position == expectedPosition,
                  side != nextSide, pendingSides(at: position).contains(nextSide) else { return false }
            side = nextSide
            currentSetStartedAt = date
        case .complete(let key, let result):
            return complete(key, result: result, at: date)
        case .completeDraft(let key):
            return complete(key, result: currentResult, at: date)
        case .editConfirmedSet(let key, let result):
            guard phase == .setComplete, key == restOwner,
                  let index = loggedSets.lastIndex(where: { $0.key == key }),
                  let result = result.validated(for: currentExercise) else { return false }
            loggedSets[index].result = result
            confirmationHeld = true
        case .startRest(let key):
            guard phase == .setComplete, key == restOwner else { return false }
            phase = .rest
        case .adjustRest(let key, let adjustment):
            guard key == restOwner, var updated = rest, phase == .rest || phase == .restReady,
                  phase != .restReady || adjustment == .addFifteen else { return false }
            let base = max(updated.targetSeconds, updated.actualSeconds)
            updated.targetSeconds = max(updated.actualSeconds + 5, base + Double(adjustment.rawValue))
            rest = updated
            phase = .rest
        case .finishRest(let key):
            guard key == restOwner, phase == .rest || phase == .restReady else { return false }
            leaveRest(at: date)
        case .skipExercise(let key):
            return skipExercise(key, at: date)
        case .reviewPrevious(let expectedPosition):
            guard phase == .active, (reviewPosition ?? position) == expectedPosition,
                  let previous = previousPosition(before: expectedPosition) else { return false }
            reviewPosition = previous
        case .returnToCurrent:
            guard reviewPosition != nil else { return false }
            reviewPosition = nil
        case .pause, .resume, .saveForLater, .end, .updateDraft:
            return false
        }
        return true
    }

    private mutating func complete(_ key: SetKey, result: SetResult, at date: Date) -> Bool {
        guard phase == .active, reviewPosition == nil, key == currentKey,
              pendingSides(at: position).contains(key.side),
              let result = result.validated(for: currentExercise) else { return false }
        let start = currentSetStartedAt ?? date
        loggedSets.append(LoggedSet(key: key, startedAt: start, endedAt: max(start, date), result: result, rest: nil))
        clearDraft(for: key)

        if let nextSide = pendingSides(at: position).first {
            side = nextSide
            currentSetStartedAt = date
            return true
        }
        guard let next = nextPosition(after: position) else {
            finish(reason: .reachedEndOfPlan, at: date)
            return true
        }

        let roundRest = next.round != position.round
        rest = RestTiming(
            kind: roundRest ? .round : .exercise,
            targetSeconds: Double(roundRest ? restSettings.roundSeconds : restSettings.exerciseSeconds)
        )
        restOwner = key
        confirmationHeld = false
        phaseSecondsRemaining = 4
        phase = .setComplete
        return true
    }

    private mutating func skipExercise(_ key: SetKey, at date: Date) -> Bool {
        guard phase == .active, reviewPosition == nil, key == currentKey else { return false }
        let last = SetPosition(round: position.round, exerciseIndex: position.exerciseIndex, set: currentExercise.setsPerRound)
        for set in position.set...last.set {
            let remaining = SetPosition(round: position.round, exerciseIndex: position.exerciseIndex, set: set)
            for missingSide in pendingSides(at: remaining) {
                let key = SetKey(position: remaining, side: missingSide)
                skippedSets.append(SkippedSet(key: key, date: date))
                clearDraft(for: key)
            }
        }
        if let next = nextPosition(after: last) {
            enterTransition(to: next)
        } else {
            finish(reason: .reachedEndOfPlan, at: date)
        }
        return true
    }

    private mutating func clearDraft(for key: SetKey) {
        drafts?.removeValue(forKey: key)
        setActivity?.removeValue(forKey: key)
    }

    private func pendingSides(at position: SetPosition) -> [Side] {
        let sides: [Side] = plan.exercises[position.exerciseIndex].unilateral ? [.left, .right] : [.bilateral]
        return sides.filter { side in
            let key = SetKey(position: position, side: side)
            return !loggedSets.contains { $0.key == key } && !skippedSets.contains { $0.key == key }
        }
    }

    public var upcomingPosition: SetPosition? { nextPosition(after: position) }

    private func nextPosition(after position: SetPosition) -> SetPosition? {
        if position.set < plan.exercises[position.exerciseIndex].setsPerRound {
            return SetPosition(round: position.round, exerciseIndex: position.exerciseIndex, set: position.set + 1)
        }
        if position.exerciseIndex + 1 < plan.exercises.count {
            return SetPosition(round: position.round, exerciseIndex: position.exerciseIndex + 1, set: 1)
        }
        if position.round < plan.rounds {
            return SetPosition(round: position.round + 1, exerciseIndex: 0, set: 1)
        }
        return nil
    }

    private func previousPosition(before position: SetPosition) -> SetPosition? {
        if position.set > 1 {
            return SetPosition(round: position.round, exerciseIndex: position.exerciseIndex, set: position.set - 1)
        }
        if position.exerciseIndex > 0 {
            let index = position.exerciseIndex - 1
            return SetPosition(round: position.round, exerciseIndex: index, set: plan.exercises[index].setsPerRound)
        }
        if position.round > 1 {
            let index = plan.exercises.count - 1
            return SetPosition(round: position.round - 1, exerciseIndex: index, set: plan.exercises[index].setsPerRound)
        }
        return nil
    }

    private mutating func leaveRest(at date: Date) {
        writeActualRest()
        if let next = upcomingPosition {
            enterTransition(to: next)
        } else {
            finish(reason: .reachedEndOfPlan, at: date)
        }
    }

    private mutating func writeActualRest() {
        guard let rest, let owner = restOwner,
              let index = loggedSets.lastIndex(where: { $0.key == owner }) else { return }
        loggedSets[index].rest = rest
    }

    private mutating func enterTransition(to next: SetPosition) {
        rest = nil
        restOwner = nil
        position = next
        side = currentExercise.unilateral ? .left : .bilateral
        currentSetStartedAt = nil
        phaseSecondsRemaining = 2
        phase = .nextTransition
    }

    private mutating func enterActive(at date: Date) {
        currentSetStartedAt = date
        phase = .active
    }

    private mutating func finish(reason: WorkoutEndReason, at date: Date) {
        if phase == .rest || phase == .restReady { writeActualRest() }
        rest = nil
        restOwner = nil
        reviewPosition = nil
        drafts = nil
        setActivity = nil
        endedAt = max(startedAt, date)
        if loggedSets.isEmpty {
            outcome = .zeroSets
        } else if reason == .reachedEndOfPlan, skippedSets.isEmpty, loggedSets.count == plan.plannedSetCount {
            outcome = .completed
        } else {
            outcome = .partial
        }
        endReason = reason
        isPaused = false
        needsResume = false
        phase = .summary
    }

    mutating func advanceForeground(by seconds: TimeInterval, at date: Date) {
        guard phase != .summary, seconds > 0 else { return }
        if isPaused {
            pausedSeconds += seconds
            return
        }
        guard !needsResume else { return }

        var budget = seconds
        while budget > 0 {
            switch phase {
            case .active:
                advanceAction(by: budget)
                return
            case .summary:
                return
            case .rest, .restReady:
                budget = advanceRest(by: budget, at: date)
            case .prepare, .setComplete, .nextTransition:
                if phase == .setComplete, confirmationHeld {
                    elapsedSeconds += budget
                    return
                }
                let used = min(budget, phaseSecondsRemaining)
                if phase != .prepare { elapsedSeconds += used }
                phaseSecondsRemaining -= used
                budget -= used
                guard phaseSecondsRemaining <= 0 else { return }
                if phase == .setComplete {
                    phase = .rest
                } else {
                    enterActive(at: max(startedAt, date.addingTimeInterval(-budget)))
                }
            }
        }
    }

    mutating func advanceWhileAway(by seconds: TimeInterval, at date: Date) {
        guard phase != .summary, !needsResume, seconds > 0 else { return }
        if isPaused {
            pausedSeconds += seconds
            return
        }
        // Only the current action or rest can consume an away interval. Confirmation and transition wait for the UI.
        switch phase {
        case .active:
            advanceAction(by: seconds)
        case .rest, .restReady:
            _ = advanceRest(by: seconds, at: date)
        case .prepare, .setComplete, .nextTransition, .summary:
            break
        }
    }

    mutating func recoverAfterProcessExit(at date: Date) {
        guard !isPaused, !needsResume else { return }
        switch phase {
        case .rest:
            // Wall time cannot prove that exercise continued after process exit. Only credit the scheduled rest left.
            let waiting = max(0, date.timeIntervalSince(checkpointAt))
            let remaining = rest?.remainingSeconds ?? 0
            if waiting > 0 {
                _ = advanceRest(by: min(waiting, remaining), at: date)
            }
        case .restReady, .summary:
            break
        case .prepare, .active, .setComplete, .nextTransition:
            needsResume = true
        }
    }

    private mutating func advanceAction(by seconds: TimeInterval) {
        elapsedSeconds += seconds
        guard reviewPosition == nil else { return }
        activitySeconds += seconds
        var durations = setActivity ?? [:]
        durations[currentKey, default: 0] += seconds
        setActivity = durations
    }

    private mutating func advanceRest(by seconds: TimeInterval, at date: Date) -> TimeInterval {
        guard var rest else { return 0 }
        if !restSettings.autoAdvance {
            rest.actualSeconds += seconds
            elapsedSeconds += seconds
            self.rest = rest
            if rest.remainingSeconds <= 0 { phase = .restReady }
            return 0
        }

        let used = min(seconds, rest.remainingSeconds)
        rest.actualSeconds += used
        elapsedSeconds += used
        self.rest = rest
        if rest.remainingSeconds <= 0 {
            leaveRest(at: date)
            return seconds - used
        }
        return 0
    }

    mutating func markCheckpoint(at date: Date) {
        checkpointAt = date
    }
}
