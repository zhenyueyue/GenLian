import Foundation
import SwiftUI
import TrainingCore

struct TodayView: View {
    let model: TrainingAppModel
    let plan: WorkoutPlan
    let startTitle: String
    let start: @MainActor () -> Void
    let showSetup: @MainActor () -> Void
    let showDetail: @MainActor (Int) -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .largeTitle) private var heroTitle: CGFloat = 31
    @State private var scrollY: CGFloat = 0

    private var setup: PlanSetup { model.setup(for: plan) }
    private var media: WarmMedia.Plan? { WarmMedia.plans[plan.id] }
    private var docked: Bool { scrollY > 180 }
    private var postponed: Bool { model.isPostponed(plan) }
    private var canStart: Bool { model.available && (!postponed || model.archive.current != nil) }
    private var hasEquipment: Bool { plan.exercises.contains { $0.dumbbellCount > 0 } }

    var body: some View {
        GeometryReader { viewport in
            ZStack(alignment: .top) {
                ScrollView {
                    VStack(spacing: 22) {
                        hero(height: heroHeight(for: viewport.size))
                        VStack(alignment: .leading, spacing: 24) {
                            actions
                            movementList
                            courseGrid
                        }
                        .padding(.horizontal, Warm.pageEdge)
                        .padding(.bottom, 14)
                    }
                }
                .ignoresSafeArea(edges: .top)
                .onScrollGeometryChange(for: CGFloat.self) {
                    max(0, $0.contentOffset.y + $0.contentInsets.top)
                } action: { _, value in
                    scrollY = value
                }
                header
            }
        }
        .foregroundStyle(Warm.ink)
        .background(Warm.canvas.ignoresSafeArea())
    }

    private var header: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text("跟练").font(.headline)
                Text(docked ? plan.title : "弹性训练 · 居家哑铃")
                    .font(.caption)
                    .foregroundStyle(Warm.secondary)
                    .lineLimit(typeSize.isAccessibilitySize ? 2 : 1)
            }
            Spacer(minLength: 4)
            if docked {
                WarmPrimaryButton(title: startTitle, compact: true, action: start).disabled(!canStart)
            } else {
                WarmGlassButton(title: "配重设定", icon: "slider.horizontal.3", action: showSetup)
            }
        }
        .padding(.horizontal, Warm.pageEdge)
        .padding(.vertical, 7)
        .background {
            if docked {
                Rectangle().fill(.clear)
                    .warmGlass(.elevated, in: Rectangle())
                    .ignoresSafeArea(edges: .top)
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: docked)
    }

    private func heroHeight(for size: CGSize) -> CGFloat {
        let base: CGFloat = size.height < 690 ? 425 : (size.width >= 415 ? 540 : 500)
        return base + (typeSize.isAccessibilitySize ? 90 : 0)
    }

    private func hero(height: CGFloat) -> some View {
        ZStack(alignment: .bottomLeading) {
            WarmPhotoView(photo: media?.hero)
                .scaleEffect(reduceMotion ? 1 : 1 + min(0.07, scrollY * 0.00035))
                .offset(y: reduceMotion ? 0 : min(96, scrollY * 0.26))
                .opacity(reduceMotion ? 1 : max(0.35, 1 - scrollY / 390))
            LinearGradient(colors: [Warm.canvas.opacity(0.9), .clear], startPoint: .top, endPoint: .bottom)
                .frame(height: 144)
                .frame(maxHeight: .infinity, alignment: .top)
            LinearGradient(stops: [
                .init(color: .clear, location: 0.44),
                .init(color: Warm.canvas.opacity(0.72), location: 0.72),
                .init(color: Warm.canvas.opacity(0.96), location: 0.88),
                .init(color: Warm.canvas, location: 1)
            ], startPoint: .top, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 7) {
                Text(media?.kicker ?? plan.category.rawValue)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Warm.accentText)
                Text(plan.title).font(.system(size: heroTitle, weight: .semibold))
                    .accessibilityAddTraits(.isHeader)
                Text("\(plan.estimatedMinutesRange) · \(plan.rounds) 轮 · \(hasEquipment ? setup.load.display : "徒手自重")")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(Warm.secondary)
            }
            .padding(.horizontal, Warm.pageEdge)
            .padding(.bottom, 12)
            .offset(y: reduceMotion ? 0 : -min(22, scrollY * 0.14))
            .opacity(reduceMotion ? 1 : max(0, 1 - scrollY / 160))
        }
        .frame(height: height)
        .clipped()
    }

    private var actions: some View {
        VStack(alignment: .leading, spacing: 9) {
            if postponed && model.archive.current == nil {
                VStack(alignment: .leading, spacing: 10) {
                    Text("今日顺延 · 留出恢复余量").font(.headline)
                    Text("已暂缓「\(plan.title)」").font(.subheadline)
                    WarmPrimaryButton(title: "恢复今日训练") { model.resumePlan(plan) }
                    if plan.category != .recovery, let recovery = model.plans.first(where: { $0.category == .recovery }) {
                        WarmGlassButton(title: "改做恢复日", fillsWidth: true) { model.select(recovery) }
                    }
                }
                .padding(14)
                .background(Warm.limestone, in: RoundedRectangle(cornerRadius: 16))
            } else {
                ViewThatFits(in: .horizontal) {
                    HStack {
                        WarmPrimaryButton(title: startTitle, icon: "play.fill", action: start).disabled(!canStart)
                        WarmGlassButton(title: "配重与休息", icon: "slider.horizontal.3", action: showSetup)
                    }
                    VStack {
                        WarmPrimaryButton(title: startTitle, icon: "play.fill", action: start).disabled(!canStart)
                        WarmGlassButton(title: "配重与休息", icon: "slider.horizontal.3", fillsWidth: true, action: showSetup)
                    }
                }
                HStack(spacing: 10) {
                    Text(media?.intent ?? plan.subtitle).font(.subheadline).foregroundStyle(Warm.secondary)
                    Spacer(minLength: 0)
                    Button("歇 \(setup.rest.exerciseSeconds)s") { showSetup() }
                        .font(.caption.monospacedDigit().weight(.semibold))
                        .foregroundStyle(Warm.slate)
                        .frame(minWidth: 44, minHeight: 44)
                }
            }
        }
    }

    private var movementList: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("今日动作顺序").font(.headline).accessibilityAddTraits(.isHeader)
            ForEach(plan.exercises.indices, id: \.self) { index in
                let exercise = plan.exercises[index]
                Button { showDetail(index) } label: {
                    if index == 0 { lead(exercise) }
                    else { movementRow(exercise, index: index) }
                }
                .buttonStyle(.plain)
                Divider().overlay(Warm.divider)
            }
            if hasEquipment {
                Label("杆重、杆体承重和锁扣上限待确认。片重仅用于记录实际装片。", systemImage: "exclamationmark.circle")
                    .font(.caption)
                    .foregroundStyle(Warm.accentText)
            }
        }
    }

    private func lead(_ exercise: Exercise) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            WarmPhotoView(photo: WarmMedia.wide(exercise.id), message: "暂无该动作姿态图")
                .aspectRatio(16.0 / 9, contentMode: .fit)
                .overlay(alignment: .bottomLeading) {
                    HStack {
                        Text("01 · \(exercise.muscleGroup)")
                        Spacer()
                        Text("\(exercise.target.display) · 节奏 \(exercise.tempo)")
                    }
                    .font(.caption.weight(.semibold).monospacedDigit())
                    .foregroundStyle(.white)
                    .padding(11)
                    .background {
                        LinearGradient(colors: [.clear, Warm.ink.opacity(0.88)], startPoint: .top, endPoint: .bottom)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 12))
            movementText(exercise)
        }
        .contentShape(Rectangle())
    }

    private func movementRow(_ exercise: Exercise, index: Int) -> some View {
        HStack(spacing: 12) {
            WarmPhotoView(photo: WarmMedia.wide(exercise.id))
                .frame(width: typeSize.isAccessibilitySize ? 70 : 108, height: typeSize.isAccessibilitySize ? 54 : 81)
                .overlay(alignment: .bottomLeading) {
                    Text(String(format: "%02d", index + 1))
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Warm.ink.opacity(0.75), in: RoundedRectangle(cornerRadius: 5))
                        .padding(4)
                }
                .clipShape(RoundedRectangle(cornerRadius: 8))
            movementText(exercise, includeTarget: true)
        }
        .contentShape(Rectangle())
    }

    private func movementText(_ exercise: Exercise, includeTarget: Bool = false) -> some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name).font(.subheadline.weight(.semibold))
                Text(exercise.targetMuscle).foregroundStyle(Warm.secondary)
                Text("\(exercise.dumbbellCount == 0 ? "徒手自重" : setup.load.display) · \(exercise.tempo)")
                    .foregroundStyle(Warm.slate)
                if exercise.unilateral { Text("左右各练一组").foregroundStyle(Warm.slate) }
                if WarmMedia.stage(exercise.id) == nil { Text("暂无该动作姿态图").foregroundStyle(Warm.secondary) }
            }
            .font(.caption)
            Spacer(minLength: 4)
            if includeTarget {
                Text(exercise.target.display).font(.caption.weight(.semibold).monospacedDigit()).foregroundStyle(Warm.accentText)
            }
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(Warm.secondary)
        }
        .frame(minHeight: 44)
    }

    private var courseGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("更换训练内容").font(.headline).accessibilityAddTraits(.isHeader)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 1 : 2)) {
                ForEach(model.plans) { option in
                    Button { model.select(option) } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            WarmPhotoView(photo: WarmMedia.plans[option.id]?.wide)
                                .frame(height: 70)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            HStack {
                                Text(option.category.rawValue).font(.subheadline.weight(.semibold))
                                Spacer()
                                if plan.id == option.id {
                                    Image(systemName: "checkmark").foregroundStyle(Warm.accentText)
                                }
                            }
                            Text(option.estimatedMinutesRange).font(.caption.monospacedDigit()).foregroundStyle(Warm.secondary)
                        }
                        .padding(8)
                        .background(Warm.limestone, in: RoundedRectangle(cornerRadius: 12))
                        .overlay {
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(plan.id == option.id ? Warm.accent : Warm.divider, lineWidth: 1.5)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(plan.id == option.id ? .isSelected : [])
                }
            }
        }
    }
}
