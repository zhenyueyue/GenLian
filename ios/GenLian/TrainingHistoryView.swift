import Foundation
import SwiftUI
import TrainingCore

struct TrainingHistoryView: View {
    let archive: TrainingArchive
    let justArchivedID: UUID?
    @Binding var selectedID: UUID?
    @Environment(\.timeZone) private var timeZone
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.warmReduceTransparency) private var reduceTransparency
    @State private var mode: HistoryMode = .records
    @State private var filter: HistoryFilter = .all
    @State private var monthOverride: TrainingMonth?
    @State private var selectedDay: TrainingDay?
    @State private var scrolled = false

    private enum HistoryMode: String, CaseIterable, Hashable, Identifiable {
        case records = "记录"
        case calendar = "月历"
        var id: Self { self }
    }

    private var month: TrainingMonth {
        monthOverride ?? TrainingMonth(containing: TrainingDay(containing: .now, in: timeZone))
    }

    var body: some View {
        let history = TrainingHistory(archive: archive, filter: filter, legacyTimeZone: timeZone)
        let selected = history.records.first { $0.id == selectedID }
        ZStack {
            index(history)
                .accessibilityHidden(selected != nil)
                .allowsHitTesting(selected == nil)
            if let session = selected {
                WorkoutHistoryDetailView(session: session) { navigate { self.selectedID = nil } }
                    .transition(.opacity)
                    .zIndex(1)
            }
        }
        .foregroundStyle(Warm.ink)
        .background(Warm.canvas)
    }

    private func index(_ history: TrainingHistory) -> some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 12) {
                statistics(history.statistics)
                if mode == .records {
                    recordList(history)
                } else {
                    calendar(history)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Warm.pageEdge)
            .padding(.vertical, 14)
        }
        .onScrollGeometryChange(for: Bool.self) {
            $0.contentOffset.y + $0.contentInsets.top > 8
        } action: { _, value in
            scrolled = value
        }
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .background {
            ZStack(alignment: .top) {
                Warm.canvas
                if !reduceTransparency {
                    RadialGradient(colors: [Warm.accent.opacity(0.07), Warm.canvas], center: .top, startRadius: 12, endRadius: 320)
                    if let first = history.records.first, let cover = WarmMedia.plans[first.plan.id]?.wide {
                        WarmPhotoView(photo: cover)
                            .frame(height: 210)
                            .blur(radius: 24)
                            .opacity(0.08)
                            .clipped()
                    }
                }
            }
            .ignoresSafeArea()
            .accessibilityHidden(true)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 5) {
            if typeSize.isAccessibilitySize {
                title
                modePicker
            } else {
                HStack(alignment: .center) {
                    title
                    Spacer(minLength: 8)
                    modePicker.fixedSize(horizontal: true, vertical: false)
                }
            }
            HistorySegmentedControl(
                options: HistoryFilter.allCases, selection: filter,
                contained: false, columns: typeSize.isAccessibilitySize ? 2 : 4
            ) { value in
                filter = value
                selectedDay = nil
            }
        }
        .padding(.horizontal, Warm.pageEdge)
        .padding(.vertical, 4)
        .background {
            if scrolled {
                Color.clear
                    .warmGlass(.elevated, in: Rectangle())
                    .ignoresSafeArea(edges: .top)
            } else {
                Warm.canvas.opacity(reduceTransparency ? 1 : 0.76).ignoresSafeArea(edges: .top)
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: scrolled)
    }

    private var title: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("个人训练志").font(.caption.weight(.semibold)).foregroundStyle(Warm.accentText)
            Text("训练档案").font(.title2.weight(.semibold)).accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier(AccessibilityID.Record.historyTitle)
        }
    }

    private var modePicker: some View {
        HistorySegmentedControl(options: HistoryMode.allCases, selection: mode, contained: true, columns: 2) {
            mode = $0
        }
    }

    private func statistics(_ stats: HistoryStatistics) -> some View {
        let minutes = Int(stats.elapsedSeconds / 60)
        let time = stats.elapsedSeconds > 0 && minutes == 0 ? "<1" : "\(minutes)"
        return WarmMetricsBand {
            WarmMetric(value: "\(stats.effectiveSessions)", label: "有效训练", note: "完整完成 \(stats.completedSessions) 次")
            WarmMetric(value: time, label: "累计时长 · 分钟")
            WarmMetric(value: "\(stats.loggedSets)", label: "实录容量 · 组", highlighted: true)
        }
    }

    @ViewBuilder
    private func recordList(_ history: TrainingHistory) -> some View {
        if history.records.isEmpty {
            emptyState(filter == .all ? "暂无训练记录" : "当前分类暂无训练记录")
        } else if filter == .all, let first = history.records.first {
            featured(first)
            ForEach(history.records.dropFirst()) { session in recordRow(session) }
        } else {
            ForEach(history.records) { session in recordRow(session) }
        }
    }

    private func calendar(_ history: TrainingHistory) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            TrainingMonthView(month: month, history: history, selectedDay: selectedDay) { delta in
                navigate {
                    monthOverride = month.addingMonths(delta)
                    selectedDay = nil
                }
            } selectDay: { day, group in
                if let first = group.records.first {
                    navigate {
                        selectedDay = day
                        if group.records.count == 1 { selectedID = first.id }
                    }
                }
            }
            if let selectedDay {
                Text("\(selectedDay.month)月\(selectedDay.day)日的训练")
                    .font(.headline).accessibilityAddTraits(.isHeader)
                ForEach(history.records(on: selectedDay).records) { session in recordRow(session) }
            } else if !month.days.contains(where: { history.records(on: $0).primaryOutcome != nil }) {
                emptyState("本月暂无训练记录")
            }
        }
    }

    private func emptyState(_ title: String) -> some View {
        Label(title, systemImage: "square.stack.3d.up")
            .font(.subheadline.weight(.medium))
            .foregroundStyle(Warm.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(Warm.limestone, in: RoundedRectangle(cornerRadius: 16))
    }

    private func featured(_ session: WorkoutSession) -> some View {
        let dates = RecordDates(session, fallback: timeZone)
        let highlighted = justArchivedID == session.id
        return VStack(alignment: .leading, spacing: 7) {
            if highlighted {
                Text("刚刚收入档案 · 点击核对逐组明细")
                    .font(.caption.weight(.semibold)).foregroundStyle(Warm.accentText)
            }
            Button { navigate { selectedID = session.id } } label: {
                ZStack(alignment: .bottomLeading) {
                    Color.clear.aspectRatio(16.0 / 10, contentMode: .fit).accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(dates.dayLabel + " · " + dates.startClock).font(.caption.monospacedDigit())
                        Text(session.plan.category.rawValue + " · " + session.outcomeLabel)
                            .font(.subheadline.weight(.semibold))
                        Text(session.plan.title).font(.title3.weight(.semibold))
                        Text("\(workoutClock(session.elapsedSeconds)) · \(session.totals.completedSets)/\(session.plan.plannedSetCount) 组 · \(session.loadSummary)")
                            .font(.caption.monospacedDigit())
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(13)
                }
                .foregroundStyle(.white)
                .background {
                    WarmPhotoView(photo: WarmMedia.plans[session.plan.id]?.wide)
                        .saturation(session.outcome == .zeroSets ? 0 : 1)
                        .overlay {
                            LinearGradient(stops: [.init(color: .clear, location: 0.10),
                                                   .init(color: Warm.ink.opacity(0.90), location: 0.85)],
                                           startPoint: .top, endPoint: .bottom)
                        }
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay {
                    if highlighted {
                        RoundedRectangle(cornerRadius: 16).strokeBorder(Warm.accent, lineWidth: 2)
                    }
                }
                .contentShape(RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier(AccessibilityID.Record.latest)
        }
    }

    private func recordRow(_ session: WorkoutSession) -> some View {
        let dates = RecordDates(session, fallback: timeZone)
        return Button { navigate { selectedID = session.id } } label: {
            HStack(alignment: .center, spacing: 10) {
                if !typeSize.isAccessibilitySize {
                    WarmPhotoView(photo: WarmMedia.plans[session.plan.id]?.wide)
                        .saturation(session.outcome == .zeroSets ? 0 : 1)
                        .frame(width: 88, height: 66)
                        .overlay(alignment: .bottomTrailing) {
                            Text(workoutClock(session.elapsedSeconds))
                                .font(.caption2.monospacedDigit())
                                .foregroundStyle(.white)
                                .padding(4)
                                .background(Warm.ink.opacity(0.80), in: RoundedRectangle(cornerRadius: 5))
                                .padding(4)
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(dates.dayLabel + " · " + dates.startClock)
                        .font(.caption2.monospacedDigit()).foregroundStyle(Warm.secondary)
                    Text(session.plan.category.rawValue + " · " + session.outcomeLabel)
                        .font(.caption.weight(.semibold)).foregroundStyle(session.outcomeColor)
                    Text(session.plan.title).font(.subheadline.weight(.semibold)).foregroundStyle(Warm.ink)
                    Text("\(session.totals.completedSets)/\(session.plan.plannedSetCount) 组 · \(session.loadSummary)")
                        .font(.caption.monospacedDigit()).foregroundStyle(Warm.slate)
                    if typeSize.isAccessibilitySize {
                        Text(workoutClock(session.elapsedSeconds)).font(.caption.monospacedDigit()).foregroundStyle(Warm.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right").font(.caption).foregroundStyle(Warm.secondary)
                    .accessibilityHidden(true)
            }
            .padding(8)
            .frame(minHeight: 44)
            .contentShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .warmGlass(.light, in: RoundedRectangle(cornerRadius: 16), interactive: true)
    }

    private func navigate(_ action: () -> Void) {
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.22), action)
    }
}

private struct HistorySegmentedControl<Option: Identifiable & RawRepresentable & Equatable>: View where Option.RawValue == String {
    let options: [Option]
    let selection: Option
    let contained: Bool
    let columns: Int
    let select: @MainActor (Option) -> Void
    @Namespace private var highlight
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        if contained {
            HStack(spacing: 2) {
                ForEach(options) { option in segment(option) }
            }
            .padding(2)
            .warmGlass(.light, in: Capsule())
            .animation(reduceMotion ? nil : .spring(response: 0.34, dampingFraction: 0.8), value: selection)
        } else {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: columns), spacing: 4) {
                ForEach(options) { option in segment(option) }
            }
            .animation(reduceMotion ? nil : .spring(response: 0.34, dampingFraction: 0.8), value: selection)
        }
    }

    private func segment(_ option: Option) -> some View {
        let selected = option == selection
        return Button { select(option) } label: {
            Text(option.rawValue)
                .font(.subheadline.weight(selected ? .semibold : .medium))
                .foregroundStyle(selected ? Warm.accentText : Warm.secondary)
                .padding(.horizontal, 6)
                .frame(minWidth: 44, maxWidth: contained ? nil : .infinity, minHeight: 44)
                .background {
                    if selected {
                        if reduceMotion {
                            Capsule().fill(Warm.limestone)
                        } else {
                            Capsule().fill(Warm.limestone)
                                .matchedGeometryEffect(id: "history-selection", in: highlight)
                        }
                    }
                }
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
