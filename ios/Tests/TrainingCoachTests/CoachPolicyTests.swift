import Foundation
import Testing
import TrainingCoach
import TrainingCore

@Suite @MainActor
struct CoachPolicyTests {
    @Test func audioInterruptionStopsAndOnlyForegroundMayStartFreshUtterances() {
        var settings = VoiceCoachPreferences()
        #expect(CoachPolicy.audioAccess(settings, hasContext: true, foreground: false, interrupted: false) == .stop)
        settings.background = true
        #expect(CoachPolicy.audioAccess(settings, hasContext: true, foreground: false, interrupted: false) == .finishCurrent)
        #expect(CoachPolicy.audioAccess(settings, hasContext: true, foreground: true, interrupted: true) == .stop)
        #expect(CoachPolicy.audioAccess(settings, hasContext: false, foreground: true, interrupted: false) == .stop)
        #expect(CoachPolicy.audioAccess(settings, hasContext: true, foreground: true, interrupted: false) == .speak)
    }

    @Test func confirmedSetCanPrepareAudioBeforeRestWithoutSchedulingEarly() throws {
        let training = try CoachFixture()
        try training.send(.startPreparedAction(.prepare, training.session.position))
        #expect(CoachPolicy.upcomingRestSpeech(training.session) == nil)
        try training.send(.complete(training.session.currentKey, .init(.repetitions(12))))
        let message = CoachPolicy.upcomingRestSpeech(training.session)
        #expect(message?.contains("俯身单臂哑铃划船") == true)
        #expect(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date) == nil)
        try training.send(.startRest(try #require(training.session.restOwner)))
        #expect(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date)?.phrase == message)
    }

    @Test func queueSuppressesDuplicatesAndDiscardsInterruptedPrompts() {
        var queue = CoachQueue()
        let old = CoachPrompt(id: "previous", text: "上一动作")
        let next = CoachPrompt(id: "next", text: "下一动作")
        queue.enqueue(old)
        queue.enqueue(old)
        #expect(queue.pending == [old])
        queue.cancelPending()
        queue.enqueue(old)
        queue.enqueue(.init(id: "expired", text: "已经过期", expiresAt: .now - .seconds(1)))
        queue.enqueue(next)
        #expect(queue.next() == next)
        #expect(queue.next() == nil)
    }

    @Test func restAdjustmentReplacesDeadlineAndRepeatedTicksKeepItStable() throws {
        let training = try CoachFixture()
        try training.startRest()
        let first = try #require(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date))
        try training.advance(5)
        let unchanged = CoachPolicy.reminder(for: training.session, previous: first, now: training.clock.date)
        #expect(unchanged == first)
        let owner = try #require(training.session.restOwner)
        try training.send(.adjustRest(owner, .addFifteen))
        let later = try #require(CoachPolicy.reminder(for: training.session, previous: first, now: training.clock.date))
        #expect(later.deadline.timeIntervalSince(first.deadline) == 15)
        #expect(later.phrase.contains("俯身单臂哑铃划船"))
        try training.send(.adjustRest(owner, .subtractFifteen))
        #expect(CoachPolicy.reminder(for: training.session, previous: later, now: training.clock.date) == first)
        try training.send(.finishRest(owner))
        #expect(CoachPolicy.reminder(for: training.session, previous: first, now: training.clock.date) == nil)
    }

    @Test func pauseAndEndClearReminderButPauseKeepsLiveActivity() throws {
        let training = try CoachFixture()
        try training.startRest()
        let first = try #require(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date))
        try training.send(.pause)
        #expect(CoachPolicy.liveSession(training.session)?.isPaused == true)
        #expect(CoachPolicy.reminder(for: training.session, previous: first, now: training.clock.date) == nil)
        try training.advance(12)
        try training.send(.resume)
        let resumed = try #require(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date))
        #expect(resumed.deadline.timeIntervalSince(first.deadline) == 12)
        try training.send(.end)
        #expect(CoachPolicy.liveSession(training.session) == nil)
        #expect(CoachPolicy.reminder(for: training.session, previous: resumed, now: training.clock.date) == nil)
        #expect(CoachPolicy.liveSession(nil) == nil)
    }

    @Test func savedSessionEndsLiveActivityAndDoesNotReplayOldCues() throws {
        let training = try CoachFixture()
        try training.startRest()
        try training.send(.saveForLater)
        let restored = try TrainingController(store: training.store, clock: training.clock)
        let session = try #require(restored.archive.current)
        #expect(CoachPolicy.liveSession(session) == nil)
        #expect(CoachPolicy.prompts(from: nil, to: session, preferences: .init()).isEmpty)
        #expect(CoachPolicy.reminder(for: session, previous: nil, now: training.clock.date) == nil)
        #expect(try restored.send(.resume, for: session.id))
        #expect(CoachPolicy.reminder(for: restored.archive.current, previous: nil, now: training.clock.date) != nil)
    }

    @Test func deniedPermissionDoesNotDisableForegroundPromptsOrLiveActivity() throws {
        let training = try CoachFixture()
        let ready = training.session
        try training.send(.startPreparedAction(.prepare, ready.position))
        var settings = VoiceCoachPreferences()
        settings.background = true
        #expect(!CoachPolicy.allowsNotification(settings, permitted: false))
        #expect(CoachPolicy.allowsNotification(settings, permitted: true))
        #expect(CoachPolicy.liveSession(training.session) != nil)
        #expect(CoachPolicy.prompts(from: ready, to: training.session, preferences: settings).count == 1)
    }

    @Test func timedHintsUseRealTargetAndDoNotCatchUpAfterAbsence() throws {
        let training = try CoachFixture("recovery")
        try training.send(.startPreparedAction(.prepare, training.session.position))
        let initial = training.session
        try training.advance(20.2)
        let first = training.session
        #expect(CoachPolicy.prompts(from: initial, to: first, preferences: .init()).map(\.text) == ["还剩十秒。"])
        try training.advance(7)
        let last = training.session
        #expect(CoachPolicy.prompts(from: first, to: last, preferences: .init()).map(\.text) == ["三、二、一。"])
        try training.advance(90)
        #expect(CoachPolicy.prompts(from: initial, to: training.session, preferences: .init()).isEmpty)
        #expect(training.session.loggedSets.isEmpty)
    }

    @Test func sidePromptRequiresAnActualCompletedSet() throws {
        let training = try CoachFixture("recovery")
        try training.send(.startPreparedAction(.prepare, training.session.position))
        let left = training.session
        try training.send(.chooseSide(.right, left.position))
        let right = training.session
        #expect(CoachPolicy.context(left) != CoachPolicy.context(right))
        #expect(CoachPolicy.prompts(from: left, to: right, preferences: .init()).isEmpty)
        try training.send(.complete(training.session.currentKey, .init(.seconds(30))))
        let prompt = CoachPolicy.prompts(from: right, to: training.session, preferences: .init())
        #expect(prompt.map(\.text) == ["右侧完成，接下来左侧。"])
    }
}

@MainActor
private final class CoachClock: WorkoutClock {
    var date = Date(timeIntervalSince1970: 1_800_000_000)
    var seconds: TimeInterval = 0
    func sample() -> WorkoutTime { WorkoutTime(date: date, monotonicSeconds: seconds) }
}

@MainActor
private final class CoachStore: TrainingStore {
    var archive = TrainingArchive()
    func load() throws -> TrainingArchive { archive }
    func save(_ archive: TrainingArchive) throws { self.archive = archive }
}

@MainActor
private struct CoachFixture {
    let clock: CoachClock
    let store: CoachStore
    let controller: TrainingController

    init(_ id: String = "strength-a") throws {
        let clock = CoachClock()
        let store = CoachStore()
        let controller = try TrainingController(store: store, clock: clock)
        let plan = try #require(BuiltInCatalog.load().first { $0.id == id })
        try #require(try controller.start(plan))
        self.clock = clock
        self.store = store
        self.controller = controller
    }

    var session: WorkoutSession { controller.archive.current! }

    func startRest() throws {
        try send(.startPreparedAction(.prepare, session.position))
        try send(.complete(session.currentKey, .init(.repetitions(12))))
        try send(.startRest(try #require(session.restOwner)))
    }

    func send(_ action: WorkoutAction) throws {
        try #require(try controller.send(action, for: session.id))
    }

    func advance(_ seconds: TimeInterval) throws {
        clock.seconds += seconds
        clock.date.addTimeInterval(seconds)
        try controller.tick()
    }
}
