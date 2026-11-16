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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.warmReduceTransparency) private var reduceTransparency
    @Namespace private var mediaAnimation
    @State private var detailIndex: Int?
    @State private var showingWorkout = false
    @State private var showingArchive = false
    @State private var focusedHistoryID: UUID?
    @State private var justArchivedID: UUID?
    @State private var setupPlan: WorkoutPlan?

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
                        route {
                            justArchivedID = session.id
                            focusedHistoryID = nil
                            showingArchive = true
                            showingWorkout = false
                        }
                    } close: {
                        route { showingWorkout = false }
                    }
                } else {
                    WorkoutPlayerView(model: model, session: session, mediaAnimation: mediaAnimation) {
                        route { showingWorkout = false }
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
            model.setSceneActive(value == .active)
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
            Group {
                if reduceTransparency {
                    VStack(spacing: 0) {
                        homePage(plan).clipped()
                        homeDock
                    }
                } else {
                    homePage(plan).safeAreaInset(edge: .bottom, spacing: 0) {
                        homeDock
                    }
                }
            }
            .accessibilityHidden(detailIndex != nil)
            .allowsHitTesting(detailIndex == nil)

            if let detailIndex, plan.exercises.indices.contains(detailIndex) {
                WorkoutDetailView(
                    plan: plan, load: model.setup(for: plan).load, index: detailIndex, mediaAnimation: mediaAnimation,
                    changeIndex: { index in route { self.detailIndex = index } },
                    close: { route { self.detailIndex = nil } },
                    startTitle: model.archive.current == nil ? "进入全屏跟练" : startTitle,
                    canStart: canStart, start: openOrStart
                )
                .transition(.opacity)
                .zIndex(1)
            }
        }
    }

    @ViewBuilder
    private func homePage(_ plan: WorkoutPlan) -> some View {
        if showingArchive {
            TrainingHistoryView(archive: model.archive, justArchivedID: justArchivedID, selectedID: $focusedHistoryID)
        } else {
            TodayView(
                model: model, plan: plan, startTitle: startTitle, start: openOrStart,
                showSetup: { setupPlan = plan },
                showDetail: { index in route { detailIndex = index } }
            )
        }
    }

    private var homeDock: some View {
        WarmDock(
            showingArchive: showingArchive, canStart: canStart,
            openToday: { route { showingArchive = false } }, start: openOrStart,
            openArchive: {
                route {
                    focusedHistoryID = nil
                    showingArchive = true
                }
            }
        )
        .padding(.horizontal, Warm.pageEdge)
        .padding(.vertical, 7)
    }

    private func openOrStart() {
        guard canStart else { return }
        if model.archive.current == nil {
            guard let plan = model.plan, model.start(plan) else { return }
        }
        showPlayer()
    }

    private func showPlayer() {
        route {
            detailIndex = nil
            showingWorkout = true
        }
    }

    private func route(_ update: () -> Void) {
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.28), update)
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
