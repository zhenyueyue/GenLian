import SwiftUI
import TrainingCore

struct WorkoutRestView: View {
    let session: WorkoutSession
    let send: @MainActor (WorkoutAction) -> Void
    @ScaledMetric(relativeTo: .largeTitle) private var countdownSize: CGFloat = 90
    @Environment(\.dynamicTypeSize) private var typeSize

    private var ready: Bool { session.phase == .restReady }

    var body: some View {
        if let rest = session.rest, let owner = session.restOwner {
            VStack(spacing: 12) {
                GeometryReader { viewport in
                    ScrollView {
                        countdown(rest, compact: viewport.size.height < 480)
                            .frame(minHeight: viewport.size.height)
                    }
                    .scrollBounceBehavior(.basedOnSize)
                }
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 6) {
                        adjustButtons(owner)
                        finishButton(owner)
                    }
                    VStack(spacing: 6) {
                        HStack(spacing: 6) { adjustButtons(owner) }
                        finishButton(owner)
                    }
                }
            }
        }
    }

    private func countdown(_ rest: RestTiming, compact: Bool) -> some View {
        let ending = !ready && rest.remainingSeconds <= 3
        return VStack(spacing: 11) {
            Text(title(rest.kind))
                .font(.subheadline.weight(.semibold)).foregroundStyle(Warm.canvas)
                .accessibilityAddTraits(.isHeader)
            Text(ready ? "就绪" : workoutClock(rest.remainingSeconds, roundsUp: true))
                .font(.system(size: countdownSize * (compact ? 0.82 : 1), weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(ending ? Warm.restAccent : Warm.canvas)
                .lineLimit(1)
                .minimumScaleFactor(0.35)
                .contentTransition(.identity)
                .accessibilityLabel(ready ? "休息完成，等待手动确认" : "剩余 \(Int(rest.remainingSeconds.rounded(.up))) 秒")
            progress(rest)
            Text("已实休 \(Int(rest.actualSeconds))s · 设定 \(Int(rest.targetSeconds))s")
                .font(.caption.monospacedDigit())
                .foregroundStyle(Warm.canvas)
                .multilineTextAlignment(.center)
            if let next = session.upcomingPosition {
                preview(next)
                    .padding(.top, 10)
            }
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
    }

    private func title(_ kind: RestKind) -> String {
        switch (session.plan.category, kind) {
        case (.recovery, .round): "舒展过渡"
        case (.recovery, .exercise): "舒展间歇"
        case (.cardio, .round): "间歇恢复"
        case (.cardio, .exercise): "有氧训练间歇"
        case (_, .round): "轮间恢复"
        case (_, .exercise): "组间恢复"
        }
    }

    private func progress(_ rest: RestTiming) -> some View {
        let fraction = CGFloat(min(1, rest.actualSeconds / max(1, rest.targetSeconds)))
        return GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Warm.canvas.opacity(0.28))
                Capsule().fill(Warm.restAccent).frame(width: proxy.size.width * fraction)
            }
        }
        .frame(maxWidth: 192)
        .frame(height: 2.5)
        .accessibilityHidden(true)
    }

    private func preview(_ next: SetPosition) -> some View {
        let exercise = session.plan.exercises[next.exerciseIndex]
        let label = next.round == session.position.round ? "下一个 · \(next.exerciseIndex + 1)/\(session.plan.exercises.count)" : "下一个 · 第 \(next.round) 轮"
        return HStack(spacing: 10) {
            if !typeSize.isAccessibilitySize {
                WarmPhotoView(photo: WarmMedia.wide(exercise.id))
                    .frame(width: 84, height: 48)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .accessibilityHidden(true)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(label).font(.caption.weight(.semibold)).foregroundStyle(Warm.accentText)
                Text(exercise.name).font(.headline)
                Text("\(exercise.target.display) · \(session.initialLoad(for: exercise).display)")
                    .font(.caption.monospacedDigit()).foregroundStyle(Warm.slate)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .foregroundStyle(Warm.ink)
        .frame(maxWidth: 350, alignment: .leading)
        .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 16))
    }

    private func adjustButtons(_ owner: SetKey) -> some View {
        GlassEffectContainer(spacing: 5) {
            HStack(spacing: 5) {
                WarmGlassButton(title: "−15s", tone: .dim) { send(.adjustRest(owner, .subtractFifteen)) }
                    .disabled(ready)
                    .accessibilityLabel("减少休息 15 秒")
                WarmGlassButton(title: "+15s", tone: .dim) { send(.adjustRest(owner, .addFifteen)) }
                    .accessibilityLabel("增加休息 15 秒")
            }
        }
    }

    private func finishButton(_ owner: SetKey) -> some View {
        WarmGlassButton(title: ready ? "开始下一动作" : "提前结束休息", tone: .elevated, fillsWidth: true) {
            send(.finishRest(owner))
        }
    }
}

struct PrepareStage: View {
    let session: WorkoutSession
    let start: @MainActor () -> Void
    @ScaledMetric(relativeTo: .largeTitle) private var countdownSize: CGFloat = 88
    @ScaledMetric(relativeTo: .title) private var transitionSize: CGFloat = 54

    private var preparing: Bool { session.phase == .prepare }
    private var phaseTitle: String {
        let position = session.position
        if preparing { return "第 \(position.round) 轮 · 准备就位" }
        if position.round > 1, position.exerciseIndex == 0, position.set == 1 {
            return "第 \(position.round) 轮 · 下一轮开始"
        }
        return "第 \(position.round) 轮 · 切换动作 \(position.exerciseIndex + 1)/\(session.plan.exercises.count)"
    }

    var body: some View {
        let seconds = Int((session.countdownSeconds ?? 0).rounded(.up))
        let exercise = session.currentExercise
        VStack(spacing: 10) {
            GeometryReader { viewport in
                ScrollView {
                    VStack(spacing: 10) {
                        Text(phaseTitle)
                            .font(.subheadline.weight(.semibold))
                        Text(exercise.name)
                            .font(.title.weight(.semibold))
                            .accessibilityAddTraits(.isHeader)
                        Text("\(seconds)")
                            .font(.system(size: preparing && viewport.size.height < 480 ? countdownSize * 0.84 : (preparing ? countdownSize : transitionSize), weight: .semibold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(seconds <= 3 ? Warm.restAccent : Warm.canvas)
                            .accessibilityLabel("剩余 \(seconds) 秒")
                        Text(exercise.preparationCue).font(.subheadline)
                        Text("\(session.initialLoad(for: exercise).display) · 目标 \(exercise.target.display)")
                            .font(.caption.monospacedDigit())
                    }
                    .padding(.horizontal, 6)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Warm.canvas)
                    .frame(maxWidth: .infinity, minHeight: viewport.size.height)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
            WarmGlassButton(
                title: preparing ? "我已就位，立即开始" : "直接开始本动作（\(exercise.target.display)）",
                tone: .elevated, fillsWidth: true, action: start
            )
        }
    }
}
