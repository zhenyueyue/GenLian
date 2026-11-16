import Foundation
import Observation
import SwiftUI
import TrainingCoach
import TrainingCore

struct PlanSetup: Codable, Equatable {
    var load: RecordedLoad = .unspecified
    var rest: RestSettings
}

private struct TrainingPreferences: Codable {
    var planID = "strength-a"
    var setups: [String: PlanSetup] = [:]
    var postponedUntil: [String: Date] = [:]
    var voiceEnabled = true
    var coach: VoiceCoachPreferences?
}

@MainActor
@Observable
final class TrainingAppModel {
    private(set) var plans: [WorkoutPlan] = []
    private(set) var archive = TrainingArchive()
    private(set) var available = false
    var errorMessage: String?
    private var preferences = TrainingPreferences()
    @ObservationIgnored private var controller: TrainingController?
    @ObservationIgnored private var scenePhase: ScenePhase = .inactive
    @ObservationIgnored private let coach: TrainingCoachCoordinator
    @ObservationIgnored private let defaults: UserDefaults
    private static let preferencesKey = "genlian.training-preferences"

    init() {
        #if DEBUG
        let preferencesStore = UITestLaunch.preferences()
        #else
        let preferencesStore = UserDefaults.standard
        #endif
        defaults = preferencesStore
        coach = TrainingCoachCoordinator(defaults: preferencesStore)
        if let bytes = defaults.data(forKey: Self.preferencesKey),
           let saved = try? JSONDecoder().decode(TrainingPreferences.self, from: bytes) {
            preferences = saved
        }
    }

    var plan: WorkoutPlan? { plans.first { $0.id == preferences.planID } ?? plans.first }
    var voiceEnabled: Bool { coachPreferences.enabled }
    var coachPreferences: VoiceCoachPreferences { preferences.coach ?? .init(enabled: preferences.voiceEnabled) }
    var coachNotifications: TrainingNotificationScheduler { coach.notifications }

    func open() {
        guard controller == nil else { return }
        do {
            plans = try BuiltInCatalog.load()
            #if DEBUG
            let sessionController = try UITestLaunch.controller()
            #else
            let sessionController = try TrainingController(store: AtomicTrainingStore.applicationSupport())
            #endif
            try applyScenePhase(to: sessionController)
            controller = sessionController
            archive = sessionController.archive
            available = true
            errorMessage = nil
            synchronizeCoach(from: nil, announce: false)
            refreshCoachPermissions()
        } catch {
            report(error)
        }
    }

    func select(_ plan: WorkoutPlan) {
        preferences.planID = plan.id
        savePreferences()
    }

    func setup(for plan: WorkoutPlan) -> PlanSetup {
        preferences.setups[plan.id] ?? PlanSetup(rest: RestSettings(plan: plan))
    }

    func isPostponed(_ plan: WorkoutPlan, now: Date = .now) -> Bool {
        if let date = preferences.postponedUntil[plan.id] { return now < date }
        return false
    }

    func resumePlan(_ plan: WorkoutPlan) {
        preferences.postponedUntil.removeValue(forKey: plan.id)
        savePreferences()
    }

    func postpone(_ plan: WorkoutPlan, setup: PlanSetup) {
        preferences.setups[plan.id] = setup
        let today = Calendar.current.startOfDay(for: .now)
        preferences.postponedUntil[plan.id] = Calendar.current.date(byAdding: .day, value: 1, to: today)
        savePreferences()
    }

    func start(_ plan: WorkoutPlan, setup value: PlanSetup? = nil) -> Bool {
        let chosen = value ?? setup(for: plan)
        guard perform({ try $0.start(plan, rest: chosen.rest, load: chosen.load) }) else { return false }
        preferences.setups[plan.id] = chosen
        preferences.postponedUntil.removeValue(forKey: plan.id)
        savePreferences()
        return true
    }

    @discardableResult
    func send(_ action: WorkoutAction, for id: UUID) -> Bool {
        perform { try $0.send(action, for: id) }
    }

    @discardableResult
    func archiveFinished(_ id: UUID) -> Bool {
        perform { try $0.archiveFinished(id) }
    }

    func setScenePhase(_ phase: ScenePhase) {
        guard scenePhase != phase else { return }
        scenePhase = phase
        synchronizeScene()
        if phase == .active { refreshCoachPermissions() }
    }

    func acknowledgeError() {
        errorMessage = nil
        synchronizeScene()
    }

    private func synchronizeScene() {
        _ = perform(announce: false) {
            try applyScenePhase(to: $0)
            return true
        }
    }

    private func applyScenePhase(to controller: TrainingController) throws {
        switch scenePhase {
        case .active: try controller.returnToForeground()
        case .inactive: try controller.becomeInactive()
        case .background: try controller.enterBackground()
        @unknown default: try controller.becomeInactive()
        }
    }

    func tick() {
        guard scenePhase == .active, archive.current != nil, errorMessage == nil else { return }
        _ = perform {
            try $0.tick()
            return true
        }
    }

    func toggleVoice() {
        var value = coachPreferences
        value.enabled.toggle()
        setCoachPreferences(value)
    }

    func setCoachPreferences(_ value: VoiceCoachPreferences) {
        preferences.coach = value
        preferences.voiceEnabled = value.enabled
        savePreferences()
        synchronizeCoach(from: nil, announce: false)
    }

    private func refreshCoachPermissions() {
        Task { await coach.notifications.refreshPermission() }
    }

    private func synchronizeCoach(from previous: WorkoutSession?, announce: Bool) {
        coach.synchronize(
            from: previous, to: archive.current, preferences: coachPreferences,
            foreground: scenePhase == .active, announce: announce
        )
    }

    private func perform(announce: Bool = true, _ operation: @MainActor (TrainingController) throws -> Bool) -> Bool {
        guard let controller else { return false }
        do {
            let previous = archive.current
            let applied = try operation(controller)
            let updated = controller.archive
            if updated != archive { archive = updated }
            if applied && announce { errorMessage = nil }
            synchronizeCoach(from: previous, announce: announce)
            return applied
        } catch {
            report(error)
            synchronizeCoach(from: nil, announce: false)
            return false
        }
    }

    private func report(_ error: any Error) {
        errorMessage = "无法读取或保存训练数据。请检查设备储存空间后重试。\n\(error.localizedDescription)"
    }

    private func savePreferences() {
        if let bytes = try? JSONEncoder().encode(preferences) {
            defaults.set(bytes, forKey: Self.preferencesKey)
        }
    }
}
