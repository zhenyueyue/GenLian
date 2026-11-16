import Foundation
import Testing
@testable import TrainingCore

@MainActor
final class TestClock: WorkoutClock {
    private var date: Date
    private var uptime: TimeInterval = 0

    init(date: Date = Date(timeIntervalSince1970: 1_800_000_000)) { self.date = date }

    func sample() -> WorkoutTime { WorkoutTime(date: date, monotonicSeconds: uptime) }

    func advance(_ seconds: TimeInterval, wallSeconds: TimeInterval? = nil) {
        uptime += seconds
        date = date.addingTimeInterval(wallSeconds ?? seconds)
    }
}

enum SaveFailure: Error { case interrupted }

@MainActor
final class TestStore: TrainingStore {
    private(set) var saved = TrainingArchive()
    var failNextSave = false

    func load() -> TrainingArchive { saved }

    func save(_ archive: TrainingArchive) throws {
        if failNextSave {
            failNextSave = false
            throw SaveFailure.interrupted
        }
        saved = archive
    }
}

@MainActor
struct WorkoutFixture {
    let clock: TestClock
    let store: TestStore
    let controller: TrainingController
    let id: UUID

    init(_ planID: String = "recovery", rest: RestSettings? = nil, planOverride: WorkoutPlan? = nil) throws {
        let plan: WorkoutPlan
        if let planOverride {
            plan = planOverride
        } else {
            plan = try #require(BuiltInCatalog.load().first { $0.id == planID })
        }
        let testClock = TestClock()
        let testStore = TestStore()
        let training = try TrainingController(store: testStore, clock: testClock)
        try #require(training.start(plan, rest: rest))
        clock = testClock
        store = testStore
        controller = training
        id = try #require(training.archive.current?.id)
    }

    func current() throws -> WorkoutSession { try #require(controller.archive.current) }

    @discardableResult
    func send(_ action: WorkoutAction) throws -> Bool { try controller.send(action, for: id) }

    func startMove() throws {
        let state = try current()
        try #require(send(.startPreparedAction(state.phase, state.position)))
    }

    func completeTarget() throws {
        let state = try current()
        try #require(send(.complete(state.currentKey, SetResult(state.currentExercise.target))))
    }

    func enterRest() throws {
        let owner = try #require(current().restOwner)
        try #require(send(.startRest(owner)))
    }

    func skipRest() throws {
        let owner = try #require(current().restOwner)
        try #require(send(.finishRest(owner)))
    }

    func tick(_ seconds: TimeInterval, wallSeconds: TimeInterval? = nil) throws {
        clock.advance(seconds, wallSeconds: wallSeconds)
        try controller.tick()
    }
}
