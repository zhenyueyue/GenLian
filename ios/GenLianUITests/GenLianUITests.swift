import XCTest

final class GenLianUITests: XCTestCase {
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
    func testAccessibleTodayKeepsPrimaryNavigationReachable() {
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
        capture("13-accessibility-today", in: app)
        tap(AccessibilityID.Dock.archive, in: app)
        _ = ready(AccessibilityID.Record.historyTitle, in: app)
        capture("14-accessibility-empty-history", in: app)
    }

    @MainActor
    private func launch(accessibility: Bool = false) -> XCUIApplication {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["GENLIAN_UI_TEST_ID"] = UUID().uuidString
        if accessibility { app.launchEnvironment["GENLIAN_UI_TEST_ACCESSIBILITY"] = "1" }
        app.launch()
        return app
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
    private func ready(_ id: String, in app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) -> XCUIElement {
        let match = element(id, in: app)
        XCTAssertTrue(match.waitForExistence(timeout: 8), "Missing \(id)\n\(app.debugDescription)", file: file, line: line)
        return match
    }

    @MainActor
    private func tap(_ id: String, in app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        let match = ready(id, in: app, file: file, line: line)
        let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == YES"), object: match)
        XCTAssertEqual(XCTWaiter.wait(for: [hittable], timeout: 5), .completed, "\(id) is not hittable", file: file, line: line)
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
        _ id: String, containing text: String, in app: XCUIApplication,
        file: StaticString = #filePath, line: UInt = #line
    ) {
        let match = ready(id, in: app, file: file, line: line)
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", text), object: match)
        XCTAssertEqual(
            XCTWaiter.wait(for: [changed], timeout: 5), .completed,
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
