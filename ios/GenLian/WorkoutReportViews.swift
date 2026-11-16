import Foundation
import SwiftUI
import TrainingCore

struct WorkoutSummaryView: View {
    let session: WorkoutSession
    let archive: @MainActor () -> Void
    let close: @MainActor () -> Void
    @Environment(\.timeZone) private var timeZone

    var body: some View {
        WorkoutRecordContent(report: WorkoutReport(session: session), dates: RecordDates(session, fallback: timeZone), isSummary: true)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                VStack(spacing: 4) {
                    WarmPrimaryButton(title: "收入个人训练档案", icon: "checkmark", action: archive)
                        .accessibilityIdentifier(AccessibilityID.Record.archive)
                        .padding(6)
                        .warmGlass(.elevated, in: Capsule())
                    Button("稍后处理") { close() }
                        .font(.subheadline)
                        .foregroundStyle(Warm.secondary)
                        .frame(minWidth: 44, minHeight: 44)
                }
                .padding(.horizontal, Warm.stageEdge)
                .padding(.vertical, 6)
            }
    }
}

struct WorkoutHistoryDetailView: View {
    let session: WorkoutSession
    let close: @MainActor () -> Void
    @Environment(\.timeZone) private var timeZone

    var body: some View {
        WorkoutRecordContent(
            report: WorkoutReport(session: session), dates: RecordDates(session, fallback: timeZone), close: close
        )
    }
}

struct RecordDates {
    let session: WorkoutSession
    let zone: TimeZone
    let day: TrainingDay

    init(_ session: WorkoutSession, fallback: TimeZone) {
        self.session = session
        zone = session.historyTimeZone(fallback: fallback)
        day = session.trainingDay(fallback: fallback)
    }

    var dayLabel: String {
        let weekdays = ["日", "一", "二", "三", "四", "五", "六"]
        return "\(day.year)年\(day.month)月\(day.day)日 · 周\(weekdays[day.weekday - 1])"
    }
    var startClock: String { stamp(session.startedAt) }

    var interval: String {
        guard let end = session.endedAt else { return startClock }
        if zone.secondsFromGMT(for: session.startedAt) != zone.secondsFromGMT(for: end) {
            return "\(stamp(session.startedAt, includeOffset: true)) → \(stamp(end, includeOffset: true))"
        }
        return "\(startClock) → \(stamp(end))"
    }

    func stamp(_ date: Date, includeOffset: Bool = false) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_CN")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = zone
        var pattern = TrainingDay(containing: date, in: zone) == day ? "HH:mm:ss" : "yyyy年M月d日 HH:mm:ss"
        if includeOffset { pattern += " xxx" }
        formatter.dateFormat = pattern
        return formatter.string(from: date)
    }
}

extension WorkoutSession {
    var outcomeLabel: String {
        switch outcome {
        case .completed: "完整完成"
        case .partial: "部分完成"
        case .zeroSets: endReason == .endedByUser ? "0 组退出" : "完成 0 组"
        case nil: "进行中"
        }
    }

    var outcomeColor: Color {
        switch outcome {
        case .completed: Warm.accentText
        case .partial: Warm.warning
        default: Warm.secondary
        }
    }

    var loadSummary: String {
        let loads = recordedLoads
        if loads.count > 2 { return "多种负重 · 见逐组实录" }
        return loads.isEmpty ? "无配重实录" : loads.map(\.display).joined(separator: " · ")
    }
}

struct WarmMetricsBand<Content: View>: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    private let content: Content

    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12))
            : AnyLayout(HStackLayout(alignment: .top, spacing: 12))
        layout { content }
            .padding(.vertical, 15)
            .overlay(alignment: .top) { Rectangle().fill(Warm.divider).frame(height: 1) }
            .overlay(alignment: .bottom) { Rectangle().fill(Warm.divider).frame(height: 1) }
    }
}

struct WarmMetric: View {
    let value: String
    let label: String
    var note: String? = nil
    var highlighted = false
    @ScaledMetric(relativeTo: .title2) private var size: CGFloat = 30

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: size, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(highlighted ? Warm.accentText : Warm.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
            Text(label).font(.caption).foregroundStyle(Warm.secondary)
            if let note { Text(note).font(.caption2).foregroundStyle(Warm.secondary) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

private struct WorkoutRecordContent: View {
    let report: WorkoutReport
    let dates: RecordDates
    var isSummary = false
    var close: (@MainActor () -> Void)? = nil
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .title2) private var titleSize: CGFloat = 26
    private var session: WorkoutSession { report.session }

    var body: some View {
        GeometryReader { viewport in
            ScrollView {
                VStack(spacing: 0) {
                    hero(height: viewport.size.height < 670 ? 245 : 285)
                    VStack(alignment: .leading, spacing: 20) {
                        metrics
                        breakdown
                    }
                    .padding(.horizontal, Warm.pageEdge)
                    .padding(.bottom, 20)
                }
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .background(Warm.canvas.ignoresSafeArea())
        .foregroundStyle(Warm.ink)
    }

    private func hero(height: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if let close {
                HStack {
                    WarmGlassButton(title: "档案", icon: "chevron.left", action: close)
                    Spacer(minLength: 8)
                    Text("本次训练实录")
                        .font(.caption.weight(.semibold))
                        .padding(8)
                        .warmGlass(.light, in: Capsule())
                }
            }
            Spacer(minLength: 34)
            Text(session.outcomeLabel + " · " + session.plan.category.rawValue)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(session.outcomeColor)
            Text(session.plan.title)
                .font(.system(size: titleSize, weight: .semibold))
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier(isSummary ? AccessibilityID.Record.summaryTitle : AccessibilityID.Record.detailTitle)
            if isSummary, let note = summaryNote {
                Text(note).font(.subheadline).foregroundStyle(Warm.secondary)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(dates.dayLabel)
                Text("\(dates.interval) · 暂停 \(Int(session.pausedSeconds)) 秒")
            }
            .font(.caption.monospacedDigit())
            .foregroundStyle(Warm.secondary)
        }
        .padding(.horizontal, Warm.pageEdge)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, minHeight: typeSize.isAccessibilitySize ? height + 32 : height, alignment: .bottomLeading)
        .background {
            WarmPhotoView(photo: WarmMedia.plans[session.plan.id]?.wide)
                .saturation(session.outcome == .zeroSets ? 0 : 1)
                .opacity(session.outcome == .zeroSets ? 0.65 : 1)
                .overlay {
                    LinearGradient(stops: [
                        .init(color: Warm.canvas.opacity(0.78), location: 0),
                        .init(color: .clear, location: 0.34),
                        .init(color: Warm.canvas.opacity(0.90), location: 0.78),
                        .init(color: Warm.canvas, location: 1)
                    ], startPoint: .top, endPoint: .bottom)
                }
                .accessibilityHidden(true)
        }
    }

    private var summaryNote: String? {
        switch session.outcome {
        case .completed: "按计划完成全部轮次"
        case .partial: session.endReason == .endedByUser ? "提前结束，已保留完成组" : "已保留完成组与跳过记录"
        case .zeroSets: "本次未计入有效训练次数"
        case nil: nil
        }
    }

    private var metrics: some View {
        WarmMetricsBand {
            WarmMetric(
                value: "\(report.totals.completedSets)/\(session.plan.plannedSetCount)",
                label: "实录组数",
                note: "完成 \(report.completedExercises)/\(report.plannedExercises) 个动作（按轮）"
            )
            .accessibilityIdentifier(AccessibilityID.Record.groups)
            VStack(alignment: .leading, spacing: 7) {
                if report.usesRepetitions { WarmMetric(value: "\(report.totals.repetitions)", label: "累计次数") }
                if report.usesSeconds {
                    WarmMetric(value: "\(report.totals.holdSeconds)", label: "累计秒数")
                        .accessibilityIdentifier(AccessibilityID.Record.seconds)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            WarmMetric(value: workoutClock(session.elapsedSeconds), label: "有效时长", highlighted: true)
                .accessibilityHint("包括记录的动作、休息与过渡时间")
        }
    }

    private var breakdown: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(isSummary ? "本次训练实录" : "逐组实录明细")
                .font(.headline).accessibilityAddTraits(.isHeader)
            if report.completedRounds.isEmpty {
                Text("本次实际完成 0 组。该记录保留在档案中，有效训练统计不包含本次。")
                    .font(.subheadline)
                    .foregroundStyle(Warm.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Warm.limestone, in: RoundedRectangle(cornerRadius: 12))
            } else {
                roundRows(report.completedRounds)
            }
            if !report.incompleteRounds.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("跳过与未完成").font(.headline).foregroundStyle(Warm.accentText)
                        .accessibilityAddTraits(.isHeader)
                    Text("跳过 \(report.totals.skippedSets) 项 · 未完成 \(report.unfinishedSets) 项")
                        .font(.caption.monospacedDigit()).foregroundStyle(Warm.secondary)
                    roundRows(report.incompleteRounds)
                }
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func roundRows(_ rounds: [WorkoutReport.Round]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(rounds) { round in
                VStack(alignment: .leading, spacing: 0) {
                    Text("第 \(round.number) 轮")
                        .font(.caption.weight(.semibold).monospacedDigit())
                        .foregroundStyle(Warm.slate)
                        .padding(.bottom, 4)
                        .accessibilityAddTraits(.isHeader)
                    ForEach(round.entries) { entry in
                        entryRow(entry)
                        Divider().overlay(Warm.divider)
                    }
                }
            }
        }
    }

    private func entryRow(_ entry: WorkoutReport.Entry) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            let position = entry.key.position
            Text("\(position.exerciseIndex + 1) · \(entry.exercise.name)")
                .font(.subheadline.weight(.semibold))
            Text("第 \(position.set) 组" + sideLabel(entry.key.side))
                .font(.caption)
                .foregroundStyle(Warm.slate)
            switch entry.status {
            case .completed(let entryLog):
                Text("实录 \(entryLog.result.measurement.display) · 目标 \(entry.exercise.target.display)")
                    .font(.subheadline.weight(.semibold).monospacedDigit())
                    .foregroundStyle(Warm.accentText)
                Text(entryLog.result.load.display).font(.caption).foregroundStyle(Warm.secondary)
                if let effort = entryLog.result.effort { Text("主观难度 · \(effortLabel(effort))").font(.caption) }
                if let rest = entryLog.rest {
                    Text("实休 \(Int(rest.actualSeconds)) 秒").font(.caption).foregroundStyle(Warm.secondary)
                }
            case .skipped(let entryLog):
                Text("已跳过 · \(dates.stamp(entryLog.date))").font(.caption).foregroundStyle(Warm.accentText)
            case .unfinished:
                Text("未完成 · 目标 \(entry.exercise.target.display)").font(.caption).foregroundStyle(Warm.secondary)
            }
        }
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier(AccessibilityID.Record.entry(
            entry.key.position.round, entry.key.position.exerciseIndex, entry.key.position.set, entry.key.side.rawValue
        ))
    }

    private func sideLabel(_ side: Side) -> String {
        switch side {
        case .left: " · 左侧"
        case .right: " · 右侧"
        case .bilateral: ""
        }
    }

    private func effortLabel(_ effort: Effort) -> String {
        switch effort {
        case .easy: "轻松"
        case .appropriate: "正好"
        case .hard: "吃力"
        }
    }
}
