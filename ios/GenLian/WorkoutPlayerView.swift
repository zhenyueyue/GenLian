import SwiftUI
import TrainingCore
import UIKit

struct WorkoutPlayerView: View {
    let model: TrainingAppModel
    let session: WorkoutSession
    let mediaAnimation: Namespace.ID
    let returnToToday: @MainActor () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.warmReduceTransparency) private var reduceTransparency
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var showsExit = false
    @State private var resumeAfterExit = false
    @State private var showsLoad = false
    @State private var editingKey: SetKey?

    private var reviewing: Bool { session.reviewPosition != nil }
    private var exercise: Exercise {
        session.plan.exercises[(session.reviewPosition ?? session.position).exerciseIndex]
    }
    private var restPhase: Bool { session.phase == .rest || session.phase == .restReady }
    private var dim: Bool { session.phase != .active }
    private var tone: WarmGlassTone { dim ? .dim : .light }

    var body: some View {
        ZStack {
            stageBackground.ignoresSafeArea()
            VStack(spacing: 8) {
                hud
                phaseContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.horizontal, Warm.stageEdge)
            .padding(.top, 5)
            .padding(.bottom, 8)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: session.phase)
            .accessibilityHidden(session.isPaused || session.needsResume)
            .allowsHitTesting(!session.isPaused && !session.needsResume)
            if session.isPaused || session.needsResume { pauseOverlay }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay {
            if session.phase == .setComplete && !session.isPaused && !session.needsResume {
                RoundedRectangle(cornerRadius: 20).strokeBorder(Warm.accent.opacity(0.8), lineWidth: 2)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
            }
        }
        .sheet(isPresented: $showsExit, onDismiss: closeExit) { exitSheet }
        .sheet(isPresented: $showsLoad, onDismiss: closeLoad) {
            if let editingKey {
                CurrentLoadView(model: model, load: session.currentResult.load, close: { showsLoad = false }) { load in
                    guard let current = model.archive.current, current.id == session.id,
                          current.currentKey == editingKey else { return }
                    var draft = current.currentDraft
                    draft.load = load
                    if send(.updateDraft(editingKey, draft)) { showsLoad = false }
                }
            }
        }
    }

    private var stageBackground: some View {
        GeometryReader { proxy in
            let photo = WarmPhotoView(photo: WarmMedia.stage(exercise.id), immersive: true)
            let intensity: Double = restPhase ? 0.72 : (session.phase == .setComplete ? 0.74 : (dim ? 0.76 : 1))
            ZStack {
                Group {
                    if reduceMotion { photo }
                    else { photo.matchedGeometryEffect(id: exercise.id, in: mediaAnimation) }
                }
                .id(exercise.id)
                .transition(.opacity)
                .colorMultiply(Color(white: intensity))
                .saturation(restPhase ? 0.82 : 1)
                .scaleEffect(!reduceMotion && restPhase ? 1.015 : 1)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.32), value: exercise.id)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.5), value: restPhase)
                Warm.smoke.opacity(restPhase ? 0.32 : (dim ? 0.26 : 0))
                    .animation(reduceMotion ? nil : .easeOut(duration: 0.5), value: restPhase)
                VStack(spacing: 0) {
                    LinearGradient(
                        colors: [dim ? Warm.ink.opacity(0.65) : Warm.canvas.opacity(0.92), .clear],
                        startPoint: .top, endPoint: .bottom
                    )
                    .frame(height: 144)
                    Spacer(minLength: 0)
                    LinearGradient(
                        colors: [.clear, dim ? Warm.ink.opacity(0.56) : Warm.canvas],
                        startPoint: .top, endPoint: .bottom
                    )
                    .frame(height: proxy.size.height * (proxy.size.height < 720 ? 0.40 : 0.37))
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private var hud: some View {
        VStack(spacing: 7) {
            HStack(spacing: 4) {
                ForEach(session.plan.exercises.indices, id: \.self) { index in
                    Capsule().fill(progressColor(index)).frame(height: 2.5)
                }
            }
            .accessibilityHidden(true)

            ViewThatFits(in: .horizontal) {
                GlassEffectContainer(spacing: 6) {
                    HStack(spacing: 6) { exitButton; Spacer(minLength: 0); status; Spacer(minLength: 0); voiceButton }
                }
                VStack(spacing: 6) {
                    HStack { exitButton; Spacer(); voiceButton }
                    status
                }
            }
            HStack(spacing: 6) {
                Text(WarmMedia.stage(exercise.id) == nil ? "暂无该动作实拍视频或姿态图" : "静态姿态参考 · 按自身节奏发力")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(tone.foreground)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .warmGlass(tone, in: Capsule())
                Spacer(minLength: 0)
                if dim {
                    WarmGlassButton(title: restPhase ? "暂停休息" : "暂停", icon: "pause.fill", tone: tone) {
                        send(.pause)
                    }
                }
            }
        }
    }

    private func progressColor(_ index: Int) -> Color {
        let item = session.plan.exercises[index]
        let completed = session.loggedSets.filter {
            $0.key.position.round == session.position.round && $0.key.position.exerciseIndex == index
        }.count
        if completed == item.setsPerRound * (item.unilateral ? 2 : 1) { return Warm.accent }
        if index == session.position.exerciseIndex { return dim ? Warm.canvas : Warm.ink }
        return (dim ? Warm.canvas : Warm.ink).opacity(0.25)
    }

    private var exitButton: some View {
        WarmGlassButton(title: "退出", icon: "chevron.left", tone: tone, action: openExit)
            .accessibilityIdentifier(AccessibilityID.Player.exit)
    }
    private var voiceButton: some View {
        WarmGlassButton(
            title: model.voiceEnabled ? "关闭语音提示" : "开启语音提示",
            icon: model.voiceEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill", tone: tone, iconOnly: true,
            action: model.toggleVoice
        )
    }
    private var status: some View {
        Text("第 \(session.position.round)/\(session.plan.rounds) 轮 · 动作 \(session.position.exerciseIndex + 1)/\(session.plan.exercises.count) · \(workoutClock(session.elapsedSeconds))")
            .font(.caption.monospacedDigit().weight(.semibold))
            .multilineTextAlignment(.center)
            .foregroundStyle(tone.foreground)
            .padding(9)
            .warmGlass(tone, in: Capsule())
            .accessibilityIdentifier(AccessibilityID.Player.status)
    }

    @ViewBuilder
    private var phaseContent: some View {
        switch session.phase {
        case .prepare, .nextTransition:
            PrepareStage(session: session) { send(.startPreparedAction(session.phase, session.position)) }
        case .active:
            activeStage
        case .setComplete:
            confirmationStage
        case .rest, .restReady:
            WorkoutRestView(session: session) { action in _ = send(action) }
        case .summary:
            EmptyView()
        }
    }

    private var activeStage: some View {
        VStack(spacing: 8) {
            GeometryReader { available in
                ScrollView {
                    activeInformation
                        .frame(minHeight: available.size.height, alignment: .bottom)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
            if reviewing {
                WarmPrimaryButton(title: "返回当前动作") { send(.returnToCurrent) }
            } else {
                WarmPrimaryButton(title: completeTitle, icon: "checkmark") {
                    if send(.completeDraft(session.currentKey)) {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    }
                }
                .disabled(session.currentResult.measurement.value <= 0)
                .accessibilityIdentifier(AccessibilityID.Player.complete)
            }
            activeControls
        }
    }

    private var activeInformation: some View {
        let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 10))
            : AnyLayout(HStackLayout(alignment: .bottom, spacing: 10))
        return layout {
            VStack(alignment: .leading, spacing: 6) {
                if reviewing {
                    Text("回看 · 第 \((session.reviewPosition ?? session.position).round) 轮")
                        .font(.caption.weight(.semibold)).foregroundStyle(Warm.accentText)
                } else if exercise.unilateral {
                    sideSelector
                }
                Text("\(exercise.muscleGroup) · \(exercise.tempo)")
                    .font(.caption.monospacedDigit()).foregroundStyle(Warm.slate)
                Text(exercise.name).font(.title2.weight(.semibold)).accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier(AccessibilityID.Player.exercise(exercise.id))
                Text(model.voiceEnabled ? exercise.coachingCue : exercise.targetMuscle)
                    .font(.subheadline).foregroundStyle(Warm.secondary)
                if !reviewing {
                    Text("动作计时 \(workoutClock(session.currentActionSeconds))")
                        .font(.caption.weight(.semibold).monospacedDigit()).foregroundStyle(Warm.slate)
                        .accessibilityIdentifier(AccessibilityID.Player.actionTime)
                    if exercise.dumbbellCount > 0 {
                        WarmGlassButton(title: session.currentResult.load.display, icon: "slider.horizontal.3", action: openLoad)
                            .accessibilityHint("编辑当前组实际负重")
                    } else {
                        Text("徒手自重").font(.caption).foregroundStyle(Warm.slate)
                    }
                }
            }
            if !typeSize.isAccessibilitySize { Spacer(minLength: 0) }
            if !reviewing { stepper }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(Warm.ink)
        .padding(.bottom, 4)
        .padding(.top, 10)
        .background(alignment: .bottom) {
            if reduceTransparency {
                Warm.canvas.allowsHitTesting(false)
            } else {
                LinearGradient(colors: [.clear, Warm.canvas.opacity(0.96)], startPoint: .top, endPoint: .bottom)
                    .allowsHitTesting(false)
            }
        }
    }

    private var sideSelector: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 4) { sideButton(.left); sideButton(.right) }
            VStack(alignment: .leading, spacing: 4) { sideButton(.left); sideButton(.right) }
        }
    }

    private func sideButton(_ side: Side) -> some View {
        let name = side == .left ? "左侧" : "右侧"
        let completed = session.loggedSets.contains { $0.key == SetKey(position: session.position, side: side) }
        let active = side == session.side
        return Button {
            send(.chooseSide(side, session.position))
        } label: {
            Text(completed ? name + " ✓" : (active ? name + " 进行中" : name))
                .font(.caption.weight(.semibold))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 9)
                .frame(minWidth: 44, minHeight: 44)
                .foregroundStyle(active ? Color.white : Warm.ink)
                .background(active ? Warm.accent : Warm.limestone, in: Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(completed || active)
        .accessibilityAddTraits(active ? .isSelected : [])
        .accessibilityLabel(completed ? name + "已完成" : (active ? name + "进行中" : name))
        .accessibilityIdentifier(AccessibilityID.Player.side(side.rawValue))
    }

    private var stepper: some View {
        let measurement = session.currentResult.measurement
        let layout = typeSize.isAccessibilitySize ? AnyLayout(HStackLayout(spacing: 8)) : AnyLayout(VStackLayout(spacing: 0))
        return layout {
            stepButton("plus", title: "增加实际\(measurement.unitText)") { changeMeasurement(1) }
                .accessibilityIdentifier(AccessibilityID.Player.increase)
            Button {
                updateMeasurement(nil)
            } label: {
                VStack(spacing: 1) {
                    Text("\(measurement.value)").font(.title2.weight(.semibold).monospacedDigit())
                    Text(measurement.unitText).font(.caption)
                }
                .frame(minWidth: 52, minHeight: 48)
                .foregroundStyle(session.currentDraft.measurement == nil ? Warm.ink : Warm.accentText)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(session.currentDraft.measurement == nil)
            .accessibilityLabel("实际\(measurement.display)")
            .accessibilityHint(measurement.unit == .seconds ? "恢复跟随动作计时" : "重置为目标次数")
            stepButton("minus", title: "减少实际\(measurement.unitText)") { changeMeasurement(-1) }
                .disabled(measurement.value <= 1)
        }
        .padding(3)
        .warmGlass(.elevated, in: Capsule())
    }

    private func stepButton(_ icon: String, title: String, action: @escaping @MainActor () -> Void) -> some View {
        Button { action() } label: {
            Image(systemName: icon)
                .font(.subheadline.weight(.semibold))
                .frame(minWidth: 44, minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.borderless)
        .tint(Warm.ink)
        .accessibilityLabel(title)
    }

    private var completeTitle: String {
        let sideName = session.side == .left ? "左侧" : "右侧"
        let value = session.currentResult.measurement.display
        if exercise.unilateral {
            let otherSide: Side = session.side == .left ? .right : .left
            let oppositeDone = session.loggedSets.contains {
                $0.key == SetKey(position: session.position, side: otherSide)
            }
            if !oppositeDone { return "完成\(sideName) (\(value)) · 切\(otherSide == .left ? "左侧" : "右侧")" }
            return "完成\(sideName) · 记 \(value)"
        }
        return (session.upcomingPosition == nil ? "完成收官组" : "完成本动作") + " · 记 \(value)"
    }

    private var activeControls: some View {
        HStack(spacing: 3) {
            StageAuxButton(title: "上一动作", icon: "backward.end.fill") {
                send(.reviewPrevious(session.reviewPosition ?? session.position))
            }
            .disabled(!session.canReviewPrevious)
            StageAuxButton(title: "暂停", icon: "pause.fill") { send(.pause) }
                .accessibilityIdentifier(AccessibilityID.Player.pause)
            StageAuxButton(title: "跳过动作", icon: "forward.end.fill") { send(.skipExercise(session.currentKey)) }
                .disabled(reviewing)
                .accessibilityIdentifier(AccessibilityID.Player.skip)
        }
        .padding(4)
        .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 22))
    }

    private var confirmationStage: some View {
        VStack(spacing: 8) {
            if let owner = session.restOwner, let logged = session.loggedSets.last(where: { $0.key == owner }) {
                GeometryReader { available in
                    ScrollView {
                        confirmedValues(logged)
                            .frame(minHeight: available.size.height, alignment: .bottom)
                    }
                    .scrollBounceBehavior(.basedOnSize)
                }
                WarmPrimaryButton(
                    title: session.confirmationHeld ? "进入组间休息" : "立即进入休息 (\(Int(session.rest?.targetSeconds ?? 0))s)"
                ) { send(.startRest(owner)) }
                    .accessibilityIdentifier(AccessibilityID.Player.enterRest)
            }
        }
    }

    private func confirmedValues(_ log: LoggedSet) -> some View {
        let actual = log.result.measurement
        return VStack(alignment: .leading, spacing: 11) {
            Text("本组已实录 · \(exercise.name)").font(.headline)
            Text(session.confirmationHeld ? "已暂停自动倒数" : "\(Int((session.countdownSeconds ?? 0).rounded(.up)))s 后进休息")
                .font(.caption.monospacedDigit()).foregroundStyle(Warm.slate)
            HStack {
                WarmGlassButton(title: "减少实际\(actual.unitText)", icon: "minus", iconOnly: true) {
                    edit(log, measurement: actual.withValue(actual.value - 1), effort: log.result.effort)
                }
                .disabled(actual.value <= 1)
                Spacer()
                Text(actual.display).font(.title2.weight(.semibold).monospacedDigit())
                Spacer()
                WarmGlassButton(title: "增加实际\(actual.unitText)", icon: "plus", iconOnly: true) {
                    edit(log, measurement: actual.withValue(actual.value + 1), effort: log.result.effort)
                }
            }
            Text("主观感受").font(.caption).foregroundStyle(Warm.secondary)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 1 : 3)) {
                effortButton("轻松", effort: .easy, log: log)
                effortButton("正好", effort: .appropriate, log: log)
                effortButton("吃力", effort: .hard, log: log)
            }
        }
        .padding(14)
        .foregroundStyle(Warm.ink)
        .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 16))
    }

    private func effortButton(_ title: String, effort: Effort, log: LoggedSet) -> some View {
        let selected = log.result.effort == effort
        return Button {
            edit(log, measurement: log.result.measurement, effort: effort)
        } label: {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(selected ? Warm.canvas : Warm.ink)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(selected ? Warm.ink : Warm.limestone, in: Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private var pauseOverlay: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text(session.needsResume ? "本次训练已暂存" : "主动暂停 · 已暂停 \(Int(session.pausedSeconds))s")
                    .font(.headline).foregroundStyle(Warm.slate)
                    .accessibilityValue(session.phase == .active ? "动作计时 \(workoutClock(session.currentActionSeconds))" : "")
                    .accessibilityIdentifier(AccessibilityID.Player.pauseStatus)
                Text(session.currentExercise.name).font(.largeTitle.weight(.semibold)).accessibilityAddTraits(.isHeader)
                Text("第 \(session.position.round) 轮 · 已录 \(session.totals.completedSets) 组")
                    .font(.subheadline.monospacedDigit()).foregroundStyle(Warm.secondary)
                WarmPrimaryButton(title: "继续跟练", icon: "play.fill") { send(.resume) }
                    .accessibilityIdentifier(AccessibilityID.Player.resume)
                WarmGlassButton(title: "退出或结束训练", fillsWidth: true, action: openExit)
            }
            .multilineTextAlignment(.center)
            .padding(Warm.pageEdge)
        }
        .defaultScrollAnchor(.center, for: .alignment)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundStyle(Warm.ink)
        .background {
            if reduceTransparency { Warm.canvas.ignoresSafeArea() }
            else {
                Rectangle().fill(.regularMaterial)
                    .overlay(Warm.canvas.opacity(0.90))
                    .ignoresSafeArea()
            }
        }
        .accessibilityAddTraits(.isModal)
    }

    private var exitSheet: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                WarmSheetHeader(title: "退出训练") { showsExit = false }
                Text(session.loggedSets.isEmpty ? "结束后会保留一条完成 0 组的记录。" : "结束后会保留已完成的组实录。")
                    .font(.subheadline).foregroundStyle(Warm.secondary)
                WarmPrimaryButton(title: "继续当前训练", graphite: true) {
                    if let current = model.archive.current, current.isPaused || current.needsResume {
                        guard send(.resume) else { return }
                    }
                    resumeAfterExit = false
                    showsExit = false
                }
                WarmGlassButton(title: "保存进度并退出", fillsWidth: true) {
                    if session.needsResume || send(.saveForLater) {
                        resumeAfterExit = false
                        showsExit = false
                        returnToToday()
                    }
                }
                WarmGlassButton(title: "提前结束并查看结果", fillsWidth: true) {
                    if send(.end) {
                        resumeAfterExit = false
                        showsExit = false
                    }
                }
                .accessibilityIdentifier(AccessibilityID.Player.end)
            }
            .padding(Warm.pageEdge)
        }
        .safeAreaInset(edge: .top, spacing: 0) { TrainingErrorBar(model: model) }
        .presentationDetents([.medium, .large])
        .modifier(WarmSheetBackground())
    }

    private func openExit() {
        if !session.isPaused && !session.needsResume {
            guard send(.pause) else { return }
            resumeAfterExit = true
        }
        showsExit = true
    }

    private func closeExit() {
        guard resumeAfterExit else { return }
        resumeAfterExit = false
        if model.archive.current?.isPaused == true { send(.resume) }
    }

    private func openLoad() {
        guard send(.pause) else { return }
        editingKey = session.currentKey
        showsLoad = true
    }

    private func closeLoad() {
        let key = editingKey
        editingKey = nil
        if let current = model.archive.current, current.id == session.id, current.currentKey == key, current.isPaused {
            send(.resume)
        }
    }

    private func changeMeasurement(_ change: Int) {
        guard let current = model.archive.current, current.id == session.id,
              current.currentKey == session.currentKey else { return }
        let measurement = current.currentResult.measurement
        updateMeasurement(measurement.withValue(max(1, measurement.value + change)))
    }

    private func updateMeasurement(_ measurement: SetMeasurement?) {
        guard let current = model.archive.current, current.id == session.id,
              current.currentKey == session.currentKey else { return }
        var draft = current.currentDraft
        draft.measurement = measurement
        send(.updateDraft(session.currentKey, draft))
    }

    private func edit(_ log: LoggedSet, measurement: SetMeasurement, effort: Effort?) {
        send(.editConfirmedSet(log.key, SetResult(measurement, load: log.result.load, effort: effort)))
    }

    @discardableResult
    private func send(_ action: WorkoutAction) -> Bool { model.send(action, for: session.id) }
}

private struct StageAuxButton: View {
    let title: String
    let icon: String
    let action: @MainActor () -> Void
    @Environment(\.isEnabled) private var enabled

    var body: some View {
        Button { action() } label: {
            VStack(spacing: 2) {
                Image(systemName: icon)
                Text(title).multilineTextAlignment(.center)
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(Warm.ink)
            .frame(maxWidth: .infinity, minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .opacity(enabled ? 1 : 0.45)
    }
}
