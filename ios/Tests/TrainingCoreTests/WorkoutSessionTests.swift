import Foundation
import Testing
@testable import TrainingCore

@Suite @MainActor
struct WorkoutSessionTests {
    @Test(arguments: [("strength-a", 15), ("strength-b", 12), ("cardio", 15), ("recovery", 6)])
    func completesEachBuiltInPlan(planID: String, expectedCount: Int) throws {
        let fixture = try WorkoutFixture(planID)
        let plan = try fixture.current().plan
        var expectedKeys: [SetKey] = []
        for round in 1...plan.rounds {
            for (index, exercise) in plan.exercises.enumerated() {
                for set in 1...exercise.setsPerRound {
                    let position = SetPosition(round: round, exerciseIndex: index, set: set)
                    let sides: [Side] = exercise.unilateral ? [.left, .right] : [.bilateral]
                    expectedKeys.append(contentsOf: sides.map { SetKey(position: position, side: $0) })
                }
            }
        }

        try fixture.tick(4)
        for key in expectedKeys {
            if try fixture.current().phase == .setComplete {
                try fixture.enterRest()
                let resting = try fixture.current()
                let kind: RestKind = resting.position.round != key.position.round ? .round : .exercise
                #expect(resting.rest?.kind == kind)
                try fixture.skipRest()
                try fixture.startMove()
            }
            #expect(try fixture.current().currentKey == key)
            try fixture.completeTarget()
        }
        let summary = try fixture.current()
        #expect(summary.phase == .summary)
        #expect(summary.endReason == .reachedEndOfPlan)
        #expect(summary.outcome == .completed)
        #expect(summary.plan.plannedSetCount == expectedCount)
        #expect(summary.loggedSets.map(\.key) == expectedKeys)
        #expect(summary.skippedSets.isEmpty)
    }

    @Test func rightFirstStillRequiresLeftAndStaleTapIsIgnored() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        let first = try fixture.current()
        #expect(first.side == .left)
        #expect(try fixture.send(.chooseSide(.right, first.position)))
        let right = try fixture.current().currentKey
        #expect(try fixture.send(.complete(right, SetResult(.seconds(22)))))
        #expect(try !fixture.send(.complete(right, SetResult(.seconds(22)))))
        #expect(try fixture.current().phase == .active)
        #expect(try fixture.current().side == .left)
        #expect(try !fixture.send(.chooseSide(.right, first.position)))
        #expect(try !fixture.send(.complete(first.currentKey, SetResult(.repetitions(25)))))
        #expect(try fixture.send(.complete(first.currentKey, SetResult(.seconds(25)))))
        let confirmation = try fixture.current()
        #expect(confirmation.phase == .setComplete)
        #expect(confirmation.loggedSets.map { $0.key.side } == [.right, .left])
        #expect(confirmation.totals.holdSeconds == 47)
        #expect(confirmation.restOwner == first.currentKey)
    }

    @Test func reviewDoesNotRepositionOrDuplicateSetsAndUnitsStaySeparate() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        let old = try fixture.current().currentKey
        try fixture.completeTarget()
        try fixture.completeTarget()
        try fixture.enterRest()
        try fixture.tick(7)
        try fixture.skipRest()
        try fixture.startMove()
        let current = try fixture.current().currentKey
        #expect(try fixture.send(.reviewPrevious(current.position)))
        #expect(try fixture.current().reviewPosition == old.position)
        #expect(try fixture.current().currentKey == current)
        #expect(try !fixture.send(.complete(old, SetResult(.seconds(30)))))
        #expect(try !fixture.send(.complete(current, SetResult(.repetitions(10)))))
        #expect(try fixture.send(.returnToCurrent))
        #expect(try fixture.send(.complete(current, SetResult(.repetitions(10), effort: .hard))))
        let summary = try fixture.current()
        #expect(summary.loggedSets.count == 3)
        #expect(summary.totals.repetitions == 10)
        #expect(summary.totals.holdSeconds == 60)
        #expect(summary.loggedSets[0].rest == nil)
        #expect(summary.loggedSets[1].rest?.actualSeconds == 7)
        #expect(summary.loggedSets[2].result.effort == .hard)
        #expect(summary.loggedSets[2].result.load == .bodyweight)
    }

    @Test func skipPreservesCompletedSideAndDoesNotCreateRest() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        try fixture.completeTarget()
        let right = try fixture.current().currentKey
        #expect(try fixture.send(.skipExercise(right)))
        #expect(try !fixture.send(.skipExercise(right)))
        var session = try fixture.current()
        #expect(session.loggedSets.count == 1)
        #expect(session.loggedSets[0].key.side == .left)
        #expect(session.loggedSets[0].rest == nil)
        #expect(session.skippedSets.map(\.key) == [right])
        #expect(session.phase == .nextTransition)
        try fixture.startMove()
        try #require(fixture.send(.skipExercise(fixture.current().currentKey)))
        try fixture.startMove()
        try #require(fixture.send(.skipExercise(fixture.current().currentKey)))
        try fixture.startMove()
        try #require(fixture.send(.skipExercise(fixture.current().currentKey)))
        session = try fixture.current()
        #expect(session.outcome == .partial)
        #expect(session.endReason == .reachedEndOfPlan)
        #expect(session.skippedSets.count == 5)
    }

    @Test func zeroSetExitAndUserEndedPartialAreExplicit() throws {
        let zero = try WorkoutFixture()
        #expect(try zero.send(.end))
        #expect(try zero.current().outcome == .zeroSets)
        #expect(try zero.current().endReason == .endedByUser)
        let partial = try WorkoutFixture()
        try partial.startMove()
        try partial.completeTarget()
        #expect(try partial.send(.end))
        #expect(try partial.current().outcome == .partial)
        #expect(try partial.current().endReason == .endedByUser)
        #expect(try partial.current().loggedSets.count == 1)
    }

    @Test func confirmedEditsHoldAutomaticRestAndRecordActualLoad() throws {
        let fixture = try WorkoutFixture("strength-a")
        try fixture.startMove()
        let key = try fixture.current().currentKey
        try fixture.completeTarget()
        #expect(try fixture.current().loggedSets.first?.result.load == .unspecified)
        try fixture.tick(1)
        let result = SetResult(.repetitions(9), load: .measuredPerDumbbell(grams: 3300), effort: .hard)
        #expect(try fixture.send(.editConfirmedSet(key, result)))
        try fixture.tick(10)
        #expect(try fixture.current().phase == .setComplete)
        #expect(try fixture.current().confirmationHeld)
        #expect(try fixture.current().loggedSets.first?.result == result)
        try fixture.enterRest()
        #expect(try fixture.current().phase == .rest)
    }

    @Test func adjustsRemainingRestAndKeepsActualElapsed() throws {
        let fixture = try WorkoutFixture(rest: RestSettings(exerciseSeconds: 20, roundSeconds: 30))
        try fixture.startMove()
        try fixture.completeTarget()
        try fixture.completeTarget()
        try fixture.tick(7)
        let current = try fixture.current()
        let owner = try #require(current.restOwner)
        #expect(current.rest?.actualSeconds == 3)
        #expect(try fixture.send(.adjustRest(owner, .subtractFifteen)))
        #expect(try fixture.current().countdownSeconds == 5)
        #expect(try fixture.send(.adjustRest(owner, .addFifteen)))
        #expect(try fixture.current().countdownSeconds == 20)
        try fixture.tick(20)
        #expect(try fixture.current().phase == .nextTransition)
        #expect(try fixture.current().loggedSets.last?.rest?.actualSeconds == 23)
    }

    @Test func inventoryUsesFourBalancedSides() {
        let inventory = PlateInventory.builtIn
        #expect(inventory.totalGrams == 29000)
        #expect(inventory.symmetricPlatesPerDumbbell(gramsPerSide: []) == 0)
        #expect(inventory.symmetricPlatesPerDumbbell(gramsPerSide: [1250, 1500, 2000, 2500]) == 14500)
        #expect(inventory.symmetricPlatesPerDumbbell(gramsPerSide: [1250, 1250]) == nil)
        #expect(inventory.symmetricPlatesPerDumbbell(gramsPerSide: [500]) == nil)
    }

    @Test func timedDraftUsesActualSecondsForEachSideAndIgnoresStaleCompletion() throws {
        let fixture = try WorkoutFixture()
        try fixture.startMove()
        let left = try fixture.current().currentKey
        #expect(try !fixture.send(.completeDraft(left)))
        try fixture.tick(7.4)
        #expect(try fixture.current().currentResult.measurement == .seconds(7))
        try #require(fixture.send(.chooseSide(.right, left.position)))
        let right = try fixture.current().currentKey
        try fixture.tick(3)
        try #require(fixture.send(.updateDraft(right, SetDraft(measurement: .seconds(5)))))
        try #require(fixture.send(.chooseSide(.left, left.position)))
        try fixture.tick(2)
        try #require(fixture.send(.completeDraft(left)))
        #expect(try !fixture.send(.completeDraft(left)))
        #expect(try fixture.current().currentActionSeconds == 3)
        try #require(fixture.send(.completeDraft(right)))
        #expect(try fixture.current().loggedSets.map { $0.result.measurement } == [.seconds(9), .seconds(5)])
    }

    @Test func groupNumberAdvancesBeforeNextExerciseOrRound() throws {
        let item = Exercise(
            id: "test", movementID: "test", name: "Test", muscleGroup: "", targetMuscle: "",
            dumbbellCount: 0, unilateral: false, setsPerRound: 2, target: .repetitions(5),
            tempo: "", coachingCue: "", preparationCue: ""
        )
        let plan = WorkoutPlan(
            id: "test", category: .recovery, title: "Test", subtitle: "", estimatedMinutesRange: "",
            rounds: 2, exerciseRestSeconds: 5, roundRestSeconds: 10, exercises: [item]
        )
        let fixture = try WorkoutFixture(planOverride: plan)
        try fixture.startMove()
        try fixture.completeTarget()
        #expect(try fixture.current().rest?.kind == .exercise)
        try fixture.enterRest()
        try fixture.skipRest()
        try fixture.startMove()
        #expect(try fixture.current().position == SetPosition(round: 1, exerciseIndex: 0, set: 2))
        try fixture.completeTarget()
        #expect(try fixture.current().rest?.kind == .round)
        try fixture.enterRest()
        try fixture.skipRest()
        #expect(try fixture.current().position == SetPosition(round: 2, exerciseIndex: 0, set: 1))
    }
}
