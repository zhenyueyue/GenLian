#if DEBUG
import Foundation
import TrainingCore

enum UITestLaunch {
    static let identifier = ProcessInfo.processInfo.environment["GENLIAN_UI_TEST_ID"]
        .flatMap(UUID.init(uuidString:))

    static var accessibilityPreview: Bool {
        identifier != nil && ProcessInfo.processInfo.environment["GENLIAN_UI_TEST_ACCESSIBILITY"] == "1"
    }

    static var activityTestRest: RestSettings? {
        guard identifier != nil,
              let mode = ProcessInfo.processInfo.environment["GENLIAN_UI_TEST_REST_MODE"],
              mode == "auto" || mode == "manual" else { return nil }
        return RestSettings(exerciseSeconds: 24, roundSeconds: 24, autoAdvance: mode == "auto")
    }

    static func preferences() -> UserDefaults {
        guard let identifier else { return .standard }
        guard let isolated = UserDefaults(suiteName: "com.genlian.app.uitest.\(identifier.uuidString)") else {
            preconditionFailure("Unable to isolate UI test preferences")
        }
        return isolated
    }

    @MainActor
    static func controller() throws -> TrainingController {
        guard let identifier else {
            return try TrainingController(store: AtomicTrainingStore.applicationSupport())
        }
        let support = try FileManager.default.url(
            for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true
        )
        let file = support.appendingPathComponent("GenLianUITests", isDirectory: true)
            .appendingPathComponent(identifier.uuidString, isDirectory: true)
            .appendingPathComponent("training.json")
        let store = AtomicTrainingStore(file: file)
        if ProcessInfo.processInfo.environment["GENLIAN_UI_TEST_FROZEN_CLOCK"] == "1" {
            return try TrainingController(store: store, clock: ScreenshotClock())
        }
        return try TrainingController(store: store)
    }

    private struct ScreenshotClock: WorkoutClock {
        func sample() -> WorkoutTime {
            // Keep transient phases visible while XCTest navigates using the real controls.
            WorkoutTime(date: Date(timeIntervalSince1970: 1_800_000_000), monotonicSeconds: 0)
        }
    }
}
#endif
