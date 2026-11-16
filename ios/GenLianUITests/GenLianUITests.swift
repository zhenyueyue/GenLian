import XCTest

final class GenLianUITests: XCTestCase {
    @MainActor
    func testWorkoutBackgroundKeepsActionRunningAndHonorsExplicitPause() async throws {
        let app = launch(freezeClock: false)
        tap(AccessibilityID.Dock.start, in: app)
        let movement = AccessibilityID.Player.exercise("ex-floor-press")
        tap(AccessibilityID.Player.increase, in: app, timeout: 60)
        expectLabel(AccessibilityID.Player.complete, containing: "13 次", in: app)

        let actionTime = ready(AccessibilityID.Player.actionTime, in: app)
        let before = clockSeconds(actionTime.label)
        try await background(app, for: .seconds(10))
        _ = ready(movement, in: app, timeout: 30)
        let after = clockSeconds(actionTime.label)
        XCTAssertGreaterThanOrEqual(after - before, 10)
        expectLabel(AccessibilityID.Player.status, containing: "动作 1/4", in: app)
        expectLabel(AccessibilityID.Player.complete, containing: "13 次", in: app)
        XCTAssertFalse(element(AccessibilityID.Player.resume, in: app).exists)
        capture("23-background-resumed", in: app)

        try await background(app, for: .seconds(2))
        _ = ready(movement, in: app, timeout: 30)
        XCTAssertGreaterThanOrEqual(clockSeconds(actionTime.label) - after, 2)

        tap(AccessibilityID.Player.pause, in: app)
        let pause = ready(AccessibilityID.Player.pauseStatus, in: app)
        let frozen = clockSeconds(pause.value as? String ?? "")
        try await background(app, for: .seconds(3))
        expectLabel(AccessibilityID.Player.pauseStatus, containing: "主动暂停", in: app)
        XCTAssertEqual(clockSeconds(pause.value as? String ?? ""), frozen)
        tap(AccessibilityID.Player.resume, in: app)
        tap(AccessibilityID.Player.complete, in: app)
        endWorkout(in: app)
        expectLabel(AccessibilityID.Record.groups, containing: "1/15", in: app)
        print("Background lifecycle (seconds): current action \(before) → \(after) after 10 seconds away; explicit pause held at \(frozen).")
    }

    @MainActor
    func testTerminatedSessionRequiresConfirmationAndPreservesDraft() {
        let app = launch()
        tap(AccessibilityID.Dock.start, in: app)
        tap(AccessibilityID.Player.prepare, in: app)
        tap(AccessibilityID.Player.increase, in: app)
        expectLabel(AccessibilityID.Player.complete, containing: "13 次", in: app)

        app.terminate()
        app.launch()
        tap(AccessibilityID.Dock.start, in: app)
        expectLabel(AccessibilityID.Player.pauseStatus, containing: "本次训练已暂存", in: app)
        capture("24-cold-recovery", in: app)
        tap(AccessibilityID.Player.resume, in: app)
        _ = ready(AccessibilityID.Player.exercise("ex-floor-press"), in: app)
        expectLabel(AccessibilityID.Player.complete, containing: "13 次", in: app)
        XCTAssertEqual(clockSeconds(ready(AccessibilityID.Player.actionTime, in: app).label), 0)
        tap(AccessibilityID.Player.complete, in: app)
        endWorkout(in: app)
        expectLabel(AccessibilityID.Record.groups, containing: "1/15", in: app)
    }

    @MainActor
    private func background(_ app: XCUIApplication, for duration: Duration) async throws {
        let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settings.activate()
        XCTAssertEqual(settings.state, .runningForeground)
        try await Task.sleep(for: duration)
        XCTAssertEqual(settings.state, .runningForeground)
        app.activate()
        XCTAssertEqual(app.state, .runningForeground)
    }

    @MainActor
    func testStrengthAArchivesBothSidesAndSurvivesRelaunch() {
        let app = launch()
        let title = ready(AccessibilityID.Today.title, in: app)
        XCTAssertEqual(title.label, "全身均衡循环")
        expectLabel(AccessibilityID.Today.scope, containing: "胸·背·腿·核", in: app)
        capture("01-today", in: app)

        reveal(AccessibilityID.Today.exercise("ex-floor-press"), in: app).tap()
        _ = ready(AccessibilityID.Detail.title, in: app)
        capture("02-workout-detail", in: app)
        tap(AccessibilityID.Detail.back, in: app)
        reveal(AccessibilityID.Today.setup, in: app, towardTop: true).tap()
        _ = ready(AccessibilityID.Setup.title, in: app)
        capture("03-training-setup", in: app)
        reveal(AccessibilityID.Setup.plates(2500), in: app).tap()
        _ = reveal(AccessibilityID.Setup.autoAdvance, in: app)
        capture("03a-setup-rest-options", in: app)
        tap(AccessibilityID.Setup.start, in: app)

        _ = ready(AccessibilityID.Player.prepare, in: app)
        capture("04a-strength-prepare", in: app)
        tap(AccessibilityID.Player.prepare, in: app)
        _ = ready(AccessibilityID.Player.exercise("ex-floor-press"), in: app)
        capture("04-strength-player", in: app)
        tap(AccessibilityID.Player.complete, in: app)
        tap(AccessibilityID.Player.enterRest, in: app)
        expectLabel(AccessibilityID.Rest.countdown, containing: "90", in: app)
        capture("05-between-set-rest", in: app)
        tap(AccessibilityID.Rest.add, in: app)
        expectLabel(AccessibilityID.Rest.timing, containing: "105", in: app)
        tap(AccessibilityID.Rest.subtract, in: app)
        expectLabel(AccessibilityID.Rest.timing, containing: "90", in: app)
        tap(AccessibilityID.Rest.finish, in: app)
        tap(AccessibilityID.Player.next, in: app)

        _ = ready(AccessibilityID.Player.exercise("ex-single-row"), in: app)
        expectLabel(AccessibilityID.Player.status, containing: "动作 2/4", in: app)
        let left = AccessibilityID.Player.side("left")
        let right = AccessibilityID.Player.side("right")
        expectLabel(left, containing: "进行中", in: app)
        XCTAssertFalse(element(left, in: app).isEnabled)
        tap(AccessibilityID.Player.complete, in: app)
        expectLabel(left, containing: "已完成", in: app)
        expectLabel(right, containing: "进行中", in: app)
        expectLabel(AccessibilityID.Player.status, containing: "动作 2/4", in: app)
        capture("04b-strength-right-side", in: app)
        // Record a different actual count on the right to detect accidental side duplication.
        tap(AccessibilityID.Player.increase, in: app)
        tap(AccessibilityID.Player.complete, in: app)
        _ = ready(AccessibilityID.Player.enterRest, in: app)

        endWorkout(in: app)
        expectLabel(AccessibilityID.Record.groups, containing: "3/15", in: app)
        capture("06-workout-summary", in: app)
        verifyStrengthRecords(in: app)
        verifySummaryBottom(in: app)
        capture("15-summary-scrolled-bottom", in: app)
        tap(AccessibilityID.Record.archive, in: app)
        _ = ready(AccessibilityID.Record.historyTitle, in: app)
        capture("07-training-history", in: app)
        tap(AccessibilityID.Record.latest, in: app)
        _ = ready(AccessibilityID.Record.detailTitle, in: app)
        expectLabel(AccessibilityID.Record.groups, containing: "3/15", in: app)
        capture("08-history-detail", in: app)
        verifyStrengthRecords(in: app)
        capture("08a-history-recorded-sets", in: app)

        app.terminate()
        app.launch()
        _ = ready(AccessibilityID.Today.title, in: app)
        tap(AccessibilityID.Dock.archive, in: app)
        tap(AccessibilityID.Record.latest, in: app)
        expectLabel(AccessibilityID.Record.groups, containing: "3/15", in: app)
        verifyStrengthRecords(in: app)
    }

    @MainActor
    func testRecoveryRecordsIndependentSeconds() {
        let app = launch()
        reveal(AccessibilityID.Today.course("recovery"), in: app).tap()
        _ = reveal(AccessibilityID.Today.title, in: app, towardTop: true)
        expectLabel(AccessibilityID.Today.title, containing: "恢复", in: app)
        tap(AccessibilityID.Dock.start, in: app)
        tap(AccessibilityID.Player.prepare, in: app)
        _ = ready(AccessibilityID.Player.exercise("ex-thoracic"), in: app)
        capture("09-recovery-player", in: app)
        expectLabel(AccessibilityID.Player.side("left"), containing: "进行中", in: app)
        for _ in 0..<2 { tap(AccessibilityID.Player.increase, in: app) }
        tap(AccessibilityID.Player.complete, in: app)
        expectLabel(AccessibilityID.Player.side("right"), containing: "进行中", in: app)
        for _ in 0..<3 { tap(AccessibilityID.Player.increase, in: app) }
        tap(AccessibilityID.Player.complete, in: app)
        tap(AccessibilityID.Player.enterRest, in: app)
        expectLabel(AccessibilityID.Rest.countdown, containing: "20", in: app)
        capture("10-recovery-rest", in: app)
        endWorkout(in: app)
        expectLabel(AccessibilityID.Record.groups, containing: "2/6", in: app)
        expectLabel(AccessibilityID.Record.seconds, containing: "5", in: app)
        capture("11-recovery-summary", in: app)
        tap(AccessibilityID.Record.archive, in: app)
        tap(AccessibilityID.Record.latest, in: app)
        let left = AccessibilityID.Record.entry(1, 0, 1, "left")
        let right = AccessibilityID.Record.entry(1, 0, 1, "right")
        _ = reveal(left, in: app)
        expectLabel(left, containing: "实录 2 秒", in: app)
        _ = reveal(right, in: app)
        expectLabel(right, containing: "实录 3 秒", in: app)
        capture("12-recovery-recorded-sets", in: app)
    }

    @MainActor
    func testLargestDynamicTypeKeepsTrainingAndArchiveReachable() {
        let app = launch(accessibility: true)
        let title = ready(AccessibilityID.Today.title, in: app)
        let start = ready(AccessibilityID.Dock.start, in: app)
        let archive = ready(AccessibilityID.Dock.archive, in: app)
        XCTAssertTrue(start.isHittable)
        XCTAssertTrue(archive.isHittable)
        XCTAssertGreaterThanOrEqual(start.frame.height, 44)
        XCTAssertGreaterThanOrEqual(archive.frame.height, 44)
        XCTAssertTrue(app.frame.contains(archive.frame))
        XCTAssertFalse(title.frame.intersects(start.frame))
        XCTAssertLessThanOrEqual(app.scrollViews.firstMatch.frame.maxY, start.frame.minY)
        XCTAssertEqual(ready(AccessibilityID.Today.scope, in: app).label, "胸·背·腿·核")
        capture("13-accessibility-today", in: app)
        _ = revealFully(AccessibilityID.Today.actionSetup, in: app.scrollViews.firstMatch, app: app)
        tap(AccessibilityID.Dock.archive, in: app)
        _ = ready(AccessibilityID.Record.historyTitle, in: app)
        _ = reveal(AccessibilityID.Record.empty, in: app)
        capture("14-accessibility-empty-history", in: app)

        tap(AccessibilityID.Dock.start, in: app)
        tap(AccessibilityID.Player.prepare, in: app)
        let movement = AccessibilityID.Player.exercise("ex-floor-press")
        _ = revealFully(movement, in: app.scrollViews.firstMatch, app: app)
        XCTAssertTrue(ready(AccessibilityID.Player.complete, in: app).isHittable)
        capture("16-accessibility-player", in: app)
        _ = revealFully(AccessibilityID.Player.actionTime, in: app.scrollViews.firstMatch, app: app)
        tap(AccessibilityID.Player.complete, in: app)
        tap(AccessibilityID.Player.enterRest, in: app)
        expectLabel(AccessibilityID.Rest.countdown, containing: "90", in: app)
        _ = reveal(AccessibilityID.Rest.timing, in: app)
        XCTAssertTrue(ready(AccessibilityID.Rest.finish, in: app).isHittable)
        capture("17-accessibility-rest", in: app)
        let next = revealFully(AccessibilityID.Rest.next, in: app.scrollViews.firstMatch, app: app)
        XCTAssertTrue(next.label.contains("俯身单臂哑铃划船"))
        capture("17b-accessibility-rest-next", in: app)
        tap(AccessibilityID.Rest.finish, in: app)
        tap(AccessibilityID.Player.next, in: app)
        _ = reveal(AccessibilityID.Player.side("left"), in: app)
        capture("17a-accessibility-side-controls", in: app)
        tap(AccessibilityID.Player.skip, in: app)
        endWorkout(in: app)

        let logged = AccessibilityID.Record.entry(1, 0, 1, "bilateral")
        let skipped = AccessibilityID.Record.entry(1, 1, 1, "left")
        expectLabel(logged, containing: "实录 12 次", in: app, afterRevealing: true)
        expectLabel(skipped, containing: "已跳过", in: app, afterRevealing: true)
        verifySummaryBottom(in: app)
        capture("18-accessibility-summary-bottom", in: app)
        tap(AccessibilityID.Record.archive, in: app)
        let featured = revealFully(AccessibilityID.Record.latest, in: app.scrollViews.firstMatch, app: app)
        capture("19-accessibility-archived", in: app)
        featured.tap()
        _ = ready(AccessibilityID.Record.detailTitle, in: app)
        let record = revealFully(logged, in: app.scrollViews[AccessibilityID.Record.scroll], app: app)
        XCTAssertTrue(record.label.contains("实录 12 次"))
        capture("19a-accessibility-history-detail", in: app)
    }

    @MainActor
    func testRealClockAdvancesPausesResumesAndPersistsDuration() {
        let app = launch(freezeClock: false)
        reveal(AccessibilityID.Today.course("strength-b"), in: app).tap()
        tap(AccessibilityID.Dock.start, in: app)
        _ = ready(AccessibilityID.Player.exercise("ex-shoulder-press"), in: app, timeout: 20)
        let timer = ready(AccessibilityID.Player.actionTime, in: app)
        let started = clockSeconds(timer.label)
        waitForClockChange(timer)
        let advanced = clockSeconds(timer.label)
        XCTAssertGreaterThan(advanced, started)
        capture("20-shoulder-press-player", in: app)

        tap(AccessibilityID.Player.pause, in: app)
        let paused = ready(AccessibilityID.Player.pauseStatus, in: app)
        let frozen = clockSeconds(paused.value as? String ?? "")
        XCTAssertGreaterThan(frozen, 0)
        waitForClockChange(paused)
        waitForClockChange(paused)
        XCTAssertEqual(clockSeconds(paused.value as? String ?? ""), frozen)
        capture("21-real-clock-paused", in: app)

        tap(AccessibilityID.Player.resume, in: app)
        _ = ready(AccessibilityID.Player.actionTime, in: app)
        waitForClockChange(timer)
        let resumed = clockSeconds(timer.label)
        XCTAssertGreaterThan(resumed, frozen)
        tap(AccessibilityID.Player.complete, in: app)
        endWorkout(in: app)
        let duration = clockSeconds(ready(AccessibilityID.Record.duration, in: app).label)
        XCTAssertGreaterThanOrEqual(duration, frozen + 1)
        capture("22-real-clock-summary", in: app)
        tap(AccessibilityID.Record.archive, in: app)
        tap(AccessibilityID.Record.latest, in: app)
        let archived = clockSeconds(ready(AccessibilityID.Record.duration, in: app).label)
        XCTAssertEqual(archived, duration)
        print("Real workout clock (seconds): action \(started) → \(advanced), frozen at \(frozen), resumed at \(resumed), archived \(archived).")
    }

    @MainActor
    private func launch(accessibility: Bool = false, freezeClock: Bool = true) -> XCUIApplication {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["GENLIAN_UI_TEST_ID"] = UUID().uuidString
        if accessibility { app.launchEnvironment["GENLIAN_UI_TEST_ACCESSIBILITY"] = "1" }
        if freezeClock { app.launchEnvironment["GENLIAN_UI_TEST_FROZEN_CLOCK"] = "1" }
        app.launch()
        return app
    }

    @MainActor
    private func verifySummaryBottom(in app: XCUIApplication) {
        let scroll = app.scrollViews.matching(identifier: AccessibilityID.Record.scroll).firstMatch
        let archive = ready(AccessibilityID.Record.archive, in: app)
        let position = archive.frame
        XCTAssertTrue(archive.isHittable)
        XCTAssertGreaterThanOrEqual(position.height, 44)
        let last = element(AccessibilityID.Record.entry(3, 3, 1, "bilateral"), in: app)
        for _ in 0..<12 {
            scroll.swipeUp()
            if last.exists && last.isHittable && last.frame.maxY <= position.minY { break }
        }
        XCTAssertTrue(last.exists && last.isHittable)
        XCTAssertGreaterThanOrEqual(last.frame.minY, scroll.frame.minY)
        XCTAssertLessThanOrEqual(last.frame.maxY, position.minY)
        XCTAssertTrue(last.label.contains("未完成"))
        XCTAssertEqual(archive.frame, position)
        XCTAssertTrue(archive.isHittable)
    }

    @MainActor
    private func revealFully(
        _ id: String, in scroll: XCUIElement, app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line
    ) -> XCUIElement {
        let target = element(id, in: app)
        for _ in 0..<12 {
            let viewport = scroll.frame
            let travel: CGFloat
            if target.exists {
                let frame = target.frame
                if viewport.contains(frame) && (target.elementType != .button || target.isHittable) {
                    return target
                }
                let offset = (frame.midY - viewport.midY) / max(viewport.height, 1)
                travel = offset >= 0 ? min(0.5, max(0.12, offset)) : max(-0.5, min(-0.12, offset))
            } else {
                travel = 0.5
            }
            let startY = travel >= 0 ? 0.75 : 0.25
            let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: startY))
            let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: startY - travel))
            start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
        }
        XCTAssertTrue(
            target.exists && scroll.frame.contains(target.frame) && (target.elementType != .button || target.isHittable),
            "Could not fully reveal \(id)\n\(app.debugDescription)", file: file, line: line
        )
        return target
    }

    @MainActor
    private func waitForClockChange(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
        let initial = element.label
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label != %@", initial), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 15), .completed, file: file, line: line)
    }

    private func clockSeconds(_ label: String, file: StaticString = #filePath, line: UInt = #line) -> Int {
        let clock = label.split { !$0.isNumber && $0 != ":" }.first { $0.contains(":") }
        let parts = clock?.split(separator: ":").compactMap { Int($0) }
        guard let parts, parts.count == 2 else {
            XCTFail("No clock in \(label)", file: file, line: line)
            return -1
        }
        return parts[0] * 60 + parts[1]
    }

    @MainActor
    private func endWorkout(in app: XCUIApplication) {
        tap(AccessibilityID.Player.exit, in: app)
        tap(AccessibilityID.Player.end, in: app)
        _ = ready(AccessibilityID.Record.summaryTitle, in: app)
    }

    @MainActor
    private func verifyStrengthRecords(in app: XCUIApplication) {
        let first = AccessibilityID.Record.entry(1, 0, 1, "bilateral")
        let left = AccessibilityID.Record.entry(1, 1, 1, "left")
        let right = AccessibilityID.Record.entry(1, 1, 1, "right")
        _ = reveal(first, in: app)
        expectLabel(first, containing: "2.5 kg/只", in: app)
        _ = reveal(left, in: app)
        expectLabel(left, containing: "实录 12 次", in: app)
        _ = reveal(right, in: app)
        expectLabel(right, containing: "实录 13 次", in: app)
    }

    @MainActor
    private func element(_ id: String, in app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    @MainActor
    @discardableResult
    private func ready(
        _ id: String, in app: XCUIApplication, timeout: TimeInterval = 8,
        file: StaticString = #filePath, line: UInt = #line
    ) -> XCUIElement {
        let match = element(id, in: app)
        XCTAssertTrue(match.waitForExistence(timeout: timeout), "Missing \(id)\n\(app.debugDescription)", file: file, line: line)
        return match
    }

    @MainActor
    private func tap(
        _ id: String, in app: XCUIApplication, timeout: TimeInterval = 20,
        file: StaticString = #filePath, line: UInt = #line
    ) {
        let match = app.buttons.matching(identifier: id).firstMatch
        XCTAssertTrue(
            match.wait(for: \.isHittable, toEqual: true, timeout: timeout),
            "\(id) is not hittable\n\(app.debugDescription)", file: file, line: line
        )
        match.tap()
    }

    @MainActor
    private func reveal(
        _ id: String, in app: XCUIApplication, towardTop: Bool = false,
        file: StaticString = #filePath, line: UInt = #line
    ) -> XCUIElement {
        let match = element(id, in: app)
        let scroll = app.scrollViews.firstMatch
        for _ in 0..<8 {
            if match.exists && match.isHittable { return match }
            if towardTop { scroll.swipeDown() } else { scroll.swipeUp() }
        }
        XCTAssertTrue(match.exists && match.isHittable, "Could not reveal \(id)\n\(app.debugDescription)", file: file, line: line)
        return match
    }

    @MainActor
    private func expectLabel(
        _ id: String, containing text: String, in app: XCUIApplication, afterRevealing: Bool = false,
        file: StaticString = #filePath, line: UInt = #line
    ) {
        let match = afterRevealing ? reveal(id, in: app, file: file, line: line) : ready(id, in: app, file: file, line: line)
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", text), object: match)
        XCTAssertEqual(
            XCTWaiter.wait(for: [changed], timeout: 15), .completed,
            "\(id) expected \(text), got \(match.label)", file: file, line: line
        )
    }

    @MainActor
    private func capture(_ name: String, in app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
