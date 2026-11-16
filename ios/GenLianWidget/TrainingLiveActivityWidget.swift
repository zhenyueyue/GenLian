import ActivityKit
import SwiftUI
import WidgetKit

@main
struct TrainingLiveActivityWidget: Widget {
    private let accent = Color(red: 0.82, green: 0.33, blue: 0.19)

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TrainingActivityAttributes.self) { context in
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label(context.attributes.course, systemImage: "figure.strengthtraining.traditional")
                        .font(.headline)
                    Spacer(minLength: 4)
                    Text("\(context.state.round)/\(context.state.rounds) 轮").font(.caption.monospacedDigit())
                }
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(status(context)).font(.caption.weight(.semibold)).foregroundStyle(accent)
                        Text(context.state.exercise).font(.subheadline.weight(.semibold))
                        if let next = context.state.nextExercise {
                            Text("下一动作 · \(next)").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Spacer(minLength: 4)
                    countdown(context).font(.title3.monospacedDigit().weight(.semibold))
                }
            }
            .padding(16)
            .activityBackgroundTint(Color(red: 0.97, green: 0.95, blue: 0.91))
            .activitySystemActionForegroundColor(.black)
            .foregroundStyle(.black)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(status(context), systemImage: "figure.strengthtraining.traditional")
                        .foregroundStyle(.orange)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    countdown(context).monospacedDigit()
                        .foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.attributes.course).font(.caption).foregroundStyle(.secondary)
                        Text("\(context.state.exercise) · 第 \(context.state.round)/\(context.state.rounds) 轮")
                            .font(.subheadline.weight(.semibold))
                        if let next = context.state.nextExercise { Text("下一动作 · \(next)").font(.caption) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                Image(systemName: "figure.strengthtraining.traditional").foregroundStyle(.orange)
            } compactTrailing: {
                countdown(context)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .frame(width: context.state.restDeadline == nil ? nil : 44, alignment: .trailing)
                    .foregroundStyle(.white)
            } minimal: {
                Image(systemName: context.state.stage == .paused ? "pause.fill" : "figure.strengthtraining.traditional")
                    .foregroundStyle(.orange)
            }
        }
    }

    private func status(_ context: ActivityViewContext<TrainingActivityAttributes>) -> String {
        context.state.stage == .rest && context.isStale ? "休息结束" : context.state.stage.rawValue
    }

    @ViewBuilder
    private func countdown(_ context: ActivityViewContext<TrainingActivityAttributes>) -> some View {
        let now = Date.now
        if let deadline = context.state.restDeadline, !context.isStale, deadline > now {
            Text(timerInterval: now...deadline, countsDown: true)
                .multilineTextAlignment(.trailing)
        } else {
            Text(status(context))
        }
    }
}
