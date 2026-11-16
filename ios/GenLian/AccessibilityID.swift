enum AccessibilityID {
    enum Today {
        static let title = "today.title"
        static let scope = "today.scope"
        static let setup = "today.setup"
        static let actionSetup = "today.action-setup"
        static func exercise(_ id: String) -> String { "today.exercise.\(id)" }
        static func course(_ id: String) -> String { "today.course.\(id)" }
    }

    enum Dock {
        static let start = "dock.start"
        static let archive = "dock.archive"
    }

    enum Detail {
        static let title = "detail.title"
        static let back = "detail.back"
    }

    enum Setup {
        static let title = "setup.title"
        static let start = "setup.start"
        static let autoAdvance = "setup.rest.auto-advance"
        static func plates(_ grams: Int) -> String { "setup.plates.\(grams)" }
    }

    enum Player {
        static let prepare = "player.prepare"
        static let next = "player.next"
        static let status = "player.status"
        static let actionTime = "player.action-time"
        static let pause = "player.pause"
        static let pauseStatus = "player.pause-status"
        static let resume = "player.resume"
        static let skip = "player.skip"
        static let complete = "player.complete"
        static let increase = "player.increase"
        static let enterRest = "player.enter-rest"
        static let exit = "player.exit"
        static let end = "player.end"
        static func side(_ id: String) -> String { "player.side.\(id)" }
        static func exercise(_ id: String) -> String { "player.exercise.\(id)" }
    }

    enum Rest {
        static let countdown = "rest.countdown"
        static let timing = "rest.timing"
        static let add = "rest.add"
        static let subtract = "rest.subtract"
        static let finish = "rest.finish"
        static let next = "rest.next"
    }

    enum Record {
        static let summaryTitle = "summary.title"
        static let archive = "summary.archive"
        static let groups = "result.groups"
        static let seconds = "result.seconds"
        static let duration = "result.duration"
        static let scroll = "result.scroll"
        static let historyTitle = "history.title"
        static let empty = "history.empty"
        static let detailTitle = "history.detail.title"
        static let latest = "history.latest"
        static func entry(_ round: Int, _ exerciseIndex: Int, _ set: Int, _ side: String) -> String {
            "result.entry.\(round).\(exerciseIndex).\(set).\(side)"
        }
    }
}
