import Foundation
import SwiftUI
import TrainingCore

struct TrainingSetupView: View {
    let model: TrainingAppModel
    let plan: WorkoutPlan
    let close: @MainActor () -> Void
    let start: @MainActor (PlanSetup) -> Void
    let postpone: @MainActor (PlanSetup) -> Void
    @State private var draft: PlanSetup
    @Environment(\.dynamicTypeSize) private var typeSize

    init(
        model: TrainingAppModel, plan: WorkoutPlan, close: @escaping @MainActor () -> Void,
        start: @escaping @MainActor (PlanSetup) -> Void, postpone: @escaping @MainActor (PlanSetup) -> Void
    ) {
        self.model = model
        self.plan = plan
        self.close = close
        self.start = start
        self.postpone = postpone
        _draft = State(initialValue: model.setup(for: plan))
    }

    var body: some View {
        VStack(spacing: 8) {
            WarmSheetHeader(title: "配重与休息", close: close, titleID: AccessibilityID.Setup.title)
                .padding(.horizontal, Warm.pageEdge)
                .padding(.top, 16)
            ScrollView {
                VStack(alignment: .leading, spacing: 21) {
                    if plan.exercises.contains(where: { $0.dumbbellCount > 0 }) {
                        LoadSelector(load: $draft.load)
                    } else {
                        Text("当前为纯徒手恢复日，无需装配哑铃")
                            .font(.subheadline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(13)
                            .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 12))
                    }
                    restSettings
                }
                .padding(Warm.pageEdge)
            }
            ViewThatFits(in: .horizontal) {
                HStack { postponeButton; startButton }
                VStack { postponeButton; startButton }
            }
            .padding(.horizontal, Warm.pageEdge)
            .padding(.bottom, 10)
        }
        .safeAreaInset(edge: .top, spacing: 0) { TrainingErrorBar(model: model) }
        .presentationDetents([.fraction(0.84), .large])
        .modifier(WarmSheetBackground())
    }

    private var postponeButton: some View {
        WarmGlassButton(title: "今日顺延一天") { postpone(draft) }
    }
    private var startButton: some View {
        WarmPrimaryButton(title: "保存并开练", icon: "play.fill") { start(draft) }
            .disabled(!model.available || model.archive.current != nil)
            .accessibilityIdentifier(AccessibilityID.Setup.start)
    }

    private var restSettings: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("组间休息时长").font(.headline).accessibilityAddTraits(.isHeader)
            Text("动作间 \(draft.rest.exerciseSeconds)s · 轮间 \(draft.rest.roundSeconds)s")
                .font(.subheadline.monospacedDigit()).foregroundStyle(Warm.slate)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 2 : 4)) {
                ForEach([30, 60, 90, 120], id: \.self) { seconds in
                    let selected = draft.rest.exerciseSeconds == seconds
                    Button {
                        draft.rest = RestSettings(exerciseSeconds: seconds, roundSeconds: seconds + 30, autoAdvance: draft.rest.autoAdvance)
                    } label: {
                        Text("\(seconds)s")
                            .font(.subheadline.weight(.semibold).monospacedDigit())
                            .foregroundStyle(selected ? .white : Warm.ink)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .background(selected ? Warm.accent : Warm.limestone, in: Capsule())
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
            if draft.rest.exerciseSeconds != plan.exerciseRestSeconds || draft.rest.roundSeconds != plan.roundRestSeconds {
                WarmGlassButton(title: "恢复课程默认休息") {
                    draft.rest = RestSettings(
                        exerciseSeconds: plan.exerciseRestSeconds, roundSeconds: plan.roundRestSeconds,
                        autoAdvance: draft.rest.autoAdvance
                    )
                }
            }
            Toggle(isOn: Binding(get: { draft.rest.autoAdvance }, set: { enabled in
                draft.rest = RestSettings(
                    exerciseSeconds: draft.rest.exerciseSeconds, roundSeconds: draft.rest.roundSeconds, autoAdvance: enabled
                )
            })) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("倒计时结束自动进入下一动作").font(.subheadline.weight(.semibold))
                    Text(draft.rest.autoAdvance ? "自动推进" : "就绪后等待手动确认")
                        .font(.caption).foregroundStyle(Warm.slate)
                }
            }
            .tint(Warm.accent)
            .frame(minHeight: 44)
            .padding(10)
            .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 12))
            .accessibilityIdentifier(AccessibilityID.Setup.autoAdvance)
        }
    }
}

struct CurrentLoadView: View {
    let model: TrainingAppModel
    let close: @MainActor () -> Void
    let apply: @MainActor (RecordedLoad) -> Void
    @State private var load: RecordedLoad

    init(model: TrainingAppModel, load: RecordedLoad, close: @escaping @MainActor () -> Void, apply: @escaping @MainActor (RecordedLoad) -> Void) {
        self.model = model
        self.close = close
        self.apply = apply
        _load = State(initialValue: load)
    }

    var body: some View {
        VStack(spacing: 8) {
            WarmSheetHeader(title: "当前组实际负重", close: close)
                .padding(.horizontal, Warm.pageEdge)
                .padding(.top, 16)
            ScrollView { LoadSelector(load: $load).padding(Warm.pageEdge) }
            WarmPrimaryButton(title: "记录当前组负重") { apply(load) }
                .padding(.horizontal, Warm.pageEdge)
                .padding(.bottom, 10)
        }
        .safeAreaInset(edge: .top, spacing: 0) { TrainingErrorBar(model: model) }
        .presentationDetents([.fraction(0.84), .large])
        .modifier(WarmSheetBackground())
    }
}

private struct LoadSelector: View {
    @Binding var load: RecordedLoad
    @State private var measured = ""
    @FocusState private var measurementFocused: Bool
    @Environment(\.dynamicTypeSize) private var typeSize

    private struct PlateChoice: Identifiable, Sendable {
        let id: Int
        let perSide: [Int]
        var load: RecordedLoad { .platesPerDumbbell(grams: id) }
    }

    private static let choices: [PlateChoice] = [
        [], [1250], [1500], [2000], [2500], [1500, 1250], [2000, 1500], [2500, 2000],
        [2500, 2000, 1250], [2500, 2000, 1500, 1250]
    ].compactMap { plates in
        PlateInventory.builtIn.symmetricPlatesPerDumbbell(gramsPerSide: plates)
            .map { PlateChoice(id: $0, perSide: plates) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("哑铃装片组合").font(.headline).accessibilityAddTraits(.isHeader)
            VStack(alignment: .leading, spacing: 6) {
                Text(load.display).font(.subheadline.weight(.semibold)).monospacedDigit()
                if let choice = Self.choices.first(where: { $0.load == load }), !choice.perSide.isEmpty {
                    Text("两只对称装片占用 " + choice.perSide.map { RecordedLoad.kilograms($0) + " kg × 4" }.joined(separator: "、"))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(Warm.slate)
                }
                Text("以下用于记录实际装片。杆重、承重和装片空间待确认。")
                    .font(.caption).foregroundStyle(Warm.accentText)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 12))
            WarmGlassButton(title: "清除配重记录", icon: "xmark") { load = .unspecified; measured = "" }
                .disabled(load == .unspecified && measured.isEmpty)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 1 : 2)) {
                ForEach(Self.choices) { choice in
                    let selected = load == choice.load
                    Button { load = choice.load } label: {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(choice.load.display).font(.subheadline.weight(.semibold))
                            Text(choice.perSide.isEmpty ? "未装片" : "每侧 " + choice.perSide.map(RecordedLoad.kilograms).joined(separator: " + ") + " kg")
                                .font(.caption)
                        }
                        .monospacedDigit()
                        .foregroundStyle(selected ? Warm.canvas : Warm.ink)
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .padding(8)
                        .background(selected ? Warm.ink : Warm.limestone, in: RoundedRectangle(cornerRadius: 12))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                    .accessibilityIdentifier(AccessibilityID.Setup.plates(choice.id))
                }
            }
            ViewThatFits(in: .horizontal) {
                HStack { measuredField; applyMeasured }
                VStack(alignment: .leading) { measuredField; applyMeasured }
            }
        }
    }

    private var measuredField: some View {
        TextField("单只实测总重 (kg)", text: $measured)
            .font(.subheadline)
            .keyboardType(.decimalPad)
            .focused($measurementFocused)
            .textFieldStyle(.roundedBorder)
            .frame(minHeight: 44)
            .accessibilityLabel("单只哑铃实测总重，千克")
    }

    private var applyMeasured: some View {
        WarmGlassButton(title: "采用实测值") {
            if let grams = measuredGrams {
                load = .measuredPerDumbbell(grams: grams)
                measured = ""
                measurementFocused = false
            }
        }
        .disabled(measuredGrams == nil)
    }

    private var measuredGrams: Int? {
        let normalized = measured.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ",", with: ".")
        guard normalized.range(of: #"^[0-9]+(\.[0-9]{1,3})?$"#, options: .regularExpression) != nil,
              let value = Double(normalized), value > 0 else { return nil }
        return Int(exactly: (value * 1000).rounded())
    }
}
