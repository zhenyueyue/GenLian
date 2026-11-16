import AVFoundation
import Foundation
import Observation
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
    @ObservationIgnored private var sceneActive = false
    @ObservationIgnored private let voice = TrainingVoice()
    @ObservationIgnored private let defaults: UserDefaults
    private static let preferencesKey = "genlian.training-preferences"

    init() {
        #if DEBUG
        defaults = UITestLaunch.preferences()
        #else
        defaults = .standard
        #endif
        if let bytes = defaults.data(forKey: Self.preferencesKey),
           let saved = try? JSONDecoder().decode(TrainingPreferences.self, from: bytes) {
            preferences = saved
        }
    }

    var plan: WorkoutPlan? { plans.first { $0.id == preferences.planID } ?? plans.first }
    var voiceEnabled: Bool { preferences.voiceEnabled }

    func open() {
        guard controller == nil else { return }
        do {
            plans = try BuiltInCatalog.load()
            #if DEBUG
            let sessionController = try UITestLaunch.controller()
            #else
            let sessionController = try TrainingController(store: AtomicTrainingStore.applicationSupport())
            #endif
            if !sceneActive { try sessionController.enterBackground() }
            controller = sessionController
            archive = sessionController.archive
            available = true
            errorMessage = nil
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

    func setSceneActive(_ active: Bool) {
        guard sceneActive != active else { return }
        sceneActive = active
        if !active { voice.stop() }
        synchronizeScene()
    }

    func acknowledgeError() {
        errorMessage = nil
        synchronizeScene()
    }

    private func synchronizeScene() {
        _ = perform(announce: false) {
            if sceneActive {
                try $0.returnToForeground()
            } else {
                try $0.enterBackground()
            }
            return true
        }
    }

    func tick() {
        guard sceneActive, archive.current != nil, errorMessage == nil else { return }
        _ = perform {
            try $0.tick()
            return true
        }
    }

    func toggleVoice() {
        preferences.voiceEnabled.toggle()
        if !voiceEnabled { voice.stop() }
        savePreferences()
    }

    private func perform(announce: Bool = true, _ operation: @MainActor (TrainingController) throws -> Bool) -> Bool {
        guard let controller else { return false }
        do {
            let previous = archive.current
            let applied = try operation(controller)
            let updated = controller.archive
            if updated != archive { archive = updated }
            if applied && announce { errorMessage = nil }
            if announce && sceneActive && voiceEnabled {
                voice.transition(from: previous, to: updated.current)
            }
            return applied
        } catch {
            report(error)
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

@MainActor
private final class TrainingVoice {
    private let synthesizer = AVSpeechSynthesizer()

    init() { synthesizer.usesApplicationAudioSession = false }
    func stop() { synthesizer.stopSpeaking(at: .immediate) }

    func transition(from old: WorkoutSession?, to current: WorkoutSession?) {
        guard let old, let current, old.id == current.id else { return }
        if current.isPaused || current.needsResume {
            stop()
            return
        }
        let phrase: String
        switch (old.phase, current.phase) {
        case (.prepare, .active), (.nextTransition, .active):
            phrase = "开始，\(current.currentExercise.name)"
        case (.rest, .nextTransition), (.restReady, .nextTransition):
            phrase = "休息结束，准备\(current.currentExercise.name)"
        case (.active, .active) where old.side != current.side && current.loggedSets.count > old.loggedSets.count:
            phrase = current.side == .left ? "请换左侧" : "请换右侧"
        case (_, .summary) where old.phase != .summary && current.outcome == .completed:
            phrase = "全部轮次已完成，辛苦了"
        default:
            return
        }
        stop()
        let utterance = AVSpeechUtterance(string: phrase)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-CN")
        synthesizer.speak(utterance)
    }
}
