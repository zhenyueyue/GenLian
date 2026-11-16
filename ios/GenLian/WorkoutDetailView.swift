import SwiftUI
import TrainingCore

struct WorkoutDetailView: View {
    let plan: WorkoutPlan
    let load: RecordedLoad
    let index: Int
    let mediaAnimation: Namespace.ID
    let changeIndex: @MainActor (Int) -> Void
    let close: @MainActor () -> Void
    var startTitle: String
    var canStart: Bool
    let start: @MainActor () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .title2) private var titleSize: CGFloat = 26

    private var exercise: Exercise { plan.exercises[index] }

    var body: some View {
        GeometryReader { viewport in
            ZStack(alignment: .top) {
                ScrollView {
                    VStack(spacing: 0) {
                        art(height: viewport.size.height * (viewport.size.height < 690 ? 0.48 : 0.54))
                        details.padding(.horizontal, Warm.pageEdge).padding(.vertical, 16)
                    }
                }
                .ignoresSafeArea(edges: .top)
                navigation.padding(.horizontal, Warm.stageEdge).padding(.top, 6)
            }
        }
        .safeAreaInset(edge: .bottom) {
            WarmPrimaryButton(title: startTitle, icon: "play.fill", action: start)
                .disabled(!canStart)
                .padding(6)
                .warmGlass(.elevated, in: Capsule())
                .padding(.horizontal, Warm.stageEdge)
                .padding(.vertical, 8)
        }
        .foregroundStyle(Warm.ink)
        .background(Warm.canvas.ignoresSafeArea())
    }

    private var navigation: some View {
        ViewThatFits(in: .horizontal) {
            HStack { back; Spacer(minLength: 4); indicator; arrows }
            VStack {
                HStack { back; Spacer(); arrows }
                indicator
            }
        }
    }

    private var back: some View {
        WarmGlassButton(title: "今日", icon: "chevron.left", action: close)
            .accessibilityIdentifier(AccessibilityID.Detail.back)
    }
    private var indicator: some View {
        Text("动作 \(index + 1) / \(plan.exercises.count)")
            .font(.caption.weight(.semibold).monospacedDigit())
            .padding(9)
            .warmGlass(.elevated, in: Capsule())
    }
    private var arrows: some View {
        GlassEffectContainer(spacing: 6) {
            HStack(spacing: 6) {
                WarmGlassButton(title: "上一个动作", icon: "chevron.left", iconOnly: true) { changeIndex(index - 1) }
                    .disabled(index == 0)
                WarmGlassButton(title: "下一个动作", icon: "chevron.right", iconOnly: true) { changeIndex(index + 1) }
                    .disabled(index + 1 >= plan.exercises.count)
            }
        }
    }

    private func art(height: CGFloat) -> some View {
        ZStack(alignment: .bottomLeading) {
            let photo = WarmPhotoView(photo: WarmMedia.stage(exercise.id)?.contained(), message: "暂无该动作姿态图")
            if reduceMotion { photo }
            else { photo.matchedGeometryEffect(id: exercise.id, in: mediaAnimation) }
            LinearGradient(stops: [
                .init(color: Warm.canvas.opacity(0.78), location: 0),
                .init(color: .clear, location: 0.34),
                .init(color: Warm.canvas.opacity(0.88), location: 0.82),
                .init(color: Warm.canvas, location: 1)
            ], startPoint: .top, endPoint: .bottom)
            .allowsHitTesting(false)
            VStack(alignment: .leading, spacing: 6) {
                Text("\(plan.category.rawValue) · \(exercise.muscleGroup)\(exercise.unilateral ? " · 单侧" : "")")
                    .font(.caption.weight(.semibold)).foregroundStyle(Warm.accentText)
                Text(exercise.name).font(.system(size: titleSize, weight: .semibold))
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier(AccessibilityID.Detail.title)
            }
            .padding(.horizontal, Warm.pageEdge)
            .padding(.bottom, 9)
        }
        .frame(height: height + (typeSize.isAccessibilitySize ? 92 : 0))
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("目标 \(exercise.target.display) · \(exercise.dumbbellCount == 0 ? "徒手自重" : load.display) · \(exercise.tempo)")
                .font(.subheadline.monospacedDigit()).foregroundStyle(Warm.slate)
            Divider()
            Text("发力与节奏要求").font(.headline).accessibilityAddTraits(.isHeader)
            let beats = exercise.tempo.split(separator: "-").compactMap { Int($0) }
            if beats.count == 3 {
                let labels = ["离心下放", "底部停顿", "发力推拉"]
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: typeSize.isAccessibilitySize ? 1 : 3)) {
                    ForEach(beats.indices, id: \.self) { index in
                        VStack(spacing: 4) {
                            Text("\(beats[index])s").font(.title3.weight(.semibold).monospacedDigit())
                            Text(labels[index]).font(.caption).foregroundStyle(Warm.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(9)
                        .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 12))
                    }
                }
            } else {
                Text(exercise.tempo).font(.subheadline).foregroundStyle(Warm.slate)
            }
            Text(exercise.coachingCue).foregroundStyle(Warm.secondary)
            Divider()
            Text("重点部位").font(.headline)
            Text(exercise.targetMuscle).foregroundStyle(Warm.secondary)
            Text("就位提示").font(.headline)
            Text(exercise.preparationCue).foregroundStyle(Warm.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
