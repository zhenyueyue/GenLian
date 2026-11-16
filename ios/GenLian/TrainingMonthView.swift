import SwiftUI
import TrainingCore

struct TrainingMonthView: View {
    let month: TrainingMonth
    let history: TrainingHistory
    let selectedDay: TrainingDay?
    let changeMonth: @MainActor (Int) -> Void
    let selectDay: @MainActor (TrainingDay, TrainingDayRecords) -> Void
    @Environment(\.colorSchemeContrast) private var contrast

    private let weekdays = ["一", "二", "三", "四", "五", "六", "日"]
    private let columns = Array(repeating: GridItem(.flexible(minimum: 34), spacing: 1), count: 7)

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 6) {
                WarmGlassButton(title: "上个月", icon: "chevron.left", iconOnly: true) { changeMonth(-1) }
                Text("\(month.year) 年 \(month.month) 月")
                    .font(.headline.monospacedDigit())
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .accessibilityAddTraits(.isHeader)
                WarmGlassButton(title: "下个月", icon: "chevron.right", iconOnly: true) { changeMonth(1) }
            }
            HStack(spacing: 10) {
                Text("完整").foregroundStyle(Warm.accentText)
                Text("部分").foregroundStyle(Warm.warning)
                Text("0 组").foregroundStyle(Warm.secondary)
            }
            .font(.caption.weight(.medium))
            .padding(.horizontal, 4)
            LazyVGrid(columns: columns, spacing: 2) {
                ForEach(weekdays, id: \.self) { day in
                    Text(day).font(.caption).foregroundStyle(Warm.secondary).accessibilityHidden(true)
                }
                ForEach(0..<month.mondayFirstOffset, id: \.self) { _ in
                    Color.clear.frame(height: 44).accessibilityHidden(true)
                }
                ForEach(month.days) { day in
                    dayCell(day, records: history.records(on: day))
                }
            }
        }
        .padding(8)
        .warmGlass(.elevated, in: RoundedRectangle(cornerRadius: 16))
    }

    private func dayCell(_ day: TrainingDay, records: TrainingDayRecords) -> some View {
        let selected = day == selectedDay
        let accessibleDay = "\(day.month)月\(day.day)日"
        return Button {
            selectDay(day, records)
        } label: {
            VStack(spacing: 0) {
                Text("\(day.day)")
                    .font(.subheadline.weight(records.primaryOutcome == nil ? .regular : .semibold).monospacedDigit())
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                if records.records.count > 1 {
                    Text("\(records.records.count)次")
                        .font(.caption2.monospacedDigit())
                        .minimumScaleFactor(0.55)
                        .lineLimit(1)
                }
            }
            .foregroundStyle(foreground(records.primaryOutcome))
            .frame(maxWidth: .infinity, minHeight: 44)
            .background(background(records.primaryOutcome), in: RoundedRectangle(cornerRadius: 9))
            .overlay {
                RoundedRectangle(cornerRadius: 9)
                    .strokeBorder(selected ? Warm.ink : border(records.primaryOutcome), lineWidth: selected ? 2 : 1)
                    .allowsHitTesting(false)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(records.records.isEmpty)
        .accessibilityLabel(accessibleDay)
        .accessibilityValue(records.records.isEmpty ? "无记录" : "完整 \(records.completed) 次，部分 \(records.partial) 次，0 组 \(records.zero) 次")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func background(_ outcome: WorkoutOutcome?) -> Color {
        switch outcome {
        case .completed: contrast == .increased ? Warm.accentText : Warm.accent
        case .partial: Warm.accentSoft
        case .zeroSets: Warm.elevatedStone
        case nil: .clear
        }
    }

    private func foreground(_ outcome: WorkoutOutcome?) -> Color {
        switch outcome {
        case .completed: .white
        case .partial: Warm.accentText
        default: Warm.secondary
        }
    }

    private func border(_ outcome: WorkoutOutcome?) -> Color { outcome == .partial ? Warm.warning : .clear }
}
