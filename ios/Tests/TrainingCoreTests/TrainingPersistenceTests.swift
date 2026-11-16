import Foundation
import Testing
@testable import TrainingCore

@Suite @MainActor
struct TrainingPersistenceTests {
    @Test(arguments: [10.0, 90.0])
    func backgroundAndLockWindowsPreserveCurrentSideAndUseMonotonicTime(awaySeconds: TimeInterval) throws {
        let fixture = try WorkoutFixture("strength-a")
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.enterRest()
        try fixture.skipRest()
        try fixture.startMove()
        try fixture.completeTarget()
        let key = try fixture.current().currentKey
        let draft = SetDraft(measurement: .repetitions(9), load: .measuredPerDumbbell(grams: 3300))
        try #require(try fixture.send(.updateDraft(key, draft)))
        try fixture.tick(7, wallSeconds: -3600)
        let before = try fixture.current()
        #expect(before.side == .right)
        try fixture.controller.becomeInactive()
        try fixture.controller.enterBackground()
        fixture.clock.advance(awaySeconds, wallSeconds: 7200)
        try fixture.controller.tick()
        #expect(try fixture.current().currentActionSeconds == 7)
        try fixture.controller.becomeInactive()
        try fixture.controller.returnToForeground()
        try fixture.controller.returnToForeground()
        let after = try fixture.current()
        #expect(after.phase == .active)
        #expect(!after.needsResume && !after.isPaused)
        #expect(after.currentKey == key)
        #expect(after.currentDraft == draft)
        #expect(after.currentResult == SetResult(.repetitions(9), load: .measuredPerDumbbell(grams: 3300)))
        #expect(after.currentActionSeconds == 7 + awaySeconds)
        #expect(after.activitySeconds == before.activitySeconds + awaySeconds)
        #expect(after.elapsedSeconds == before.elapsedSeconds + awaySeconds)
        #expect(after.pausedSeconds == 0)
        #expect(after.loggedSets == before.loggedSets && after.skippedSets == before.skippedSets)
        try fixture.tick(3)
        #expect(try fixture.current().currentActionSeconds == 10 + awaySeconds)
    }

    @Test func repeatedInactiveAndBackgroundCallbacksSettleEachIntervalOnce() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.tick(5)

        try fixture.controller.becomeInactive()
        fixture.clock.advance(2)
        try fixture.controller.becomeInactive()
        try fixture.controller.tick()
        #expect(try fixture.current().elapsedSeconds == 5)
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().elapsedSeconds == 7)

        for _ in 0..<3 {
            try fixture.controller.becomeInactive()
            fixture.clock.advance(1)
            try fixture.controller.enterBackground()
            fixture.clock.advance(10)
            try fixture.controller.enterBackground()
            try fixture.controller.becomeInactive()
            try fixture.controller.returnToForeground()
            try fixture.controller.returnToForeground()
        }
        #expect(try fixture.current().elapsedSeconds == 40)
        #expect(try fixture.current().activitySeconds == 40)
        #expect(try fixture.current().pausedSeconds == 0)
        #expect(try fixture.current().loggedSets.isEmpty)
        #expect(try !fixture.current().needsResume)
    }

    @Test func failedLifecycleSavesKeepClockAnchorForRetry() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        fixture.clock.advance(2)
        fixture.store.failNextSave = true
        #expect(throws: SaveFailure.self) { try fixture.controller.enterBackground() }
        #expect(try fixture.current().elapsedSeconds == 0)
        #expect(try !fixture.send(.pause))

        fixture.clock.advance(3)
        try fixture.controller.enterBackground()
        #expect(try fixture.current().elapsedSeconds == 5)
        fixture.clock.advance(7)
        fixture.store.failNextSave = true
        #expect(throws: SaveFailure.self) { try fixture.controller.returnToForeground() }
        #expect(try fixture.current().elapsedSeconds == 5)
        #expect(fixture.store.saved.current?.elapsedSeconds == 5)
        fixture.clock.advance(1)
        try fixture.controller.returnToForeground()
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().elapsedSeconds == 13)
        #expect(fixture.store.saved.current?.elapsedSeconds == 13)
    }

    @Test func backgroundKeepsSetConfirmationAndNextActionUnchanged() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.completeTarget()
        let confirmed = try fixture.current().loggedSets
        try fixture.controller.enterBackground()
        fixture.clock.advance(60)
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().phase == .setComplete)
        #expect(try fixture.current().countdownSeconds == 4)
        #expect(try fixture.current().loggedSets == confirmed)
        try fixture.enterRest()

        try fixture.controller.enterBackground()
        fixture.clock.advance(60)
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().phase == .nextTransition)
        let next = try fixture.current().currentKey
        try fixture.controller.enterBackground()
        fixture.clock.advance(60)
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().currentKey == next)
        #expect(try fixture.current().phase == .nextTransition)
        #expect(try fixture.current().countdownSeconds == 2)
        #expect(try fixture.current().loggedSets.count == 2)
        #expect(try fixture.current().activitySeconds == 0)
        #expect(try fixture.current().skippedSets.isEmpty)
    }

    @Test func explicitPauseFreezesRestAcrossBackground() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.completeTarget()
        try fixture.enterRest()
        try fixture.tick(5)
        try #require(try fixture.send(.pause))
        try fixture.tick(7)
        try fixture.controller.enterBackground()
        fixture.clock.advance(20)
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().rest?.actualSeconds == 5)
        #expect(try fixture.current().pausedSeconds == 27)
        #expect(try fixture.current().elapsedSeconds == 5)
        try #require(try fixture.send(.resume))
        try fixture.tick(15)
        #expect(try fixture.current().phase == .nextTransition)
        #expect(try fixture.current().countdownSeconds == 2)
    }

    @Test(arguments: [true, false])
    func backgroundRestSettlesOnce(auto: Bool) throws {
        let fixture = try WorkoutFixture(rest: RestSettings(exerciseSeconds: 20, roundSeconds: 30, autoAdvance: auto))
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.completeTarget()
        try fixture.enterRest()
        try fixture.tick(4)
        try fixture.controller.enterBackground()
        fixture.clock.advance(22)
        try fixture.controller.returnToForeground()
        try fixture.controller.returnToForeground()
        if auto {
            #expect(try fixture.current().phase == .nextTransition)
            #expect(try fixture.current().countdownSeconds == 2)
            #expect(try fixture.current().elapsedSeconds == 20)
            #expect(try fixture.current().loggedSets.last?.rest?.actualSeconds == 20)
        } else {
            #expect(try fixture.current().phase == .restReady)
            #expect(try fixture.current().rest?.actualSeconds == 26)
            #expect(try fixture.current().elapsedSeconds == 26)
            try fixture.tick(4)
            try fixture.skipRest()
            #expect(try fixture.current().loggedSets.last?.rest?.actualSeconds == 30)
        }
        #expect(try fixture.current().activitySeconds == 0)
        #expect(try fixture.current().loggedSets.count == 2)
    }

    @Test func restRestoresAfterProcessExitAndDoesNotSkipNextTransition() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.completeTarget()
        try fixture.enterRest()
        try fixture.tick(8)
        try fixture.controller.enterBackground()
        fixture.clock.advance(60)
        let relaunched = try TrainingController(store: fixture.store, clock: fixture.clock)
        let recovered = try #require(relaunched.archive.current)
        #expect(recovered.id == fixture.id)
        #expect(recovered.phase == .nextTransition)
        #expect(recovered.countdownSeconds == 2)
        #expect(recovered.loggedSets.last?.rest?.actualSeconds == 20)
        #expect(recovered.position.exerciseIndex == 1)
    }

    @Test func activeCheckpointSurvivesUnexpectedRestart() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.tick(15)
        let draft = SetDraft(measurement: .seconds(12))
        try #require(try fixture.send(.updateDraft(fixture.current().currentKey, draft)))
        try fixture.controller.enterBackground()
        let newProcessClock = TestClock(date: fixture.clock.sample().date.addingTimeInterval(86_400))
        let relaunched = try TrainingController(store: fixture.store, clock: newProcessClock)
        let recovered = try #require(relaunched.archive.current)
        #expect(recovered.id == fixture.id)
        #expect(recovered.needsResume)
        #expect(recovered.side == .right)
        #expect(recovered.activitySeconds == 15)
        #expect(recovered.elapsedSeconds == 15)
        #expect(recovered.currentActionSeconds == 15)
        #expect(recovered.currentDraft == draft)
        #expect(recovered.loggedSets.count == 1)
        #expect(recovered.loggedSets.first?.key.side == .left)
        try #require(try relaunched.send(.resume, for: recovered.id))
        newProcessClock.advance(2)
        try relaunched.tick()
        #expect(relaunched.archive.current?.currentActionSeconds == 17)
    }

    @Test func coldManualRestCreditsOnlyScheduledRemainder() throws {
        let fixture = try WorkoutFixture(rest: RestSettings(exerciseSeconds: 20, roundSeconds: 30, autoAdvance: false))
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.completeTarget()
        try fixture.enterRest()
        try fixture.tick(8)
        try fixture.controller.enterBackground()
        let coldClock = TestClock(date: fixture.clock.sample().date.addingTimeInterval(86_400))
        let relaunched = try TrainingController(store: fixture.store, clock: coldClock)
        #expect(relaunched.archive.current?.phase == .restReady)
        #expect(relaunched.archive.current?.rest?.actualSeconds == 20)
        #expect(relaunched.archive.current?.elapsedSeconds == 20)
        #expect(relaunched.archive.current?.activitySeconds == 0)
        coldClock.advance(86_400)
        let reopened = try TrainingController(store: fixture.store, clock: coldClock)
        #expect(reopened.archive.current?.phase == .restReady)
        #expect(reopened.archive.current?.elapsedSeconds == 20)
        #expect(reopened.archive.current?.loggedSets.count == 2)
    }

    @Test func savedForLaterResumesSameSideFromDiskThenArchivesOnce() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let file = directory.appendingPathComponent("training.json")
        let store = AtomicTrainingStore(file: file)
        let clock = TestClock()
        let plan = try #require(BuiltInCatalog.load().first { $0.id == "recovery" })
        let original = try TrainingController(store: store, clock: clock)
        #expect(original.archive.history.isEmpty)
        try #require(try original.start(plan))
        let started = try #require(original.archive.current)
        try #require(try original.send(.startPreparedAction(.prepare, started.position), for: started.id))
        try #require(try original.send(.complete(started.currentKey, SetResult(.seconds(28))), for: started.id))
        try #require(try original.send(.saveForLater, for: started.id))
        clock.advance(500)

        let relaunched = try TrainingController(store: store, clock: clock)
        let restored = try #require(relaunched.archive.current)
        #expect(restored.id == started.id)
        #expect(restored.needsResume)
        #expect(restored.side == .right)
        #expect(restored.totals.holdSeconds == 28)
        #expect(restored.activitySeconds == 0)
        try #require(try relaunched.send(.resume, for: restored.id))
        try #require(try relaunched.send(.end, for: restored.id))

        let summaryAfterRestart = try TrainingController(store: store, clock: clock)
        #expect(summaryAfterRestart.archive.current?.outcome == .partial)
        #expect(try summaryAfterRestart.archiveFinished(restored.id))
        #expect(try !summaryAfterRestart.archiveFinished(restored.id))
        let record = try store.load()
        #expect(record.current == nil)
        #expect(record.history.map(\.id) == [restored.id])
        #expect(record.history.first?.totals.completedSets == 1)
    }

    @Test func failedWriteLeavesDurableAndPublishedStateForRetry() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        let key = try fixture.current().currentKey
        let action = WorkoutAction.complete(key, SetResult(.seconds(22)))
        fixture.store.failNextSave = true
        #expect(throws: SaveFailure.self) { try fixture.send(action) }
        #expect(try fixture.current().loggedSets.isEmpty)
        #expect(fixture.store.saved.current?.loggedSets.isEmpty == true)
        #expect(try fixture.send(action))
        #expect(try !fixture.send(action))
        try #require(try fixture.send(.end))

        fixture.store.failNextSave = true
        #expect(throws: SaveFailure.self) { try fixture.controller.archiveFinished(fixture.id) }
        #expect(fixture.controller.archive.current?.phase == .summary)
        #expect(fixture.controller.archive.history.isEmpty)
        #expect(try fixture.controller.archiveFinished(fixture.id))
        #expect(fixture.store.saved.history.count == 1)
    }

    @Test func editingLoadWhilePausedSurvivesSavingForLater() throws {
        let fixture = try WorkoutFixture("strength-a")
        try fixture.startMove()
        let first = try fixture.current()
        try fixture.tick(4)
        try #require(try fixture.send(.pause))
        try #require(try fixture.send(.updateDraft(first.currentKey, SetDraft(
            measurement: .repetitions(9), load: .measuredPerDumbbell(grams: 3300)
        ))))
        try #require(try fixture.send(.saveForLater))
        try fixture.controller.enterBackground()
        fixture.clock.advance(120)
        try fixture.controller.returnToForeground()
        #expect(try fixture.current().needsResume)
        #expect(try fixture.current().currentActionSeconds == 4)
        fixture.clock.advance(300)
        let reopened = try TrainingController(store: fixture.store, clock: fixture.clock)
        let current = try #require(reopened.archive.current)
        #expect(current.needsResume)
        #expect(!current.isPaused)
        #expect(current.currentActionSeconds == 4)
        #expect(current.currentResult == SetResult(.repetitions(9), load: .measuredPerDumbbell(grams: 3300)))
        try #require(try reopened.send(.resume, for: fixture.id))
        try #require(try reopened.send(.completeDraft(current.currentKey), for: fixture.id))
        #expect(reopened.archive.current?.loggedSets.first?.result == current.currentResult)
    }

    @Test func versionOneSnapshotsDecodeWithoutOptionalDraftFields() throws {
        let fixture = try WorkoutFixture()
        let plain = try JSONEncoder().encode(fixture.current())
        let object = try JSONSerialization.jsonObject(with: plain)
        var map = try #require(object as? [String: Any])
        map.removeValue(forKey: "drafts")
        map.removeValue(forKey: "setActivity")
        map.removeValue(forKey: "defaultLoad")
        map.removeValue(forKey: "timeZoneIdentifier")
        let historical = try JSONSerialization.data(withJSONObject: map)
        let recovered = try JSONDecoder().decode(WorkoutSession.self, from: historical)
        #expect(recovered.currentDraft == SetDraft())
        #expect(recovered.currentActionSeconds == 0)
        #expect(recovered.defaultLoad == nil)
        #expect(recovered.timeZoneIdentifier == nil)
        let local = try #require(TimeZone(identifier: "Asia/Shanghai"))
        #expect(recovered.historyTimeZone(fallback: local) == local)
    }

    @Test func unsupportedSchemaIsReportedWithoutResettingStore() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let file = directory.appendingPathComponent("training.json")
        let existing = Data(#"{"version":99}"#.utf8)
        try existing.write(to: file)
        let store = AtomicTrainingStore(file: file)
        #expect(throws: TrainingStoreError.unsupportedSchema(99)) {
            try TrainingController(store: store, clock: TestClock())
        }
        #expect(try Data(contentsOf: file) == existing)
    }
}
