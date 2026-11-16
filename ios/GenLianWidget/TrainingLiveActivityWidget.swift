import ActivityKit
import SwiftUI
import WidgetKit

@main
struct TrainingLiveActivityWidget: Widget {
    private let accent = Color(red: 0.82, green: 0.33, blue: 0.19)

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TrainingActivityAttributes.self) { context in
            let presentation = presentation(context)
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label(context.attributes.course, systemImage: "figure.strengthtraining.traditional")
                        .font(.headline)
                    Spacer(minLength: 4)
                    Text("\(round(context, presentation))/\(context.state.rounds) 轮").font(.caption.monospacedDigit())
                }
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(status(context, presentation)).font(.caption.weight(.semibold)).foregroundStyle(accent)
                        movement(context, presentation)
                    }
                    Spacer(minLength: 4)
                    countdown(presentation).font(.title3.monospacedDigit().weight(.semibold))
                }
            }
            .padding(16)
            .activityBackgroundTint(Color(red: 0.97, green: 0.95, blue: 0.91))
            .activitySystemActionForegroundColor(.black)
            .foregroundStyle(.black)
        } dynamicIsland: { context in
            let presentation = presentation(context)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(status(context, presentation), systemImage: "figure.strengthtraining.traditional")
                        .foregroundStyle(.orange)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    countdown(presentation).monospacedDigit()
                        .foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.attributes.course).font(.caption).foregroundStyle(.secondary)
                        movement(context, presentation, includeRound: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                Image(systemName: symbol(context, presentation)).foregroundStyle(.orange)
                    .accessibilityLabel(status(context, presentation))
            } compactTrailing: {
                compactLabel(context, presentation)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .foregroundStyle(.white)
            } minimal: {
                Image(systemName: symbol(context, presentation))
                    .foregroundStyle(.orange)
            }
        }
    }

    private func presentation(_ context: ActivityViewContext<TrainingActivityAttributes>) -> RestActivityPresentation? {
        let state = context.state
        guard state.stage == .rest || state.stage == .restReady else { return nil }
        return .resolve(
            deadline: state.restDeadline, isStale: context.isStale, now: .now,
            nextExercise: state.nextExercise, nextRound: state.nextRound ?? state.round,
            autoAdvance: state.autoAdvance ?? false
        )
    }

    private func status(_ context: ActivityViewContext<TrainingActivityAttributes>, _ presentation: RestActivityPresentation?) -> String {
        if case .next(_, _, let waiting) = presentation {
            return waiting ? "休息结束 · 等待确认" : "准备下一动作"
        }
        return context.state.stage.rawValue
    }

    private func round(_ context: ActivityViewContext<TrainingActivityAttributes>, _ presentation: RestActivityPresentation?) -> Int {
        if case .next(_, let nextRound, _) = presentation { return nextRound }
        return context.state.round
    }

    private func symbol(_ context: ActivityViewContext<TrainingActivityAttributes>, _ presentation: RestActivityPresentation?) -> String {
        if context.state.stage == .paused { return "pause.fill" }
        if case .next(_, _, let waiting) = presentation { return waiting ? "hand.tap" : "arrow.right" }
        return "figure.strengthtraining.traditional"
    }

    @ViewBuilder
    private func movement(
        _ context: ActivityViewContext<TrainingActivityAttributes>, _ presentation: RestActivityPresentation?, includeRound: Bool = false
    ) -> some View {
        let state = context.state
        let rounds = "第 \(round(context, presentation))/\(state.rounds) 轮"
        if case .next(let exercise, _, _) = presentation {
            if let exercise { Text("下一动作 · \(exercise)").font(.subheadline.weight(.semibold)) }
            if includeRound { Text(rounds).font(.caption).foregroundStyle(.secondary) }
        } else {
            Text(includeRound ? "\(state.exercise) · \(rounds)" : state.exercise).font(.subheadline.weight(.semibold))
            if let next = state.nextExercise { Text("下一动作 · \(next)").font(.caption).foregroundStyle(.secondary) }
        }
    }

    @ViewBuilder
    private func countdown(_ presentation: RestActivityPresentation?) -> some View {
        let now = Date.now
        if case .countdown(let deadline) = presentation, now < deadline {
            Text(timerInterval: now...deadline, countsDown: true)
                .multilineTextAlignment(.trailing)
        }
    }

    @ViewBuilder
    private func compactLabel(_ context: ActivityViewContext<TrainingActivityAttributes>, _ presentation: RestActivityPresentation?) -> some View {
        if case .countdown = presentation {
            countdown(presentation).frame(width: 44, alignment: .trailing)
        } else if case .next(let exercise, let round, _) = presentation, let exercise {
            Text(exercise)
                .accessibilityLabel("\(status(context, presentation))，\(exercise)，第 \(round) 轮")
        } else {
            Text(status(context, presentation))
        }
    }
}
