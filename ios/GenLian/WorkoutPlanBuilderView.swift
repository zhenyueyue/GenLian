import Foundation
import SwiftUI
import TrainingCore

struct WorkoutPlanBuilderView: View {
    let model: TrainingAppModel
    let close: @MainActor () -> Void
    let start: @MainActor (WorkoutPlan) -> Void
    private let editing: Bool

    @State private var draft: WorkoutPlanDraft
    @State private var editMode: EditMode = .inactive

    init(
        model: TrainingAppModel, plan: WorkoutPlan?, close: @escaping @MainActor () -> Void,
        start: @escaping @MainActor (WorkoutPlan) -> Void
    ) {
        self.model = model
        self.close = close
        self.start = start
        editing = plan != nil
        _draft = State(initialValue: plan.map { WorkoutPlanDraft(editing: $0, rest: model.setup(for: $0).rest) } ?? .init())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("计划") {
                    TextField("例如：居家全身训练", text: $draft.title)
                        .accessibilityLabel("计划名称")
                        .onChange(of: draft.title) { _, title in
                            if title.count > WorkoutPlanDraft.titleLimit {
                                draft.title = String(title.prefix(WorkoutPlanDraft.titleLimit))
                            }
                        }
                    Stepper("训练 \(draft.rounds) 轮", value: $draft.rounds, in: WorkoutPlanDraft.roundsRange)
                    Stepper(
                        "组间休息 \(draft.exerciseRestSeconds) 秒", value: $draft.exerciseRestSeconds,
                        in: WorkoutPlanDraft.restRange, step: 5
                    )
                    if draft.rounds > 1 {
                        Stepper(
                            "轮间休息 \(draft.roundRestSeconds) 秒", value: $draft.roundRestSeconds,
                            in: WorkoutPlanDraft.restRange, step: 5
                        )
                    }
                }
                Section {
                    ForEach($draft.items) { $item in
                        PlanExerciseEditor(item: $item, rounds: draft.rounds)
                    }
                    .onMove { draft.items.move(fromOffsets: $0, toOffset: $1) }
                    .onDelete { draft.items.remove(atOffsets: $0) }

                    NavigationLink {
                        ExerciseLibraryView(library: model.exerciseLibrary, items: $draft.items)
                    } label: {
                        Label("从动作库选动作", systemImage: "plus.circle")
                            .foregroundStyle(Warm.accentText)
                    }
                } header: {
                    Text("动作顺序")
                } footer: {
                    if !draft.items.isEmpty {
                        Text("点「排序」拖动或移除动作。单侧动作的组数与目标按每侧计算。")
                    }
                }
                Section {
                    let plan = draft.makePlan()
                    WarmPrimaryButton(title: editing ? "保存修改" : "保存为今日计划", icon: "checkmark") {
                        if let plan, model.saveCustomPlan(plan) { close() }
                    }
                    .disabled(plan == nil)
                    WarmGlassButton(title: "只练这一次", icon: "play.fill", fillsWidth: true) {
                        if let plan { start(plan) }
                    }
                    .disabled(plan == nil || model.archive.current != nil || !model.available)
                } footer: {
                    if model.archive.current != nil {
                        Text("已有训练会话。归档后可以开始新的训练。")
                    } else if draft.makePlan() == nil {
                        Text("填写计划名称并至少选一个动作。")
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Warm.canvas)
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(editing ? "编辑计划" : "自建计划")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("关闭", action: close) }
                ToolbarItem(placement: .primaryAction) {
                    Button(editMode.isEditing ? "完成" : "排序") {
                        withAnimation { editMode = editMode.isEditing ? .inactive : .active }
                    }
                    .disabled(draft.items.isEmpty && !editMode.isEditing)
                }
            }
            .environment(\.editMode, $editMode)
            .safeAreaInset(edge: .top, spacing: 0) { TrainingErrorBar(model: model) }
        }
        .tint(Warm.accentText)
    }
}

private struct PlanExerciseEditor: View {
    @Binding var item: WorkoutPlanDraft.Item
    let rounds: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(item.exercise.name).font(.headline)
            if item.exercise.unilateral {
                Text("左右侧独立记录").font(.caption).foregroundStyle(Warm.secondary)
            }
            Stepper(
                rounds > 1 ? "每轮 \(item.sets) 组" : "\(item.sets) 组", value: $item.sets,
                in: WorkoutPlanDraft.setsRange
            )
            let step = item.target.unit == .seconds ? 5 : 1
            Stepper("每组 \(item.target.display)", value: $item.targetValue, in: item.targetRange, step: step)
        }
        .padding(.vertical, 4)
    }
}

private struct ExerciseLibraryView: View {
    let library: [Exercise]
    @Binding var items: [WorkoutPlanDraft.Item]
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var matches: [Exercise] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return library }
        return library.filter {
            [$0.name, $0.muscleGroup, $0.targetMuscle].contains { $0.localizedCaseInsensitiveContains(query) }
        }
    }

    var body: some View {
        List {
            if matches.isEmpty {
                ContentUnavailableView.search(text: search)
            }
            ForEach(matches) { exercise in
                let selected = items.contains { $0.id == exercise.id }
                Button {
                    if let index = items.firstIndex(where: { $0.id == exercise.id }) {
                        items.remove(at: index)
                    } else {
                        items.append(.init(exercise))
                    }
                } label: {
                    HStack(spacing: 12) {
                        if let photo = WarmMedia.wide(exercise.id) {
                            WarmPhotoView(photo: photo)
                                .frame(width: 54, height: 42)
                                .clipShape(RoundedRectangle(cornerRadius: 7))
                                .accessibilityHidden(true)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text(exercise.name).font(.subheadline.weight(.semibold))
                            Text("\(exercise.muscleGroup) · \(exercise.target.display)")
                                .font(.caption)
                                .foregroundStyle(Warm.secondary)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(selected ? Warm.accentText : Warm.secondary)
                            .accessibilityHidden(true)
                    }
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .scrollContentBackground(.hidden)
        .background(Warm.canvas)
        .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always), prompt: "搜索动作、部位")
        .navigationTitle("动作库")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("完成（\(items.count)）") { dismiss() }
            }
        }
    }
}
