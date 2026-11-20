import Foundation
import Testing
@testable import TrainingCoach
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
        let prewarmed = CoachPolicy.upcomingRestSpeech(training.session)
        #expect(prewarmed?.contains("俯身单臂哑铃划船") == true)
        #expect(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date) == nil)
        try training.send(.complete(training.session.currentKey, .init(.repetitions(12))))
        let message = CoachPolicy.upcomingRestSpeech(training.session)
        #expect(message == prewarmed)
        #expect(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date) == nil)
        try training.send(.startRest(try #require(training.session.restOwner)))
        #expect(CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date)?.phrase == message)
    }

    @Test func notificationUsesOnlyVerifiedAudioOrExplicitFailure() throws {
        let training = try CoachFixture()
        try training.startRest()
        let now = training.clock.date
        let reminder = try #require(CoachPolicy.reminder(for: training.session, previous: nil, now: now))
        func request(_ audio: RestNotificationRequest.Audio, permitted: Bool = true, sound: Bool = true) -> RestNotificationRequest? {
            .resolve(reminder, permitted: permitted, soundEnabled: sound, audio: audio, now: now)
        }
        #expect(request(.waiting) == nil)
        #expect(request(.failed)?.sound == .systemDefault)
        #expect(request(.verified("next.caf"))?.sound == .speech("next.caf"))
        #expect(request(.verified("next.caf")) == request(.verified("next.caf")))
        #expect(request(.verified("next.caf"), permitted: false) == nil)
        #expect(request(.waiting, sound: false)?.sound == .silent)
        #expect(RestNotificationRequest.resolve(reminder, permitted: true, soundEnabled: true,
                                               audio: .verified("next.caf"), now: reminder.deadline) == nil)
    }

    @Test func lateAudioFollowsTheCurrentDeadlineAndNeverRecreatesCancelledRest() throws {
        let training = try CoachFixture()
        try training.startRest()
        let now = training.clock.date
        let first = try #require(CoachPolicy.reminder(for: training.session, previous: nil, now: now))
        let owner = try #require(training.session.restOwner)
        func request(_ reminder: RestReminder?) -> RestNotificationRequest? {
            .resolve(reminder, permitted: true, soundEnabled: true, audio: .verified("next.caf"), now: training.clock.date)
        }
        try training.send(.adjustRest(owner, .addFifteen))
        let later = CoachPolicy.reminder(for: training.session, previous: first, now: now)
        #expect(request(later) != request(first))
        #expect(request(later)?.reminder.phrase == first.phrase)
        try training.send(.adjustRest(owner, .subtractFifteen))
        #expect(request(CoachPolicy.reminder(for: training.session, previous: later, now: now)) == request(first))
        try training.send(.pause)
        #expect(request(CoachPolicy.reminder(for: training.session, previous: first, now: now)) == nil)
        try training.advance(3)
        try training.send(.resume)
        let resumed = CoachPolicy.reminder(for: training.session, previous: nil, now: training.clock.date)
        #expect(request(resumed)?.reminder.deadline == first.deadline + 3)
        try training.send(.finishRest(owner))
        #expect(request(CoachPolicy.reminder(for: training.session, previous: resumed, now: training.clock.date)) == nil)
        try training.send(.end)
        #expect(request(CoachPolicy.reminder(for: training.session, previous: resumed, now: training.clock.date)) == nil)
    }

    @Test(arguments: [true, false]) func expiredActivityProjectsTheNextRoundWithoutStartingAnAction(autoAdvance: Bool) {
        let deadline = Date(timeIntervalSince1970: 1_800_000_000)
        let expected = RestActivityPresentation.next(exercise: "高脚杯深蹲", round: 2, waitsForConfirmation: !autoAdvance)
        func display(at date: Date, stale: Bool = false) -> RestActivityPresentation {
            .resolve(deadline: deadline, isStale: stale, now: date, nextExercise: "高脚杯深蹲", nextRound: 2, autoAdvance: autoAdvance)
        }
        #expect(display(at: deadline - 0.01) == .countdown(until: deadline))
        #expect(display(at: deadline) == expected)
        #expect(display(at: deadline + 10) == expected)
        #expect(display(at: deadline - 1, stale: true) == expected)
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

    @Test func countdownCanExpireWhileTheAudioSessionActivates() {
        var queue = CoachQueue()
        let now = ContinuousClock.now
        let countdown = CoachPrompt(id: "countdown", text: "还剩十秒。", expiresAt: now + .seconds(1))
        let exercise = CoachPrompt(id: "exercise", text: "接下来是俯身单臂哑铃划船。")
        queue.enqueue(countdown)
        queue.enqueue(exercise)
        #expect(queue.firstReady(at: now) == countdown)
        #expect(queue.pending == [countdown, exercise])
        #expect(queue.next(at: now + .seconds(1)) == exercise)
        #expect(queue.next(at: now + .seconds(1)) == nil)
    }

    @Test func confirmingRestKeepsTheCueForTheUpcomingExercise() throws {
        let rest = RestSettings(exerciseSeconds: 30, roundSeconds: 30, autoAdvance: false)
        let training = try CoachFixture(rest: rest)
        try training.startRest()
        let resting = training.session
        let reminder = try #require(CoachPolicy.reminder(for: resting, previous: nil, now: training.clock.date))
        #expect(reminder.waitsForConfirmation)
        #expect(reminder.phrase.hasSuffix("准备好就继续。"))
        try training.advance(30)
        let ready = training.session
        #expect(ready.phase == .restReady)
        #expect(CoachPolicy.context(resting) != CoachPolicy.context(ready))
        #expect(CoachPolicy.prompts(from: resting, to: ready, preferences: .init()).map(\.text) == [reminder.phrase])

        try training.send(.finishRest(try #require(ready.restOwner)))
        let transition = training.session
        #expect(transition.phase == .nextTransition)
        #expect(CoachPolicy.context(ready) == CoachPolicy.context(transition))
        try training.send(.startPreparedAction(.nextTransition, transition.position))
        let active = training.session
        #expect(CoachPolicy.context(ready) == CoachPolicy.context(active))
        try training.send(.pause)
        #expect(CoachPolicy.context(active) != CoachPolicy.context(training.session))
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
        #expect(CoachPolicy.prompts(from: ready, to: training.session, preferences: settings).map(\.text)
            == ["开始！", "呼气推起，吸气慢慢放下。"])
    }

    @Test func timedHintsUseRealTargetAndDoNotCatchUpAfterAbsence() throws {
        let training = try CoachFixture("recovery")
        try training.send(.startPreparedAction(.prepare, training.session.position))
        let initial = training.session
        try training.advance(20.2)
        let first = training.session
        #expect(CoachPolicy.prompts(from: initial, to: first, preferences: .init()).map(\.text) == ["还剩十秒，稳住。"])
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
        #expect(prompt.map(\.text) == ["好，换左侧。"])
    }

    @Test func recordingsCoverTheActualBuiltInExerciseNamesAndBothRestModes() throws {
        let plans = try BuiltInCatalog.load()
        var texts: Set<String> = ["开始！", "好，换右侧。", "好，换左侧。", "好，休息一下。",
                                  "还剩十秒，稳住。", CoachPolicy.countdown, "好，今天练完了。做得很棒。"]
        for exercise in plans.flatMap(\.exercises) {
            texts.insert("准备。\(exercise.name)。")
            texts.insert(CoachPolicy.technique(for: exercise))
            for waitsForConfirmation in [true, false] {
                texts.insert(CoachPolicy.restPhrase(exercise.name, waitsForConfirmation: waitsForConfirmation))
            }
        }
        for round in ["一", "二", "三"] {
            texts.insert("第\(round)轮完成。节奏很好，继续保持。")
        }
        for text in texts {
            let file = try #require(CoachVoiceAssets.clip(for: text), "Missing recording for \(text)")
            try RestNotificationAudio.validate(file)
        }
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

    init(_ id: String = "strength-a", rest: RestSettings? = nil) throws {
        let clock = CoachClock()
        let store = CoachStore()
        let controller = try TrainingController(store: store, clock: clock)
        let plan = try #require(BuiltInCatalog.load().first { $0.id == id })
        try #require(try controller.start(plan, rest: rest))
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
