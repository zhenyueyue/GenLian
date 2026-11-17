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
                DynamicIslandExpandedRegion(.leading) {
                    Label(display.shortStatus, systemImage: display.symbol)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(HUD.orange)
                        .frame(minHeight: 20, alignment: .leading)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(display.roundLabel)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(HUD.secondary)
                        .frame(minHeight: 20, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    TrainingIslandHUD(display: display)
                }
            } compactLeading: {
                Image(systemName: display.symbol)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(HUD.orange)
                    .frame(
                        width: IslandLayout.compactWidth, height: IslandLayout.compactHeight, alignment: .leading
                    )
                    .accessibilityLabel(display.status)
            } compactTrailing: {
                Group {
                    if let interval = display.timer {
                        TimerDigits(interval: interval)
                    } else if let time = display.heldTime {
                        Text(time).accessibilityLabel("准备倒计时已停在 \(time)")
                    } else {
                        Text(display.shortStatus).accessibilityLabel(display.status)
                    }
                }
                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                .foregroundStyle(HUD.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .multilineTextAlignment(.trailing)
                .frame(
                    width: IslandLayout.compactWidth, height: IslandLayout.compactHeight, alignment: .trailing
                )
            } minimal: {
                Image(systemName: display.symbol)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(HUD.orange)
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
    static let compactWidth: CGFloat = 38
    static let compactHeight: CGFloat = 20
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
        heldTime = state.preparationSeconds.map { String(format: "%d:%02d", $0 / 60, $0 % 60) }
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

    var detail: String? {
        switch stage {
        case .restReady: "打开跟练确认下一动作"
        case .ready where timer == nil: "打开跟练继续"
        case .paused: "打开跟练继续"
        case .completed: "本次训练已完成"
        default: next.map { "下一动作 · \($0)" }
        }
    }
}

private enum HUD {
    static let background = Color(red: 0.067, green: 0.060, blue: 0.057)
    static let orange = Color(red: 1, green: 0.60, blue: 0.34)
    static let primary = Color.white
    static let secondary = Color(red: 0.79, green: 0.76, blue: 0.73)
    static let track = Color.white.opacity(0.19)
}

private struct TrainingIslandHUD: View {
    let display: TrainingDisplay
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                TimerFace(display: display, size: 53)
                VStack(alignment: .leading, spacing: 3) {
                    Text(display.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(HUD.primary)
                        .lineLimit(2)
                    if let detail = display.detail {
                        Text(detail)
                            .font(.caption2)
                            .foregroundStyle(HUD.secondary)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                CoachPortrait(name: display.portrait, width: 71, height: 61)
            }
            RoundTrack(display: display)
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.20), value: display.stage)
    }
}

private struct TrainingLockScreen: View {
    let course: String
    let display: TrainingDisplay
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Label("GenLian", systemImage: "dumbbell.fill")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(HUD.orange)
                Text(course)
                    .font(.caption)
                    .lineLimit(1)
                    .foregroundStyle(HUD.secondary)
                    .accessibilityLabel(course)
                Spacer(minLength: 2)
                Text(display.status)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(HUD.orange)
            }
            HStack(alignment: .center, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(display.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(HUD.primary)
                        .lineLimit(2)
                    Text(display.roundLabel)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(HUD.orange)
                    if let detail = display.detail {
                        Text(detail)
                            .font(.caption2)
                            .foregroundStyle(HUD.secondary)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(1)
                ZStack(alignment: .bottomLeading) {
                    CoachPortrait(name: display.portrait, width: typeSize.isAccessibilitySize ? 78 : 134, height: 88)
                        .padding(.leading, typeSize.isAccessibilitySize ? 12 : 26)
                    TimerFace(display: display, size: 59)
                        .background(HUD.background, in: Circle())
                }
            }
            RoundTrack(display: display)
        }
        .padding(13)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.20), value: display.stage)
    }
}

private struct CoachPortrait: View {
    let name: String?
    let width: CGFloat
    let height: CGFloat

    var body: some View {
        if let name {
            Image(name)
                .resizable()
                .scaledToFit()
                .frame(width: width, height: height)
                .background {
                    RadialGradient(colors: [HUD.orange.opacity(0.25), .clear], center: .center, startRadius: 0, endRadius: width * 0.52)
                }
                .id(name)
                .transition(.opacity)
                .accessibilityHidden(true)
        }
    }
}

private struct TimerDigits: View {
    let interval: ClosedRange<Date>

    var body: some View {
        Text(timerInterval: interval, countsDown: true, showsHours: false)
            .monospacedDigit()
            .contentTransition(.numericText(countsDown: true))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .foregroundStyle(HUD.primary)
    }
}

private struct TimerFace: View {
    let display: TrainingDisplay
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle().strokeBorder(HUD.track, lineWidth: 2)
            if let interval = display.timer {
                ProgressView(timerInterval: interval, countsDown: true) {
                    EmptyView()
                } currentValueLabel: {
                    EmptyView()
                }
                .progressViewStyle(.circular)
                .tint(HUD.orange)
                .accessibilityHidden(true)
                TimerDigits(interval: interval)
                    .font(.system(size: size * 0.25, weight: .semibold, design: .monospaced))
                    .padding(.horizontal, 5)
            } else if let time = display.heldTime {
                Text(time)
                    .font(.system(size: size * 0.25, weight: .semibold, design: .monospaced))
                    .foregroundStyle(HUD.secondary)
                    .accessibilityLabel("准备倒计时已停在 \(time)")
            } else {
                Image(systemName: display.symbol)
                    .font(.system(size: size * 0.32, weight: .semibold))
                    .foregroundStyle(HUD.orange)
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
                    .fill(filled ? HUD.orange : current ? HUD.orange.opacity(0.48) : HUD.track)
                    .overlay {
                        if current && !filled {
                            Capsule().strokeBorder(HUD.orange, lineWidth: 1)
                        }
                    }
            }
        }
        .frame(height: 4)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("已完成 \(display.completed.count)/\(display.rounds) 轮，\(display.roundLabel)")
    }
}
