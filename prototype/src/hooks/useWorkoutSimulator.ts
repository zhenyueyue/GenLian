import { useCallback, useEffect, useState } from 'react';
import { PLATE_PRESETS, PROTOTYPE_TEST_VIDEO_URLS, WORKOUT_OPTIONS } from '../data/workouts';
import {
  ArmSide,
  EffortLevel,
  LoggedSet,
  PlateSetup,
  RestKind,
  SessionOutcome,
  SkippedRecord,
  WorkoutPhase,
  WorkoutPlan,
} from '../types/design';
import {
  resolveAdvanceAfterRestOrSkip,
  resolveCompleteActiveSet,
  resolveEarlyExitOutcome,
} from './workoutStateMachine';

function formatClockNow(): string {
  try {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false });
  } catch {
    return '00:00:00';
  }
}

function playSubtleTone(freq = 660, durationMs = 95) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, durationMs + 50);
  } catch {
    // Ignore audio context blocks
  }
}

function speakShortCue(text: string) {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 1.05;
      utter.volume = 0.7;
      window.speechSynthesis.speak(utter);
    }
  } catch {
    // Ignore speech synthesis errors
  }
}

export function useWorkoutSimulator(initialPhase: WorkoutPhase = 'today', initialPlanIndex = 0) {
  const safeInitPlanIdx =
    initialPlanIndex >= 0 && initialPlanIndex < WORKOUT_OPTIONS.length ? initialPlanIndex : 0;
  const initPlan = WORKOUT_OPTIONS[safeInitPlanIdx];

  const [phase, setPhase] = useState<WorkoutPhase>(initialPhase);
  const [planIndex, setPlanIndex] = useState(safeInitPlanIdx);
  const [plateIdOverride, setPlateIdOverride] = useState<string | null>(null);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [postponedNote, setPostponedNote] = useState(false);

  // Configurable Rest Preferences
  const [customRestSeconds, setCustomRestSeconds] = useState<number>(initPlan.defaultRestSeconds);
  const [customRoundRestSeconds, setCustomRoundRestSeconds] = useState<number>(
    initPlan.defaultRoundRestSeconds
  );
  const [restAutoAdvance, setRestAutoAdvance] = useState<boolean>(true);

  // Strict Circuit State Machine
  const [currentRound, setCurrentRound] = useState(1);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [currentSide, setCurrentSide] = useState<ArmSide>(
    initPlan.exercises[0]?.isUnilateral ? 'left' : 'both'
  );
  const [currentSetStartedAt, setCurrentSetStartedAt] = useState<string>(formatClockNow());

  // Rest State
  const [restKind, setRestKind] = useState<RestKind>('exercise');
  const [restTriggeredBySet, setRestTriggeredBySet] = useState<boolean>(false);
  const [restRemaining, setRestRemaining] = useState(initPlan.defaultRestSeconds);
  const [restTargetTotal, setRestTargetTotal] = useState(initPlan.defaultRestSeconds);
  const [actualRestElapsed, setActualRestElapsed] = useState(0);
  const [restWaitingManual, setRestWaitingManual] = useState(false);

  // Phase Countdown State
  const [prepareRemaining, setPrepareRemaining] = useState(4);
  const [setCompleteAutoSec, setSetCompleteAutoSec] = useState(4);
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false);
  const [transitionSec, setTransitionSec] = useState(2);

  // Timers & Controls
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Exercise Demo Video Controls (Loop / Mute / Replay / Prototype Test Stream Toggle)
  const [videoMuted, setVideoMuted] = useState(true);
  const [useTestVideoStream, setUseTestVideoStream] = useState(false);
  const [videoReplayToken, setVideoReplayToken] = useState(0);
  const [isDebugPreviewMode, setIsDebugPreviewMode] = useState(false);

  // Real Session Logs & Outcome
  const [repDraft, setRepDraft] = useState(initPlan.exercises[0].targetReps);
  const [effortDraft, setEffortDraft] = useState<EffortLevel>('正好');
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [skippedRecords, setSkippedRecords] = useState<SkippedRecord[]>([]);
  const [sessionOutcome, setSessionOutcome] = useState<SessionOutcome>('in_progress');
  const [sessionStartedAt, setSessionStartedAt] = useState<string>(() =>
    initialPhase !== 'today' ? formatClockNow() : ''
  );
  const [sessionEndedAt, setSessionEndedAt] = useState<string>('');

  const plan: WorkoutPlan = WORKOUT_OPTIONS[planIndex];
  const resolvedPlateId = plateIdOverride ?? plan.defaultPlateId;
  const activePlate: PlateSetup | null =
    resolvedPlateId === null
      ? null
      : PLATE_PRESETS.find((p) => p.id === resolvedPlateId) ?? PLATE_PRESETS[1];

  const currentExercise = plan.exercises[exerciseIdx] ?? plan.exercises[0];
  const totalExercisesInRound = plan.exercises.length;

  const isLastExInRound = exerciseIdx >= totalExercisesInRound - 1;
  const isLastRound = currentRound >= plan.rounds;

  const nextExerciseAfterRest = isLastExInRound
    ? isLastRound
      ? null
      : plan.exercises[0]
    : plan.exercises[exerciseIdx + 1];

  const prevExercisePreview =
    exerciseIdx > 0
      ? plan.exercises[exerciseIdx - 1]
      : currentRound > 1
      ? plan.exercises[totalExercisesInRound - 1]
      : null;

  const getExerciseWeightLabel = useCallback(
    (usesDumbbells: boolean) => {
      if (!usesDumbbells) return '徒手自重';
      return activePlate ? activePlate.shortLabel : '仅空杆（总重未知）';
    },
    [activePlate]
  );

  const syncExerciseDefaults = useCallback(
    (exIdx: number, sideOverride?: ArmSide) => {
      const ex = plan.exercises[exIdx] ?? plan.exercises[0];
      setRepDraft(ex.targetReps);
      setEffortDraft('正好');
      setCurrentSide(sideOverride ?? (ex.isUnilateral ? 'left' : 'both'));
      setCurrentSetStartedAt(formatClockNow());
    },
    [plan.exercises]
  );

  const activeVideoUrl =
    currentExercise.videoUrl ??
    (useTestVideoStream ? PROTOTYPE_TEST_VIDEO_URLS[currentExercise.id] : undefined);

  const replayCurrentVideo = useCallback(() => {
    setVideoReplayToken((t) => t + 1);
  }, []);

  // Strictly advances ONLY after rest finishes/skipped or exercise skipped
  const advanceToNextExerciseOrFinish = useCallback(
    (viaSkip = false) => {
      setRestWaitingManual(false);
      setRestTriggeredBySet(false);

      const resolution = resolveAdvanceAfterRestOrSkip(
        plan,
        { round: currentRound, exerciseIdx, side: currentSide },
        loggedSets.length,
        skippedRecords.length,
        viaSkip
      );

      if (resolution.finished) {
        setSessionEndedAt(formatClockNow());
        setSessionOutcome(resolution.outcome ?? 'completed');
        setPhase('summary');
        return;
      }

      setCurrentRound(resolution.nextCursor.round);
      setExerciseIdx(resolution.nextCursor.exerciseIdx);
      syncExerciseDefaults(resolution.nextCursor.exerciseIdx, resolution.nextCursor.side);
      setTransitionSec(2);
      setPhase('nextTransition');
    },
    [
      plan,
      currentRound,
      exerciseIdx,
      currentSide,
      loggedSets.length,
      skippedRecords.length,
      syncExerciseDefaults,
    ]
  );

  // 1) Pure 1-second clock tick (ZERO side-effect phase switches inside state updaters!)
  useEffect(() => {
    if (phase === 'today' || phase === 'summary') return;

    const interval = window.setInterval(() => {
      if (isPaused) {
        setPausedSeconds((p) => p + 1);
        return;
      }

      if (phase !== 'prepare') {
        setElapsedSeconds((s) => s + 1);
      }

      if (phase === 'prepare') {
        setPrepareRemaining((prev) => Math.max(0, prev - 1));
      } else if (phase === 'setComplete' && !autoAdvancePaused) {
        setSetCompleteAutoSec((prev) => Math.max(0, prev - 1));
      } else if (phase === 'rest') {
        setActualRestElapsed((e) => e + 1);
        setRestRemaining((prev) => Math.max(0, prev - 1));
      } else if (phase === 'nextTransition') {
        setTransitionSec((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, isPaused, autoAdvancePaused]);

  // 2) Sync actualRestElapsed onto the completed set ONLY when rest was triggered by a completed set
  useEffect(() => {
    if (phase !== 'rest' || !restTriggeredBySet || actualRestElapsed === 0) return;
    setLoggedSets((prevLogs) => {
      if (prevLogs.length === 0) return prevLogs;
      const copy = [...prevLogs];
      const last = copy[copy.length - 1];
      if (last.actualRestSeconds === actualRestElapsed) return prevLogs;
      copy[copy.length - 1] = {
        ...last,
        actualRestSeconds: actualRestElapsed,
      };
      return copy;
    });
  }, [phase, restTriggeredBySet, actualRestElapsed]);

  // 3) Pure countdown-zero transition effects (fire cleanly once)
  useEffect(() => {
    if (isPaused) return;
    if (phase === 'prepare' && prepareRemaining <= 0) {
      if (soundEnabled) {
        playSubtleTone(880, 130);
        speakShortCue(`开始，${currentExercise.name}`);
      }
      setCurrentSetStartedAt(formatClockNow());
      setPhase('active');
    }
  }, [phase, isPaused, prepareRemaining, soundEnabled, currentExercise.name]);

  useEffect(() => {
    if (phase === 'prepare' && !isPaused && prepareRemaining >= 1 && prepareRemaining <= 3 && soundEnabled) {
      playSubtleTone(540, 70);
    }
  }, [phase, isPaused, prepareRemaining, soundEnabled]);

  useEffect(() => {
    if (!isPaused && phase === 'setComplete' && !autoAdvancePaused && setCompleteAutoSec <= 0) {
      setPhase('rest');
    }
  }, [phase, isPaused, autoAdvancePaused, setCompleteAutoSec]);

  useEffect(() => {
    if (phase === 'rest' && !isPaused && restRemaining >= 1 && restRemaining <= 3 && soundEnabled) {
      playSubtleTone(540, 70);
    }
  }, [phase, isPaused, restRemaining, soundEnabled]);

  useEffect(() => {
    if (isPaused) return;
    if (phase === 'rest' && restRemaining <= 0 && !restWaitingManual) {
      if (soundEnabled) {
        playSubtleTone(880, 160);
        const nextName = nextExerciseAfterRest?.name ?? '下一动作';
        speakShortCue(`休息结束，准备${nextName}`);
      }
      if (restAutoAdvance) {
        advanceToNextExerciseOrFinish(false);
      } else {
        setRestWaitingManual(true);
      }
    }
  }, [
    phase,
    isPaused,
    restRemaining,
    restWaitingManual,
    restAutoAdvance,
    soundEnabled,
    nextExerciseAfterRest?.name,
    advanceToNextExerciseOrFinish,
  ]);

  useEffect(() => {
    if (!isPaused && phase === 'nextTransition' && transitionSec <= 0) {
      if (soundEnabled) playSubtleTone(780, 100);
      setCurrentSetStartedAt(formatClockNow());
      setPhase('active');
    }
  }, [phase, isPaused, transitionSec, soundEnabled]);

  const startPreparation = () => {
    setIsDebugPreviewMode(false);
    setPostponedNote(false);
    setShowExitConfirm(false);
    setCurrentRound(1);
    setExerciseIdx(0);
    syncExerciseDefaults(0);
    setElapsedSeconds(0);
    setPausedSeconds(0);
    setIsPaused(false);
    setLoggedSets([]);
    setSkippedRecords([]);
    setRestTriggeredBySet(false);
    setRestWaitingManual(false);
    setActualRestElapsed(0);
    setSessionOutcome('in_progress');
    setSessionStartedAt(formatClockNow());
    setSessionEndedAt('');
    setPrepareRemaining(4);
    setPhase('prepare');
  };

  const skipPreparation = () => {
    if (soundEnabled) playSubtleTone(880, 110);
    setCurrentSetStartedAt(formatClockNow());
    setPhase('active');
  };

  const handleCompleteActiveSet = () => {
    setIsDebugPreviewMode(false);
    const endedAt = formatClockNow();
    const newLog: LoggedSet = {
      id: `${Date.now()}-${Math.random()}`,
      round: currentRound,
      exerciseIndex: exerciseIdx + 1,
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      setIndexInSession: loggedSets.length + 1,
      side: currentSide,
      targetReps: currentExercise.targetReps,
      actualReps: repDraft,
      unit: currentExercise.unit,
      weightUsed: getExerciseWeightLabel(currentExercise.usesDumbbells),
      effort: effortDraft,
      startedAt: currentSetStartedAt,
      endedAt,
      actualRestSeconds: 0,
    };

    setLoggedSets((prev) => [...prev, newLog]);
    if (soundEnabled) playSubtleTone(720, 100);

    const decision = resolveCompleteActiveSet(
      plan,
      { round: currentRound, exerciseIdx, side: currentSide },
      customRestSeconds,
      customRoundRestSeconds,
      skippedRecords.length
    );

    if (decision.action === 'switch_to_right') {
      setCurrentSide('right');
      setRepDraft(currentExercise.targetReps);
      setEffortDraft('正好');
      setCurrentSetStartedAt(formatClockNow());
      if (soundEnabled) speakShortCue('左侧完成，请换右侧');
      return;
    }

    if (decision.action === 'finish_workout') {
      if (soundEnabled) speakShortCue('全部轮次已完成，辛苦了');
      setSessionEndedAt(endedAt);
      setSessionOutcome(decision.outcome ?? 'completed');
      setPhase('summary');
      return;
    }

    const kind: RestKind = decision.restKind ?? 'exercise';
    const targetRest = decision.restDurationSeconds ?? 90;

    setRestKind(kind);
    setRestTriggeredBySet(true);
    setRestTargetTotal(targetRest);
    setRestRemaining(targetRest);
    setActualRestElapsed(0);
    setRestWaitingManual(false);
    setSetCompleteAutoSec(4);
    setAutoAdvancePaused(false);
    setPhase('setComplete');
  };

  const updateLatestSetReps = (delta: number) => {
    setAutoAdvancePaused(true);
    setLoggedSets((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = {
        ...last,
        actualReps: Math.max(1, last.actualReps + delta),
      };
      return copy;
    });
  };

  const updateLatestSetEffort = (effort: EffortLevel) => {
    setAutoAdvancePaused(true);
    setLoggedSets((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        effort,
      };
      return copy;
    });
  };

  const goToRestNow = () => {
    setAutoAdvancePaused(false);
    setPhase('rest');
  };

  const adjustActiveRest = (deltaSec: number) => {
    setRestWaitingManual(false);
    setRestRemaining((prev) => {
      const next = Math.max(5, prev + deltaSec);
      setRestTargetTotal((tot) => Math.max(tot, next));
      return next;
    });
  };

  const skipRestToNext = () => {
    advanceToNextExerciseOrFinish(false);
  };

  const startNextImmediately = () => {
    if (soundEnabled) playSubtleTone(880, 110);
    setCurrentSetStartedAt(formatClockNow());
    setPhase('active');
  };

  // Skipping an exercise NEVER logs fake reps and NEVER enters rest attributed to a completed set
  const skipCurrentExercise = () => {
    setSkippedRecords((prev) => [
      ...prev,
      {
        round: currentRound,
        exerciseIndex: exerciseIdx + 1,
        exerciseName: currentExercise.name,
        reason: '主动跳过该动作',
        timestamp: formatClockNow(),
      },
    ]);
    advanceToNextExerciseOrFinish(true);
  };

  const goToPrevExercise = () => {
    if (exerciseIdx > 0) {
      const prevIdx = exerciseIdx - 1;
      setExerciseIdx(prevIdx);
      syncExerciseDefaults(prevIdx);
      setPhase('active');
    } else if (currentRound > 1) {
      const prevRound = currentRound - 1;
      const lastIdx = totalExercisesInRound - 1;
      setCurrentRound(prevRound);
      setExerciseIdx(lastIdx);
      syncExerciseDefaults(lastIdx);
      setPhase('active');
    }
  };

  // Explicit Early Exit (distinguishes 0 sets vs partial sets)
  const exitWorkoutEarly = () => {
    setIsPaused(false);
    setShowExitConfirm(false);
    setSessionEndedAt(formatClockNow());
    setSessionOutcome(resolveEarlyExitOutcome(loggedSets));
    setPhase('summary');
  };

  const selectPlan = (idx: number) => {
    const nextPlan = WORKOUT_OPTIONS[idx];
    setPlanIndex(idx);
    setPlateIdOverride(null);
    setCustomRestSeconds(nextPlan.defaultRestSeconds);
    setCustomRoundRestSeconds(nextPlan.defaultRoundRestSeconds);
    setShowSwapDrawer(false);
    setShowExitConfirm(false);
    setPostponedNote(false);
    setIsDebugPreviewMode(false);
    setCurrentRound(1);
    setExerciseIdx(0);
    setCurrentSide(nextPlan.exercises[0].isUnilateral ? 'left' : 'both');
    setRepDraft(nextPlan.exercises[0].targetReps);
    setLoggedSets([]);
    setSkippedRecords([]);
    setSessionOutcome('in_progress');
    setPhase('today');
  };

  const selectPlatePreset = (preset: PlateSetup) => {
    setPlateIdOverride(preset.id);
  };

  // Prototype-only debug inspection jump (distinct from real workout state progression)
  const jumpToInspectPhase = (target: WorkoutPhase) => {
    setIsPaused(false);
    setShowExitConfirm(false);
    setPostponedNote(false);
    setIsDebugPreviewMode(target !== 'today');
    if (target === 'today') {
      setIsDebugPreviewMode(false);
      setPhase('today');
    } else if (target === 'prepare') {
      setPrepareRemaining(4);
      setPhase('prepare');
    } else if (target === 'active') {
      setCurrentSetStartedAt(formatClockNow());
      setPhase('active');
    } else if (target === 'setComplete') {
      setAutoAdvancePaused(true);
      setPhase('setComplete');
    } else if (target === 'rest') {
      if (phase !== 'rest') {
        const previewSec = Math.max(15, customRestSeconds);
        setRestTargetTotal(previewSec);
        setRestRemaining(previewSec);
        setActualRestElapsed(0);
        setRestWaitingManual(false);
      }
      setPhase('rest');
    } else if (target === 'nextTransition') {
      if (currentRound === 1 && exerciseIdx === 0 && loggedSets.length === 0) {
        setExerciseIdx(1);
        syncExerciseDefaults(1);
      }
      setTransitionSec(2);
      setPhase('nextTransition');
    } else if (target === 'summary') {
      if (sessionOutcome === 'in_progress') {
        setSessionEndedAt(formatClockNow());
        setSessionOutcome(resolveEarlyExitOutcome(loggedSets));
      }
      setPhase('summary');
    }
  };

  return {
    phase,
    setPhase,
    jumpToInspectPhase,
    isDebugPreviewMode,
    plan,
    planIndex,
    selectPlan,
    activePlate,
    PLATE_PRESETS,
    selectPlatePreset,
    showSwapDrawer,
    setShowSwapDrawer,
    showExitConfirm,
    setShowExitConfirm,
    postponedNote,
    setPostponedNote,
    customRestSeconds,
    setCustomRestSeconds,
    customRoundRestSeconds,
    setCustomRoundRestSeconds,
    restAutoAdvance,
    setRestAutoAdvance,
    currentRound,
    exerciseIdx,
    currentSide,
    setCurrentSide,
    currentExercise,
    activeVideoUrl,
    videoMuted,
    setVideoMuted,
    useTestVideoStream,
    setUseTestVideoStream,
    videoReplayToken,
    replayCurrentVideo,
    isLastExInRound,
    isLastRound,
    nextExerciseAfterRest,
    prevExercisePreview,
    totalExercisesInRound,
    restKind,
    restTriggeredBySet,
    restRemaining,
    restTargetTotal,
    actualRestElapsed,
    restWaitingManual,
    prepareRemaining,
    setCompleteAutoSec,
    autoAdvancePaused,
    transitionSec,
    elapsedSeconds,
    pausedSeconds,
    isPaused,
    setIsPaused,
    soundEnabled,
    setSoundEnabled,
    repDraft,
    setRepDraft,
    effortDraft,
    setEffortDraft,
    loggedSets,
    skippedRecords,
    sessionOutcome,
    sessionStartedAt,
    sessionEndedAt,
    getExerciseWeightLabel,
    startPreparation,
    skipPreparation,
    handleCompleteActiveSet,
    updateLatestSetReps,
    updateLatestSetEffort,
    goToRestNow,
    adjustActiveRest,
    skipRestToNext,
    startNextImmediately,
    skipCurrentExercise,
    goToPrevExercise,
    exitWorkoutEarly,
  };
}

export function formatTimeMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
