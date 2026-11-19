import Foundation
import SwiftUI
import TrainingCore

enum Warm {
    static let canvas = Color("WarmCanvas")
    static let accent = Color("AccentColor")
    static let ink = Color("WarmInk")
    static let limestone = color(0xF1EFE8)
    static let studio = color(0xEAE5DC)
    static let secondary = color(0x4D545E)
    static let slate = color(0x415A72)
    static let accentText = color(0xB83E18)
    static let warning = color(0xB86214)
    static let accentSoft = accent.opacity(0.10)
    static let elevatedStone = color(0xE6E2D8)
    static let restAccent = color(0xFF9E7D)
    static let smoke = color(0x22272E)
    static let divider = ink.opacity(0.085)
    static let pageEdge: CGFloat = 20
    static let stageEdge: CGFloat = 16

    private static func color(_ hex: UInt32) -> Color {
        Color(
            red: Double((hex >> 16) & 255) / 255,
            green: Double((hex >> 8) & 255) / 255,
            blue: Double(hex & 255) / 255
        )
    }
}

enum WarmGlassTone {
    case light, elevated, dim

    var foreground: Color { self == .dim ? Warm.canvas : Warm.ink }
    var tint: Color {
        switch self {
        case .light: Warm.canvas.opacity(0.28)
        case .elevated: Warm.canvas.opacity(0.66)
        case .dim: Warm.smoke.opacity(0.78)
        }
    }
    var solid: Color { self == .dim ? Warm.smoke : Warm.canvas }
}

extension EnvironmentValues {
    var warmReduceTransparency: Bool {
        #if DEBUG
        if UITestLaunch.accessibilityPreview { return true }
        #endif
        return accessibilityReduceTransparency
    }
}

private struct WarmGlassSurface<Outline: Shape>: ViewModifier {
    @Environment(\.warmReduceTransparency) private var reduceTransparency
    let tone: WarmGlassTone
    let shape: Outline
    let interactive: Bool

    func body(content: Content) -> some View {
        if reduceTransparency {
            content
                .background(tone.solid, in: shape)
                .overlay { shape.stroke(tone.foreground.opacity(0.22), lineWidth: 1).allowsHitTesting(false) }
        } else {
            content.glassEffect(.regular.tint(tone.tint).interactive(interactive), in: shape)
        }
    }
}

extension View {
    func warmGlass<Outline: Shape>(
        _ tone: WarmGlassTone = .light, in shape: Outline, interactive: Bool = false
    ) -> some View {
        modifier(WarmGlassSurface(tone: tone, shape: shape, interactive: interactive))
    }
}

struct WarmGlassButton: View {
    let title: String
    var icon: String? = nil
    var tone: WarmGlassTone = .light
    var iconOnly = false
    var fillsWidth = false
    let action: @MainActor () -> Void
    @Environment(\.isEnabled) private var enabled

    var body: some View {
        Button { action() } label: {
            Group {
                if let icon {
                    if iconOnly { Image(systemName: icon) }
                    else { Label(title, systemImage: icon) }
                } else {
                    Text(title)
                }
            }
            .font(.subheadline.weight(.semibold))
            .multilineTextAlignment(.center)
            .foregroundStyle(tone.foreground)
            .padding(.horizontal, iconOnly ? 0 : 12)
            .padding(.vertical, 5)
            .frame(minWidth: 44, maxWidth: fillsWidth ? .infinity : nil, minHeight: fillsWidth ? 52 : 44)
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .warmGlass(tone, in: Capsule(), interactive: enabled)
        .opacity(enabled ? 1 : 0.45)
        .accessibilityLabel(Text(title))
    }
}

struct WarmPrimaryButton: View {
    let title: String
    var icon: String? = nil
    var graphite = false
    var compact = false
    let action: @MainActor () -> Void
    @Environment(\.isEnabled) private var enabled
    @Environment(\.colorSchemeContrast) private var contrast

    var body: some View {
        Button { action() } label: {
            Group {
                if let icon { Label(title, systemImage: icon) }
                else { Text(title) }
            }
            .font((compact ? Font.subheadline : .headline).weight(.bold))
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 9)
            .frame(maxWidth: compact ? nil : .infinity, minHeight: compact ? 44 : 54)
            .background(background, in: Capsule())
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .opacity(enabled ? 1 : 0.45)
    }

    private var background: Color {
        if graphite { return Warm.ink }
        return contrast == .increased ? Warm.accentText : Warm.accent
    }
}

struct WarmSheetHeader: View {
    let title: String
    let close: @MainActor () -> Void
    var titleID: String? = nil

    var body: some View {
        HStack {
            if let titleID {
                heading.accessibilityIdentifier(titleID)
            } else {
                heading
            }
            Spacer()
            WarmGlassButton(title: "关闭", icon: "xmark", iconOnly: true, action: close)
        }
    }

    private var heading: some View {
        Text(title).font(.title3.weight(.semibold)).accessibilityAddTraits(.isHeader)
    }
}

struct WarmSheetBackground: ViewModifier {
    @Environment(\.warmReduceTransparency) private var reduceTransparency

    func body(content: Content) -> some View {
        content
            .presentationDragIndicator(.visible)
            .presentationCornerRadius(24)
            .presentationBackground {
                if reduceTransparency {
                    Warm.canvas
                } else {
                    Rectangle().fill(.regularMaterial).overlay(Warm.canvas.opacity(0.78))
                }
            }
            .foregroundStyle(Warm.ink)
            .preferredColorScheme(.light)
    }
}

extension SetMeasurement {
    var unitText: String { unit == .seconds ? "秒" : "次" }
    var display: String { "\(value) \(unitText)" }

    func withValue(_ value: Int) -> Self {
        unit == .seconds ? .seconds(value) : .repetitions(value)
    }
}

extension RecordedLoad {
    var display: String {
        switch self {
        case .unspecified: "配重未设置"
        case .bodyweight: "徒手自重"
        case .platesPerDumbbell(let grams):
            grams == 0 ? "仅空杆 · 总重未知" : "片重 \(Self.kilograms(grams)) kg/只"
        case .measuredPerDumbbell(let grams):
            "实测 \(Self.kilograms(grams)) kg/只"
        }
    }

    static func kilograms(_ grams: Int) -> String {
        (Double(grams) / 1_000).formatted(.number.precision(.fractionLength(0...3)))
    }
}

func workoutClock(_ time: TimeInterval, roundsUp: Bool = false) -> String {
    let seconds = max(0, Int(time.rounded(roundsUp ? .up : .down)))
    return String(format: "%02d:%02d", seconds / 60, seconds % 60)
}
