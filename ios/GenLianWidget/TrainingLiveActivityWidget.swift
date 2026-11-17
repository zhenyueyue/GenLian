import ActivityKit
import SwiftUI
import WidgetKit

@main
struct TrainingLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TrainingActivityAttributes.self) { context in
            TrainingLockScreen(course: context.attributes.course, display: TrainingDisplay(context))
                .activityBackgroundTint(HUD.background)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let display = TrainingDisplay(context)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.bottom) {
                    TrainingIslandHUD(display: display)
                }
            } compactLeading: {
                Label(display.shortStatus, systemImage: display.symbol)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                    .foregroundStyle(display.appearance.accent)
                    .frame(
                        width: IslandLayout.compactWidth, height: IslandLayout.compactHeight, alignment: .leading
                    )
                    .accessibilityLabel(display.status)
            } compactTrailing: {
                CompactTrainingTimer(display: display)
            } minimal: {
                Image(systemName: display.symbol)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(display.appearance.accent)
                    .accessibilityLabel(display.status)
            }
            .contentMargins(.horizontal, 26, for: .expanded)
            .contentMargins(.top, 13, for: .expanded)
            .contentMargins(.bottom, 18, for: .expanded)
            .contentMargins(.leading, 10, for: .compactLeading)
            .contentMargins(.trailing, 10, for: .compactTrailing)
            .keylineTint(HUD.orange)
        }
    }
}

private enum IslandLayout {
    static let compactWidth: CGFloat = 49
    static let compactHeight: CGFloat = 20
}

private struct CompactTrainingTimer: View {
    let display: TrainingDisplay

    var body: some View {
        if display.timer != nil || display.heldTime != nil {
            HStack(spacing: 4) {
                CountdownNumber(display: display)
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .layoutPriority(1)
                if display.stage == .ready {
                    PreparationTempo(running: display.timer != nil)
                } else if let interval = display.timer {
                    CountdownArc(interval: interval, appearance: display.appearance, size: 14)
                }
            }
            .frame(width: IslandLayout.compactWidth, height: IslandLayout.compactHeight, alignment: .trailing)
        }
    }
}

private struct PreparationTempo: View {
    let running: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 2) {
            ForEach(0..<4) { index in
                Capsule()
                    .fill(CountdownAppearance.preparation.accent.opacity(running ? 1 : 0.42))
                    .frame(width: 2, height: CGFloat(5 + 3 * index))
            }
        }
        .accessibilityHidden(true)
    }
}

private struct TrainingDisplay {
    let stage: TrainingActivityAttributes.Stage
    let title: String
    let next: String?
    let round: Int
    let rounds: Int
    let completed: [Int]
    let timer: ClosedRange<Date>?
    let heldTime: String?
    let portrait: String?

    init(_ context: ActivityViewContext<TrainingActivityAttributes>, now: Date = .now) {
        let state = context.state
        var stage = state.stage
        var title = state.exercise
        var next = state.nextExercise
        var round = state.round
        var deadline: Date?
        if state.stage == .rest || state.stage == .restReady {
            switch RestActivityPresentation.resolve(
                deadline: state.restDeadline, isStale: context.isStale, now: now,
                nextExercise: state.nextExercise, nextRound: state.nextRound ?? state.round,
                autoAdvance: state.autoAdvance ?? false
            ) {
            case .countdown(let until):
                deadline = until
            case .next(let exercise, let nextRound, let waitsForConfirmation):
                stage = waitsForConfirmation ? .restReady : .ready
                title = exercise ?? state.exercise
                next = nil
                round = nextRound
            }
        } else if state.stage == .ready, let until = state.preparationDeadline, now < until {
            deadline = until
        }
        self.stage = stage
        self.title = stage == .completed ? "训练完成" : title
        self.next = stage == .completed ? nil : next
        self.round = round
        rounds = state.rounds
        completed = state.completedRounds ?? []
        if let deadline {
            let start = state.timerStart ?? now
            timer = min(start, now)...deadline
        } else {
            timer = nil
        }
        heldTime = state.preparationSeconds.map { String($0) }
        portrait = switch stage {
        case .rest, .restReady: "CoachRest"
        case .ready: "CoachReady"
        case .exercise: state.movementID == "ex-floor-press" ? "CoachFloorPress" : nil
        case .paused: nil
        case .completed: "CoachComplete"
        }
    }

    var shortStatus: String {
        stage == .restReady ? "待确认" : stage.rawValue
    }

    var status: String {
        stage == .restReady ? "休息结束 · 等待确认" : stage.rawValue
    }

    var symbol: String {
        switch stage {
        case .rest: "hourglass"
        case .restReady: "hand.tap.fill"
        case .ready: "bolt.fill"
        case .exercise: "dumbbell.fill"
        case .paused: "pause.fill"
        case .completed: "checkmark"
        }
    }

    var roundLabel: String { "第 \(round)/\(rounds) 轮" }
    var completedLabel: String { "已完成 \(completed.count) 轮" }
    var appearance: CountdownAppearance { stage == .ready ? .preparation : .rest }

    var nextLabel: String? {
        next.map { "下一动作 · \($0)" }
    }

    var detail: String? {
        switch stage {
        case .restReady: "打开跟练确认下一动作"
        case .ready where timer == nil: "打开跟练继续"
        case .paused: "打开跟练继续"
        case .completed: "本次训练已完成"
        default: nil
        }
    }
}

private enum HUD {
    static let background = Color(red: 0.067, green: 0.047, blue: 0.051)
    static let orange = Color(red: 1, green: 0.73, blue: 0.47)
    static let ember = Color(red: 0.47, green: 0.19, blue: 0.11)
    static let primary = Color(red: 1, green: 0.97, blue: 0.92)
    static let secondary = Color(red: 0.83, green: 0.76, blue: 0.70)
    static let track = Color.white.opacity(0.18)
}

private enum CountdownAppearance: Equatable {
    case rest, preparation

    var accent: Color {
        switch self {
        case .rest: HUD.orange
        case .preparation: Color(red: 1, green: 0.62, blue: 0.48)
        }
    }

    var light: Color {
        switch self {
        case .rest: Color(red: 1, green: 0.87, blue: 0.65)
        case .preparation: Color(red: 1, green: 0.76, blue: 0.60)
        }
    }

    var deep: Color {
        switch self {
        case .rest: Color(red: 1, green: 0.54, blue: 0.23)
        case .preparation: Color(red: 0.99, green: 0.42, blue: 0.29)
        }
    }

    var gradient: AngularGradient {
        AngularGradient(
            colors: [light, accent, deep, accent, light], center: .center,
            startAngle: .degrees(-90), endAngle: .degrees(270)
        )
    }
}

private struct TrainingIslandHUD: View {
    let display: TrainingDisplay
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 10) {
            TimerFace(display: display, size: typeSize.isAccessibilitySize ? 58 : 77)
            VStack(alignment: .leading, spacing: 5) {
                Label(display.shortStatus, systemImage: display.symbol)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(display.appearance.accent)
                    .lineLimit(1)
                    .accessibilityLabel(display.status)
                TrainingMovementText(display: display, includeRestTitle: false)
                Text(display.roundLabel)
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(HUD.secondary)
                RoundTrack(display: display)
                    .frame(maxWidth: 104)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .layoutPriority(1)
            CoachPortrait(
                name: display.portrait, appearance: display.appearance,
                width: typeSize.isAccessibilitySize ? 58 : 88, height: 91
            )
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.20), value: display.stage)
    }
}

private struct TrainingLockScreen: View {
    let course: String
    let display: TrainingDisplay
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                VStack(alignment: .leading, spacing: 2) {
                    Label("GenLian", systemImage: "dumbbell.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(HUD.orange)
                    Text(course)
                        .font(.caption2)
                        .lineLimit(1)
                        .foregroundStyle(HUD.secondary)
                }
                Spacer(minLength: 2)
                Text(display.status)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(display.appearance.accent)
            }
            HStack(alignment: .center, spacing: 10) {
                TimerFace(display: display, size: typeSize.isAccessibilitySize ? 56 : 72)
                TrainingMovementText(display: display, includeRestTitle: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .layoutPriority(1)
                CoachPortrait(
                    name: display.portrait, appearance: display.appearance,
                    width: typeSize.isAccessibilitySize ? 50 : 83, height: 74
                )
            }
            VStack(spacing: 4) {
                HStack(spacing: 6) {
                    Text(display.roundLabel)
                    Spacer(minLength: 0)
                    Text(display.completedLabel)
                }
                .font(.caption2.monospacedDigit())
                .foregroundStyle(HUD.secondary)
                RoundTrack(display: display)
            }
        }
        .padding(11)
        .background {
            if !reduceTransparency {
                RadialGradient(colors: [HUD.ember.opacity(0.52), .clear], center: .bottomTrailing, startRadius: 6, endRadius: 171)
            }
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.20), value: display.stage)
    }
}

private struct TrainingMovementText: View {
    let display: TrainingDisplay
    let includeRestTitle: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            if display.stage != .rest || includeRestTitle || display.nextLabel == nil {
                Text(display.stage == .rest && includeRestTitle ? "休息一下" : display.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(HUD.primary)
                    .lineLimit(2)
            }
            if let next = display.nextLabel, display.stage == .rest || display.stage == .exercise {
                Text(next)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(HUD.secondary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            } else if let detail = display.detail {
                Text(detail)
                    .font(.caption2)
                    .foregroundStyle(HUD.secondary)
                    .lineLimit(2)
            }
        }
    }
}

private struct CoachPortrait: View {
    let name: String?
    let appearance: CountdownAppearance
    let width: CGFloat
    let height: CGFloat
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        if let name {
            Image(name)
                .resizable()
                .scaledToFit()
                .frame(width: width, height: height)
                .background {
                    if !reduceTransparency {
                        ZStack {
                            RadialGradient(
                                colors: [HUD.ember.opacity(0.73), .clear], center: .bottomTrailing,
                                startRadius: 0, endRadius: width * 1.3
                            )
                            Ellipse()
                                .trim(from: 0.08, to: 0.47)
                                .stroke(appearance.accent.opacity(0.50), style: StrokeStyle(lineWidth: 1.2, lineCap: .round))
                                .frame(width: width, height: height * 0.47)
                                .rotationEffect(.degrees(-22))
                                .offset(y: height * 0.10)
                                .shadow(color: appearance.accent.opacity(0.55), radius: 4)
                        }
                    }
                }
                .id(name)
                .transition(.opacity)
                .accessibilityHidden(true)
        }
    }
}

private struct CountdownNumber: View {
    let display: TrainingDisplay

    var body: some View {
        Group {
            if let interval = display.timer {
                if display.stage == .ready {
                    Text(.currentDate, format: .timer(
                        countingDownIn: interval.lowerBound..<interval.upperBound,
                        showsHours: false, maxFieldCount: 1
                    ))
                } else {
                    Text(timerInterval: interval, countsDown: true, showsHours: false)
                }
            } else if let time = display.heldTime {
                Text(time)
                    .accessibilityLabel("准备倒计时已停在 \(time) 秒")
            }
        }
        .monospacedDigit()
        .contentTransition(.numericText(countsDown: true))
        .lineLimit(1)
        .minimumScaleFactor(0.72)
        .foregroundStyle(display.timer == nil ? HUD.secondary : HUD.primary)
    }
}

private struct CountdownArc: View {
    let interval: ClosedRange<Date>
    let appearance: CountdownAppearance
    let size: CGFloat
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        ZStack {
            Circle().strokeBorder(HUD.track, style: stroke(width: max(1.5, size * 0.085)))
            appearance.gradient
                .mask {
                    ProgressView(timerInterval: interval, countsDown: true) {
                        EmptyView()
                    } currentValueLabel: {
                        EmptyView()
                    }
                    .progressViewStyle(.circular)
                    .controlSize(.large)
                    .tint(.white)
                    .padding(2)
                    .frame(width: 32, height: 32)
                    .scaleEffect(size / 32)
                }
                .mask {
                    if appearance == .preparation {
                        Circle().strokeBorder(.white, style: stroke(width: size * 0.20))
                    } else {
                        Rectangle()
                    }
                }
                .shadow(color: appearance.accent.opacity(reduceTransparency || size < 30 ? 0 : 0.45), radius: 5)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private func stroke(width: CGFloat) -> StrokeStyle {
        StrokeStyle(
            lineWidth: width,
            lineCap: appearance == .rest ? .round : .butt,
            dash: appearance == .rest ? [] : [size * 0.058, size * 0.019]
        )
    }
}

private struct TimerFace: View {
    let display: TrainingDisplay
    let size: CGFloat

    var body: some View {
        ZStack {
            if let interval = display.timer {
                CountdownArc(interval: interval, appearance: display.appearance, size: size)
            }
            if display.timer != nil || display.heldTime != nil {
                CountdownNumber(display: display)
                    .font(.system(size: size * (display.stage == .ready ? 0.40 : 0.27), weight: .semibold))
                    .padding(.horizontal, size * 0.14)
            } else {
                Image(systemName: display.symbol)
                    .font(.system(size: size * 0.32, weight: .semibold))
                    .foregroundStyle(display.appearance.accent)
                    .accessibilityHidden(true)
            }
        }
        .frame(width: size, height: size)
    }
}

private struct RoundTrack: View {
    let display: TrainingDisplay

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<display.rounds, id: \.self) { index in
                let round = index + 1
                let filled = display.completed.contains(round)
                let current = round == display.round && display.stage != .completed
                Capsule()
                    .fill(filled ? display.appearance.accent : current ? display.appearance.accent.opacity(0.58) : HUD.track)
            }
        }
        .frame(height: 5)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("已完成 \(display.completed.count)/\(display.rounds) 轮，\(display.roundLabel)")
    }
}
