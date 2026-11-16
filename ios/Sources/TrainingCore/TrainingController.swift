import Foundation

public struct WorkoutTime: Sendable {
    public let date: Date
    public let monotonicSeconds: TimeInterval

    public init(date: Date, monotonicSeconds: TimeInterval) {
        self.date = date
        self.monotonicSeconds = monotonicSeconds
    }
}

@MainActor
public protocol WorkoutClock {
    func sample() -> WorkoutTime
}

public struct SystemWorkoutClock: WorkoutClock {
    private let clock = ContinuousClock()
    private let origin: ContinuousClock.Instant

    public init() { origin = clock.now }

    public func sample() -> WorkoutTime {
        let duration = origin.duration(to: clock.now).components
        let seconds = Double(duration.seconds) + Double(duration.attoseconds) / 1e18
        return WorkoutTime(date: Date(), monotonicSeconds: seconds)
    }
}

public enum TrainingError: Error, Equatable {
    case invalidPlan
}

/// Owns the active session and publishes a change only after its required save succeeds.
@MainActor
public final class TrainingController {
    private enum Visibility: Equatable {
        case active, inactive, background
    }

    public private(set) var archive: TrainingArchive
    private let store: any TrainingStore
    private let clock: any WorkoutClock
    private var lastSample: WorkoutTime
    private var lastSaveSeconds: TimeInterval
    private var visibility: Visibility = .active
    private let checkpointInterval: TimeInterval = 15

    public init(store: any TrainingStore, clock: any WorkoutClock = SystemWorkoutClock()) throws {
        self.store = store
        self.clock = clock
        let now = clock.sample()
        lastSample = now
        lastSaveSeconds = now.monotonicSeconds
        archive = try store.load()
        if let stored = archive.current, stored.phase != .summary {
            var recovered = stored
            recovered.recoverAfterProcessExit(at: now.date)
            if recovered != stored {
                var next = archive
                next.current = recovered
                try commit(next, at: now)
            }
        }
    }

    @discardableResult
    public func start(
        _ plan: WorkoutPlan, rest: RestSettings? = nil, load: RecordedLoad? = nil, timeZone: TimeZone = .current
    ) throws -> Bool {
        guard visibility == .active, archive.current == nil else { return false }
        guard plan.isValid else { throw TrainingError.invalidPlan }
        let now = clock.sample()
        var next = archive
        let loadExercise = plan.exercises.first { $0.dumbbellCount > 0 }
        let checkedLoad = load.flatMap { value -> RecordedLoad? in
            guard let loadExercise, value.isValid(for: loadExercise) else { return nil }
            return value
        }
        next.current = WorkoutSession(
            plan: plan, restSettings: rest ?? RestSettings(plan: plan), defaultLoad: checkedLoad, at: now.date,
            timeZone: timeZone
        )
        try commit(next, at: now)
        lastSample = now
        return true
    }

    @discardableResult
    public func send(_ action: WorkoutAction, for sessionID: UUID) throws -> Bool {
        guard visibility == .active, archive.current?.id == sessionID else { return false }
        return try updateForeground(at: clock.sample(), action: action)
    }

    public func tick() throws {
        guard visibility == .active else { return }
        try updateForeground(at: clock.sample())
    }

    public func becomeInactive() throws {
        guard visibility == .active else { return }
        try leaveInteractiveScene(at: clock.sample(), forceSave: false)
    }

    public func enterBackground() throws {
        guard visibility != .background else { return }
        let now = clock.sample()
        if visibility == .active {
            try leaveInteractiveScene(at: now, forceSave: true)
        } else {
            try settleAway(at: now, forceSave: true)
        }
        visibility = .background
    }

    public func returnToForeground() throws {
        guard visibility != .active else { return }
        try settleAway(at: clock.sample())
        visibility = .active
    }

    @discardableResult
    public func archiveFinished(_ sessionID: UUID) throws -> Bool {
        guard visibility == .active, let current = archive.current,
              current.id == sessionID, current.phase == .summary,
              !archive.history.contains(where: { $0.id == sessionID }) else { return false }
        let now = clock.sample()
        var next = archive
        next.current = nil
        next.history.insert(current, at: 0)
        try commit(next, at: now)
        return true
    }

    private func leaveInteractiveScene(at now: WorkoutTime, forceSave: Bool) throws {
        // Stop foreground work even if the write fails. Keep the last successful clock anchor for retry.
        defer { visibility = .inactive }
        try updateForeground(at: now, forceSave: forceSave)
    }

    private func settleAway(at now: WorkoutTime, forceSave: Bool = false) throws {
        if let current = archive.current, current.phase != .summary {
            var updated = current
            updated.advanceWhileAway(by: elapsed(at: now), at: now.date)
            if updated != current || forceSave {
                var next = archive
                next.current = updated
                try commit(next, at: now)
            }
        }
        lastSample = now
    }

    @discardableResult
    private func updateForeground(at now: WorkoutTime, action: WorkoutAction? = nil, forceSave: Bool = false) throws -> Bool {
        guard let current = archive.current, current.phase != .summary else { return false }
        var updated = current
        updated.advanceForeground(by: elapsed(at: now), at: now.date)
        let applied = action.map { updated.apply($0, at: now.date) } ?? false
        var next = archive
        next.current = updated
        let periodicSave = updated != current && now.monotonicSeconds - lastSaveSeconds >= checkpointInterval
        if applied || forceSave || updated.phase != current.phase || periodicSave {
            try commit(next, at: now)
        } else {
            archive = next
        }
        lastSample = now
        return applied
    }

    private func elapsed(at time: WorkoutTime) -> TimeInterval {
        max(0, time.monotonicSeconds - lastSample.monotonicSeconds)
    }

    private func commit(_ candidate: TrainingArchive, at now: WorkoutTime) throws {
        var next = candidate
        next.current?.markCheckpoint(at: now.date)
        try store.save(next)
        archive = next
        lastSaveSeconds = now.monotonicSeconds
    }
}
