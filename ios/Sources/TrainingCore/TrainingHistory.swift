import Foundation

public extension WorkoutSession {
    func historyTimeZone(fallback: TimeZone = .current) -> TimeZone {
        timeZoneIdentifier.flatMap(TimeZone.init(identifier:)) ?? fallback
    }

    func trainingDay(fallback: TimeZone = .current) -> TrainingDay {
        TrainingDay(containing: startedAt, in: historyTimeZone(fallback: fallback))
    }
}

public struct TrainingDay: Identifiable, Hashable, Sendable {
    public let year: Int
    public let month: Int
    public let day: Int
    public var id: Self { self }

    public init(containing instant: Date, in timeZone: TimeZone) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let components = calendar.dateComponents([.year, .month, .day], from: instant)
        self.init(year: components.year ?? 1970, month: components.month ?? 1, day: components.day ?? 1)
    }

    fileprivate init(year: Int, month: Int, day: Int) {
        self.year = year
        self.month = month
        self.day = day
    }

    // Sunday is 1, matching Foundation's weekday component.
    public var weekday: Int {
        guard let date = neutralDate else { return 1 }
        return Self.neutralCalendar.component(.weekday, from: date)
    }

    // Calendar grid geometry uses absolute civil dates independently of DST.
    fileprivate static var neutralCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .gmt
        return calendar
    }

    fileprivate var neutralDate: Date? {
        Self.neutralCalendar.date(from: DateComponents(year: year, month: month, day: day))
    }
}

public struct TrainingMonth: Equatable, Sendable {
    public let year: Int
    public let month: Int

    public init(containing day: TrainingDay) {
        year = day.year
        month = day.month
    }

    private var first: TrainingDay { TrainingDay(year: year, month: month, day: 1) }
    public var mondayFirstOffset: Int { (first.weekday + 5) % 7 }

    public var days: [TrainingDay] {
        guard let date = first.neutralDate,
              let days = TrainingDay.neutralCalendar.range(of: .day, in: .month, for: date) else { return [] }
        return days.map { TrainingDay(year: year, month: month, day: $0) }
    }

    public func addingMonths(_ count: Int) -> Self {
        guard let firstDate = first.neutralDate,
              let date = TrainingDay.neutralCalendar.date(byAdding: .month, value: count, to: firstDate) else { return self }
        return Self(containing: TrainingDay(containing: date, in: .gmt))
    }
}

public enum HistoryFilter: String, CaseIterable, Hashable, Identifiable, Sendable {
    case all = "全部"
    case strength = "力量"
    case cardio = "有氧"
    case recovery = "恢复"

    public var id: Self { self }

    func includes(_ category: WorkoutCategory) -> Bool {
        switch self {
        case .all: true
        case .strength: category == .strengthA || category == .strengthB
        case .cardio: category == .cardio
        case .recovery: category == .recovery
        }
    }
}

public struct HistoryStatistics: Equatable, Sendable {
    public let effectiveSessions: Int
    public let completedSessions: Int
    public let elapsedSeconds: TimeInterval
    public let loggedSets: Int
}

public struct TrainingDayRecords: Sendable {
    public let records: [WorkoutSession]
    public let completed: Int
    public let partial: Int
    public let zero: Int

    init(records: [WorkoutSession]) {
        self.records = records
        completed = records.filter { $0.outcome == .completed }.count
        partial = records.filter { $0.outcome == .partial }.count
        zero = records.filter { $0.outcome == .zeroSets }.count
    }

    public var primaryOutcome: WorkoutOutcome? {
        if completed > 0 { return .completed }
        if partial > 0 { return .partial }
        return zero > 0 ? .zeroSets : nil
    }
}

public struct TrainingHistory: Sendable {
    public let records: [WorkoutSession]
    public let statistics: HistoryStatistics
    private let days: [TrainingDay: TrainingDayRecords]

    public init(archive: TrainingArchive, filter: HistoryFilter = .all, legacyTimeZone: TimeZone = .current) {
        let filtered = archive.history.filter { filter.includes($0.plan.category) }
            .sorted { $0.startedAt > $1.startedAt }
        records = filtered
        days = Dictionary(grouping: filtered) { $0.trainingDay(fallback: legacyTimeZone) }.mapValues {
            TrainingDayRecords(records: $0)
        }
        let effective = filtered.filter { !$0.loggedSets.isEmpty && ($0.outcome == .completed || $0.outcome == .partial) }
        statistics = HistoryStatistics(
            effectiveSessions: effective.count,
            completedSessions: effective.filter { $0.outcome == .completed }.count,
            elapsedSeconds: effective.reduce(0) { $0 + $1.elapsedSeconds },
            loggedSets: effective.reduce(0) { $0 + $1.loggedSets.count }
        )
    }

    public func records(on day: TrainingDay) -> TrainingDayRecords {
        days[day] ?? TrainingDayRecords(records: [])
    }
}
