import SwiftUI
import TrainingCoach
import UIKit
import UserNotifications

struct VoiceCoachSettingsView: View {
    let model: TrainingAppModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(spacing: 8) {
            WarmSheetHeader(title: "语音教练", close: { dismiss() }, titleID: "coach.settings.title")
                .padding(.horizontal, Warm.pageEdge)
                .padding(.top, 16)
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Toggle("语音教练", isOn: binding(\.enabled))
                        .accessibilityIdentifier("coach.enabled")
                    Group {
                        Toggle("后台播报", isOn: binding(\.background))
                            .accessibilityIdentifier("coach.background")
                        Text("挂起后由系统发送休息提醒。锁屏、专注模式和通知声音设置会影响提醒。")
                            .font(.footnote).foregroundStyle(Warm.secondary)
                        Toggle("休息结束播报", isOn: binding(\.restEnd))
                        Toggle("动作时间提醒", isOn: binding(\.timeHints))
                        Toggle("动作要点与节奏", isOn: binding(\.technique))
                        Toggle("阶段鼓励", isOn: binding(\.encouragement))
                        Toggle("播报时降低音乐音量", isOn: binding(\.duckMusic))
                        slider("语速", value: \.rate, in: 0.36...0.60)
                        slider("音量", value: \.volume, in: 0.15...1)
                    }
                    .disabled(!model.voiceEnabled)
                    Divider()
                    Text(model.coachNotifications.permissionDescription)
                        .font(.subheadline)
                        .foregroundStyle(Warm.secondary)
                        .accessibilityIdentifier("coach.notification-status")
                    if let preparation = model.coachNotifications.renderStatus {
                        Text(preparation).font(.footnote).foregroundStyle(Warm.secondary)
                    }
                    if let delivery = model.coachNotifications.deliveryDescription {
                        Text(delivery).font(.footnote).foregroundStyle(Warm.secondary)
                    }
                    if model.coachNotifications.authorization == .notDetermined {
                        WarmGlassButton(title: "允许休息通知", icon: "bell") {
                            Task { await model.coachNotifications.requestPermission() }
                        }
                    } else {
                        WarmGlassButton(title: "打开系统通知设置", icon: "gearshape") {
                            if let url = URL(string: UIApplication.openNotificationSettingsURLString) { openURL(url) }
                        }
                    }
                }
                .tint(Warm.accent)
                .padding(Warm.pageEdge)
            }
        }
        .modifier(WarmSheetBackground())
        .task { await model.coachNotifications.refreshPermission() }
    }

    private func binding<Value>(_ key: WritableKeyPath<VoiceCoachPreferences, Value>) -> Binding<Value> {
        Binding {
            model.coachPreferences[keyPath: key]
        } set: { value in
            var settings = model.coachPreferences
            settings[keyPath: key] = value
            model.setCoachPreferences(settings)
        }
    }

    private func slider(_ title: String, value: WritableKeyPath<VoiceCoachPreferences, Double>, in range: ClosedRange<Double>) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.subheadline)
            Slider(value: binding(value), in: range, step: 0.01)
                .accessibilityLabel(title)
        }
    }
}
