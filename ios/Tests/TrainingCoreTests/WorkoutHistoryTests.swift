import Foundation
import Testing
@testable import TrainingCore

@Suite @MainActor
struct WorkoutHistoryTests {
    @Test func fullStrengthAReportUsesActualSetsLoadsAndExerciseOrder() throws {
        let store = TestStore()
        let clock = TestClock()
        let controller = try TrainingController(store: store, clock: clock)
        let session = try finish(plan("strength-a"), using: controller, clock: clock)
        let report = WorkoutReport(session: session)
        #expect(session.outcome == .completed)
        #expect(report.completedExercises == 12)
        #expect(report.plannedExercises == 12)
        #expect(report.totals.completedSets == 15)
        #expect(report.totals.repetitions == 180)
        #expect(report.totals.holdSeconds == 0)
        #expect(report.usesRepetitions)
        #expect(!report.usesSeconds)
        #expect(session.elapsedSeconds == 30)
        #expect(report.incompleteRounds.isEmpty)
        #expect(report.completedRounds.map(\.number) == [1, 2, 3])
        #expect(report.completedRounds.first?.entries.map(\.key.side) == [.bilateral, .left, .right, .bilateral, .bilateral])
        #expect(session.recordedLoads == [.measuredPerDumbbell(grams: 3300), .bodyweight])
    }

    @Test func recoveryReportSeparatesRecordedSecondsAndRepetitions() throws {
        let clock = TestClock()
        let controller = try TrainingController(store: TestStore(), clock: clock)
        let session = try finish(plan("recovery"), using: controller, clock: clock)
        let report = WorkoutReport(session: session)
        #expect(report.totals.completedSets == 6)
        #expect(report.completedExercises == 4)
        #expect(report.totals.holdSeconds == 72)
        #expect(report.totals.repetitions == 20)
        #expect(report.usesSeconds && report.usesRepetitions)
        #expect(session.elapsedSeconds == 76)
        #expect(session.recordedLoads == [.bodyweight])
    }

    @Test func partialSingleSideRetainsLeftAndUnfinishedRight() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        let left = try fixture.current().currentKey
        try #require(try fixture.send(.complete(left, SetResult(.seconds(17), effort: .hard))))
        try #require(try fixture.send(.end))
        let report = try WorkoutReport(session: fixture.current())
        #expect(report.session.outcome == .partial)
        #expect(report.session.endReason == .endedByUser)
        #expect(report.completedExercises == 0)
        #expect(report.totals.completedSets == 1)
        #expect(report.unfinishedSets == 5)
        #expect(report.totals.skippedSets == 0)
        let done = try #require(report.completedRounds.first?.entries.first)
        let unfinished = try #require(report.incompleteRounds.first?.entries.first)
        #expect(done.key.side == .left)
        if case .completed(let recorded) = done.status {
            #expect(recorded.result.effort == .hard)
        } else {
            Issue.record("Expected the left side to be logged")
        }
        #expect(unfinished.key.side == .right)
        #expect(unfinished.status == .unfinished)
    }

    @Test func skippedRightAndUnreachedSetsAreDistinctAfterExit() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        let right = try fixture.current().currentKey
        try #require(try fixture.send(.skipExercise(right)))
        try #require(try fixture.send(.end))
        let report = try WorkoutReport(session: fixture.current())
        #expect(report.totals.skippedSets == 1)
        #expect(report.unfinishedSets == 4)
        #expect(report.completedExercises == 0)
        let skipped = try #require(report.incompleteRounds.first?.entries.first)
        if case .skipped(let log) = skipped.status {
            #expect(log.key == right)
        } else {
            Issue.record("Expected a recorded skip for the right side")
        }
        #expect(report.session.loggedSets.first?.rest == nil)
    }

    @Test func sameDayKeepsEachRecordAndZeroDoesNotInflateStatistics() throws {
        let zone = try #require(TimeZone(identifier: "Asia/Shanghai"))
        let clock = try TestClock(date: instant(year: 2026, month: 11, day: 5, hour: 8, timeZone: zone))
        let controller = try TrainingController(store: TestStore(), clock: clock)
        let complete = try finish(plan("strength-a"), using: controller, clock: clock, timeZone: zone)
        try #require(try controller.archiveFinished(complete.id))
        clock.advance(3600)
        let partial = try endRecovery(using: controller, clock: clock, timeZone: zone, logFirstSide: true)
        try #require(try controller.archiveFinished(partial.id))
        clock.advance(3600)
        let zero = try endRecovery(using: controller, clock: clock, timeZone: zone, logFirstSide: false)
        try #require(try controller.archiveFinished(zero.id))

        let history = TrainingHistory(archive: controller.archive, legacyTimeZone: zone)
        let day = complete.trainingDay(fallback: zone)
        let group = history.records(on: day)
        #expect(group.records.map(\.id) == [zero.id, partial.id, complete.id])
        #expect(group.completed == 1)
        #expect(group.partial == 1)
        #expect(group.zero == 1)
        #expect(group.primaryOutcome == .completed)
        #expect(history.statistics == HistoryStatistics(
            effectiveSessions: 2, completedSessions: 1, elapsedSeconds: 35, loggedSets: 16
        ))
        #expect(zero.elapsedSeconds == 60)
        let recovery = TrainingHistory(archive: controller.archive, filter: .recovery, legacyTimeZone: zone)
        #expect(recovery.records(on: day).records.map(\.id) == [zero.id, partial.id])
        #expect(recovery.records(on: day).primaryOutcome == .partial)
        #expect(recovery.statistics.effectiveSessions == 1)
        #expect(recovery.statistics.elapsedSeconds == 5)
    }

    @Test func crossMidnightAndMonthStayOnOriginalLocalStartDay() throws {
        let zone = try #require(TimeZone(identifier: "Asia/Shanghai"))
        let viewer = try #require(TimeZone(identifier: "Pacific/Auckland"))
        let start = try instant(year: 2026, month: 10, day: 31, hour: 23, minute: 59, second: 50, timeZone: zone)
        let clock = TestClock(date: start)
        let store = TestStore()
        let controller = try TrainingController(store: store, clock: clock)
        let going = try startRecovery(using: controller, timeZone: zone)
        clock.advance(20)
        try #require(try controller.send(.completeDraft(going.currentKey), for: going.id))
        try #require(try controller.send(.end, for: going.id))
        try #require(try controller.archiveFinished(going.id))
        let reopened = try TrainingController(store: store, clock: clock)
        let record = try #require(reopened.archive.history.first)
        let recordedDay = record.trainingDay(fallback: viewer)
        let end = try #require(record.endedAt)
        let endDay = TrainingDay(containing: end, in: record.historyTimeZone(fallback: viewer))
        let viewerStartDay = TrainingDay(containing: start, in: viewer)
        #expect(recordedDay.month == 10 && recordedDay.day == 31)
        #expect(endDay.month == 11 && endDay.day == 1)
        #expect(viewerStartDay == endDay)
        #expect(record.elapsedSeconds == 20)
        let october = TrainingMonth(containing: recordedDay)
        #expect(october.days.count == 31)
        let november = october.addingMonths(1)
        #expect(november.month == 11 && november.days.count == 30)
        #expect(november.mondayFirstOffset == 6)
        #expect(november.addingMonths(-1) == october)
        let history = TrainingHistory(archive: reopened.archive, legacyTimeZone: viewer)
        #expect(history.records(on: recordedDay).records.map(\.id) == [going.id])
        #expect(history.records(on: endDay).records.isEmpty)
    }

    @Test func calendarHandlesLeapFebruaryAndYearRollover() throws {
        let leapDay = try TrainingDay(containing: instant(year: 2028, month: 2, day: 29, hour: 12), in: .gmt)
        let february = TrainingMonth(containing: leapDay)
        #expect(february.days.count == 29)
        #expect(february.mondayFirstOffset == 1)
        let previousDecember = february.addingMonths(-2)
        #expect(previousDecember.year == 2027 && previousDecember.month == 12)
        #expect(previousDecember.addingMonths(1).year == 2028)
    }

    @Test func restoredPartialSurvivesFailedArchiveAndAppearsExactlyOnce() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        try #require(try fixture.send(.saveForLater))
        let resumed = try TrainingController(store: fixture.store, clock: fixture.clock)
        try #require(try resumed.send(.resume, for: fixture.id))
        try #require(try resumed.send(.end, for: fixture.id))
        fixture.store.failNextSave = true
        #expect(throws: SaveFailure.self) { try resumed.archiveFinished(fixture.id) }
        #expect(resumed.archive.history.isEmpty)
        #expect(resumed.archive.current?.outcome == .partial)
        let restarted = try TrainingController(store: fixture.store, clock: fixture.clock)
        try #require(try restarted.archiveFinished(fixture.id))
        #expect(try !restarted.archiveFinished(fixture.id))

        let reopened = try TrainingController(store: fixture.store, clock: fixture.clock)
        #expect(try !reopened.archiveFinished(fixture.id))
        #expect(reopened.archive.current == nil)
        let history = TrainingHistory(archive: reopened.archive)
        #expect(history.records.map(\.id) == [fixture.id])
        #expect(history.statistics.effectiveSessions == 1)
        #expect(history.statistics.completedSessions == 0)
        #expect(history.statistics.loggedSets == 1)
    }

    @Test func changedCourseDoesNotRewriteHistoricalSnapshotOnDisk() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let store = AtomicTrainingStore(file: directory.appendingPathComponent("training.json"))
        let clock = TestClock()
        let controller = try TrainingController(store: store, clock: clock)
        let existing = try plan("strength-a")
        let completed = try finish(existing, using: controller, clock: clock)
        try #require(try controller.archiveFinished(completed.id))
        let replacement = WorkoutPlan(
            id: existing.id, category: existing.category, title: "新计划标题", subtitle: "",
            estimatedMinutesRange: "", rounds: 1, exerciseRestSeconds: 15, roundRestSeconds: 20,
            exercises: Array(existing.exercises.reversed())
        )
        clock.advance(1800)
        let relaunched = try TrainingController(store: store, clock: clock)
        try #require(try relaunched.start(replacement))
        let restored = try #require(relaunched.archive.history.first)
        #expect(restored == completed)
        #expect(restored.plan == existing)
        #expect(WorkoutReport(session: restored).completedRounds.first?.entries.first?.exercise == existing.exercises.first)
        #expect(relaunched.archive.current?.plan == replacement)
    }

    @Test func emptyArchiveHasNoEffectiveTraining() throws {
        let result = TrainingHistory(archive: TrainingArchive())
        #expect(result.records.isEmpty)
        #expect(result.records(on: TrainingDay(containing: .now, in: .gmt)).primaryOutcome == nil)
        #expect(result.statistics == HistoryStatistics(effectiveSessions: 0, completedSessions: 0, elapsedSeconds: 0, loggedSets: 0))
    }

    @Test func customPlanPreservesSequenceMeasurementsAndArchivedSnapshot() throws {
        let press = try #require(try plan("strength-a").exercises.first)
        let stretch = try #require(try plan("recovery").exercises.first)
        var draft = WorkoutPlanDraft()
        draft.title = "  居家力量与伸展  "
        draft.items = [.init(stretch), .init(press)]
        draft.items.swapAt(0, 1)
        draft.items[0].sets = 2
        draft.items[0].targetValue = 8
        draft.items[1].targetValue = 25
        draft.exerciseRestSeconds = 45
        let workout = try #require(draft.makePlan())

        #expect(workout.title == "居家力量与伸展")
        #expect(workout.category == .custom)
        #expect(workout.exercises.map(\.id) == [press.id, stretch.id])
        #expect(workout.exercises.map(\.target) == [.repetitions(8), .seconds(25)])
        #expect(workout.plannedSetCount == 4)

        let store = TestStore()
        let clock = TestClock()
        let controller = try TrainingController(store: store, clock: clock)
        let completed = try finish(workout, using: controller, clock: clock)
        #expect(completed.restSettings.exerciseSeconds == 45)
        #expect(completed.loggedSets.map(\.key.side) == [.bilateral, .bilateral, .left, .right])
        #expect(completed.loggedSets.map(\.result.measurement) == [.repetitions(8), .repetitions(8), .seconds(18), .seconds(18)])
        try #require(try controller.archiveFinished(completed.id))

        var edited = WorkoutPlanDraft(editing: workout, rest: completed.restSettings)
        edited.items.removeFirst()
        let replacement = try #require(edited.makePlan())
        #expect(replacement.id == workout.id)
        try #require(try controller.start(replacement))
        let encoded = try JSONEncoder().encode(controller.archive)
        let decoded = try JSONDecoder().decode(TrainingArchive.self, from: encoded)
        #expect(decoded.history.first?.plan == workout)
        #expect(decoded.current?.plan == replacement)
    }

    private func plan(_ id: String) throws -> WorkoutPlan {
        try #require(BuiltInCatalog.load().first { $0.id == id })
    }

    private func instant(
        year: Int, month: Int, day: Int, hour: Int, minute: Int = 0, second: Int = 0, timeZone: TimeZone = .gmt
    ) throws -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return try #require(calendar.date(from: DateComponents(
            year: year, month: month, day: day, hour: hour, minute: minute, second: second
        )))
    }

    private func finish(
        _ plan: WorkoutPlan, using controller: TrainingController, clock: TestClock, timeZone: TimeZone = .gmt
    ) throws -> WorkoutSession {
        try #require(try controller.start(plan, load: .measuredPerDumbbell(grams: 3300), timeZone: timeZone))
        let id = try #require(controller.archive.current?.id)
        for _ in 0..<plan.plannedSetCount {
            var state = try #require(controller.archive.current)
            if state.phase == .setComplete {
                let owner = try #require(state.restOwner)
                try #require(try controller.send(.startRest(owner), for: id))
                try #require(try controller.send(.finishRest(owner), for: id))
                state = try #require(controller.archive.current)
            }
            if state.phase == .prepare || state.phase == .nextTransition {
                try #require(try controller.send(.startPreparedAction(state.phase, state.position), for: id))
            }
            clock.advance(state.currentExercise.target.unit == .seconds ? 18 : 2)
            try #require(try controller.send(.completeDraft(state.currentKey), for: id))
        }
        let session = try #require(controller.archive.current)
        try #require(session.phase == .summary)
        return session
    }

    private func startRecovery(using controller: TrainingController, timeZone: TimeZone) throws -> WorkoutSession {
        try #require(try controller.start(try plan("recovery"), timeZone: timeZone))
        let session = try #require(controller.archive.current)
        try #require(try controller.send(.startPreparedAction(session.phase, session.position), for: session.id))
        return session
    }

    private func endRecovery(
        using controller: TrainingController, clock: TestClock, timeZone: TimeZone, logFirstSide: Bool
    ) throws -> WorkoutSession {
        let started = try startRecovery(using: controller, timeZone: timeZone)
        clock.advance(logFirstSide ? 5 : 60)
        if logFirstSide { try #require(try controller.send(.completeDraft(started.currentKey), for: started.id)) }
        try #require(try controller.send(.end, for: started.id))
        return try #require(controller.archive.current)
    }
}
