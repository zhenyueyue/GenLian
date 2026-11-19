import Foundation
import SwiftUI
import TrainingCore

@main
struct GenLianApp: App {
    @State private var model = TrainingAppModel()

    var body: some Scene {
        WindowGroup {
            content.tint(Warm.accent)
        }
    }

    @ViewBuilder
    private var content: some View {
        #if DEBUG
        if UITestLaunch.accessibilityPreview {
            TrainingShell(model: model).dynamicTypeSize(.accessibility5)
        } else {
            TrainingShell(model: model)
        }
        #else
        TrainingShell(model: model)
        #endif
    }
}

private struct TrainingShell: View {
    let model: TrainingAppModel
    @Environment(\.scenePhase) private var scenePhase
    @State private var detailIndex: Int?
    @State private var showingWorkout = false
    @State private var homeTab: HomeTab = .today
    @State private var focusedHistoryID: UUID?
    @State private var justArchivedID: UUID?
    @State private var setupPlan: WorkoutPlan?

    private enum HomeTab: Hashable {
        case today, start, archive
    }

    private var startTitle: String {
        guard let current = model.archive.current else { return "开始今日训练" }
        return current.phase == .summary ? "查看本次训练结果" : "返回本次训练"
    }

    private var canStart: Bool {
        guard model.available else { return false }
        if model.archive.current != nil { return true }
        return model.plan.map { !model.isPostponed($0) } ?? false
    }

    private var stageIsDimmed: Bool {
        guard showingWorkout, let session = model.archive.current,
              !session.isPaused, !session.needsResume else { return false }
        return session.phase != .active && session.phase != .summary
    }

    var body: some View {
        Group {
            if showingWorkout, let session = model.archive.current {
                if session.phase == .summary {
                    WorkoutSummaryView(session: session) {
                        guard model.archiveFinished(session.id) else { return }
                        switchPage {
                            justArchivedID = session.id
                            focusedHistoryID = nil
                            homeTab = .archive
                            showingWorkout = false
                        }
                    } close: {
                        switchPage { showingWorkout = false }
                    }
                } else {
                    WorkoutPlayerView(model: model, session: session) {
                        switchPage { showingWorkout = false }
                    }
                }
            } else if let plan = model.plan {
                home(plan)
            } else {
                VStack(spacing: 16) {
                    Text("跟练").font(.largeTitle.weight(.semibold))
                    WarmGlassButton(title: "重新载入课程", action: model.open)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .safeAreaInset(edge: .top, spacing: 0) { TrainingErrorBar(model: model) }
        .background(Warm.canvas.ignoresSafeArea())
        .foregroundStyle(Warm.ink)
        .preferredColorScheme(stageIsDimmed ? .dark : .light)
        .sheet(item: $setupPlan) { plan in
            TrainingSetupView(model: model, plan: plan) {
                setupPlan = nil
            } start: { setup in
                if model.start(plan, setup: setup) {
                    setupPlan = nil
                    showPlayer()
                }
            } postpone: { setup in
                model.postpone(plan, setup: setup)
                setupPlan = nil
            }
        }
        .onChange(of: scenePhase, initial: true) { _, value in
            model.setScenePhase(value)
        }
        .task(id: scenePhase) {
            model.open()
            guard scenePhase == .active else { return }
            while !Task.isCancelled {
                do { try await Task.sleep(for: .milliseconds(200)) }
                catch { return }
                model.tick()
            }
        }
        .onChange(of: model.archive.current?.id) { _, newValue in
            if newValue == nil { showingWorkout = false }
        }
    }

    private func home(_ plan: WorkoutPlan) -> some View {
        ZStack {
            homeTabs(plan)
                .accessibilityHidden(detailIndex != nil)
                .allowsHitTesting(detailIndex == nil)

            if let detailIndex, plan.exercises.indices.contains(detailIndex) {
                WorkoutDetailView(
                    plan: plan, load: model.setup(for: plan).load, index: detailIndex,
                    changeIndex: { index in switchPage { self.detailIndex = index } },
                    close: { switchPage { self.detailIndex = nil } },
                    startTitle: model.archive.current == nil ? "进入全屏跟练" : startTitle,
                    canStart: canStart, start: openOrStart
                )
                .zIndex(1)
            }
        }
    }

    private func homeTabs(_ plan: WorkoutPlan) -> some View {
        TabView(selection: tabSelection) {
            Tab("今日", systemImage: "safari", value: .today) {
                TodayView(
                    model: model, plan: plan, startTitle: startTitle, start: openOrStart,
                    showSetup: { setupPlan = plan },
                    showDetail: { index in switchPage { detailIndex = index } }
                )
                .modifier(HomeTabAppearance())
            }
            .accessibilityIdentifier(AccessibilityID.Dock.today)

            Tab("开练", systemImage: "play", value: .start) {
                Color.clear.accessibilityHidden(true)
            }
            .disabled(!canStart)
            .accessibilityIdentifier(AccessibilityID.Dock.start)

            Tab("档案", systemImage: "square.stack.3d.up", value: .archive) {
                TrainingHistoryView(archive: model.archive, justArchivedID: justArchivedID, selectedID: $focusedHistoryID)
                    .modifier(HomeTabAppearance())
            }
            .accessibilityIdentifier(AccessibilityID.Dock.archive)
        }
        .tint(.white)
    }

    private var tabSelection: Binding<HomeTab> {
        Binding(get: { homeTab }, set: { tab in
            if tab == .start {
                // Opening the full-screen player leaves the current navigation tab selected.
                openOrStart()
            } else {
                switchPage {
                    if tab == .archive { focusedHistoryID = nil }
                    homeTab = tab
                }
            }
        })
    }

    private func openOrStart() {
        guard canStart else { return }
        if model.archive.current == nil {
            guard let plan = model.plan, model.start(plan) else { return }
        }
        showPlayer()
    }

    private func showPlayer() {
        switchPage {
            detailIndex = nil
            showingWorkout = true
        }
    }

    private func switchPage(_ update: () -> Void) {
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction, update)
    }
}

private struct HomeTabAppearance: ViewModifier {
    func body(content: Content) -> some View {
        content
            .tint(Warm.accent)
            .toolbarColorScheme(.dark, for: .tabBar)
            .toolbarBackgroundVisibility(.visible, for: .tabBar)
    }
}

struct TrainingErrorBar: View {
    let model: TrainingAppModel

    var body: some View {
        if let message = model.errorMessage {
            VStack(alignment: .leading, spacing: 5) {
                Text(message).font(.caption).foregroundStyle(Warm.accentText)
                Button(model.available ? "关闭提示" : "重试") {
                    if model.available { model.acknowledgeError() }
                    else { model.open() }
                }
                .font(.subheadline.weight(.semibold))
                .frame(minWidth: 44, minHeight: 44)
            }
            .padding(.horizontal, Warm.stageEdge)
            .padding(.vertical, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Warm.limestone)
        }
    }
}
