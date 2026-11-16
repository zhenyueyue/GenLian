import SwiftUI

struct WarmPhoto: Sendable {
    let name: String
    var portrait = true
    var x: CGFloat = 0.5
    var y: CGFloat = 0.5
    var fit = false

    var ratio: CGFloat { portrait ? 768.0 / 1376.0 : 1376.0 / 768.0 }

    func contained() -> Self {
        var copy = self
        copy.fit = true
        return copy
    }
}

enum WarmMedia {
    struct Plan: Sendable {
        let hero: WarmPhoto
        let wide: WarmPhoto
        let kicker: String
        let intent: String
    }

    private static let floorWide = WarmPhoto(name: "WarmFloorWide", portrait: false)
    private static let shoulder = WarmPhoto(name: "WarmShoulder", portrait: false, fit: true)
    private static let recovery = WarmPhoto(name: "WarmRecovery", portrait: false, fit: true)
    private static let deadBug = WarmPhoto(name: "WarmDeadBugStage", y: 0.52)
    private static let deadBugWide = WarmPhoto(name: "WarmDeadBugWide", y: 0.62)

    static let plans: [String: Plan] = [
        "strength-a": Plan(
            hero: WarmPhoto(name: "WarmFloorStage", y: 0.48), wide: floorWide,
            kicker: "力量 A · 全身均衡循环", intent: "晨光下的胸推、划船与深蹲复合循环，保持肌肉张力与稳定呼吸节奏。"
        ),
        "strength-b": Plan(
            hero: WarmPhoto(name: "WarmShoulder", portrait: false, y: 0.38),
            wide: WarmPhoto(name: "WarmShoulder", portrait: false),
            kicker: "力量 B · 肩背与腿后链", intent: "可控配重打磨肩中束与髋铰链动作质量，不抢节奏不耸肩。"
        ),
        "cardio": Plan(
            hero: WarmPhoto(name: "WarmCardioSquat", y: 0.44),
            wide: WarmPhoto(name: "WarmCardioRowWide", portrait: false),
            kicker: "有氧 · 轻负重代谢循环", intent: "短间歇衔接，在鲜明身体动态与清透节奏中抬升心肺动力。"
        ),
        "recovery": Plan(
            hero: WarmPhoto(name: "WarmRecovery", portrait: false, x: 0.46, y: 0.45),
            wide: WarmPhoto(name: "WarmRecovery", portrait: false),
            kicker: "恢复日 · 舒展与呼吸", intent: "温和唤醒胸椎旋转与髋部活动度，为身体留出长久余量。"
        )
    ]

    static func stage(_ id: String) -> WarmPhoto? {
        switch id {
        case "ex-floor-press": WarmPhoto(name: "WarmFloorStage", y: 0.54)
        case "ex-floor-press-cardio": WarmPhoto(name: "WarmCardioFloorStage", y: 0.54)
        case "ex-single-row": WarmPhoto(name: "WarmRowStage", y: 0.46)
        case "ex-row-cardio": WarmPhoto(name: "WarmCardioRowStage", y: 0.48)
        case "ex-goblet-squat": WarmPhoto(name: "WarmSquat", y: 0.46)
        case "ex-goblet-cardio": WarmPhoto(name: "WarmCardioSquat", y: 0.46)
        case "ex-dead-bug", "ex-dead-bug-b", "ex-core-cardio", "ex-dead-bug-rec": deadBug
        case "ex-shoulder-press": shoulder
        case "ex-thoracic": recovery
        default: nil
        }
    }

    static func wide(_ id: String) -> WarmPhoto? {
        switch id {
        case "ex-floor-press", "ex-floor-press-cardio": floorWide
        case "ex-single-row": WarmPhoto(name: "WarmRowWide", portrait: false)
        case "ex-row-cardio": WarmPhoto(name: "WarmCardioRowWide", portrait: false)
        case "ex-dead-bug", "ex-dead-bug-b", "ex-core-cardio", "ex-dead-bug-rec": deadBugWide
        case "ex-goblet-squat", "ex-goblet-cardio": stage(id)?.contained()
        default: stage(id)
        }
    }
}

struct WarmPhotoView: View {
    let photo: WarmPhoto?
    var message: String? = nil

    var body: some View {
        GeometryReader { proxy in
            let size = proxy.size
            ZStack {
                Warm.studio
                if let photo, size.width > 0, size.height > 0 {
                    let height = photo.fit ? min(size.height, size.width / photo.ratio) : max(size.height, size.width / photo.ratio)
                    let width = height * photo.ratio
                    Image(decorative: photo.name)
                        .resizable()
                        .frame(width: width, height: height)
                        .brightness(0.01)
                        .contrast(1.03)
                        .saturation(0.94)
                        .hueRotation(.degrees(-2))
                        .position(
                            x: photo.fit ? size.width / 2 : width / 2 + (size.width - width) * photo.x,
                            y: photo.fit ? size.height / 2 : height / 2 + (size.height - height) * photo.y
                        )
                } else if let message {
                    Label(message, systemImage: "film")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Warm.secondary)
                        .padding(12)
                } else {
                    Image(systemName: "film").foregroundStyle(Warm.secondary)
                }
            }
            .frame(width: size.width, height: size.height)
            .clipped()
        }
    }
}
