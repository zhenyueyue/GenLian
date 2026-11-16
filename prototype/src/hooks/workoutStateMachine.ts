import {
  ArmSide,
  LoggedSet,
  RestKind,
  SessionOutcome,
  SkippedRecord,
  WorkoutPlan,
} from '../types/design';

export interface CircuitCursor {
  round: number;
  exerciseIdx: number;
  side: ArmSide;
}

export interface AdvanceStepResult {
  finished: boolean;
  nextCursor: CircuitCursor;
  outcome?: SessionOutcome;
}

/**
 * Computes the next cursor or session completion strictly following:
 * Exercise 1 -> Rest -> Exercise 2 (Left -> Right) -> Rest -> Exercise 3 -> Rest -> Exercise 4 -> Round Rest -> Round+1
 */
export function resolveAdvanceAfterRestOrSkip(
  plan: WorkoutPlan,
  cursor: CircuitCursor,
  loggedCount: number,
  skippedCount: number,
  viaSkip = false
): AdvanceStepResult {
  const totalEx = plan.exercises.length;
  const isLastExInRound = cursor.exerciseIdx >= totalEx - 1;
  const isLastRound = cursor.round >= plan.rounds;

  if (isLastExInRound && isLastRound) {
    const hadSkips = skippedCount > 0 || viaSkip;
    let outcome: SessionOutcome = 'completed';
    if (loggedCount === 0) {
      outcome = 'early_exit_zero';
    } else if (hadSkips) {
      outcome = 'early_exit_partial';
    }
    return {
      finished: true,
      nextCursor: cursor,
      outcome,
    };
  }

  if (isLastExInRound) {
    const firstEx = plan.exercises[0];
    return {
      finished: false,
      nextCursor: {
        round: cursor.round + 1,
        exerciseIdx: 0,
        side: firstEx.isUnilateral ? 'left' : 'both',
      },
    };
  }

  const nextIdx = cursor.exerciseIdx + 1;
  const nextEx = plan.exercises[nextIdx];
  return {
    finished: false,
    nextCursor: {
      round: cursor.round,
      exerciseIdx: nextIdx,
      side: nextEx.isUnilateral ? 'left' : 'both',
    },
  };
}

export interface CompleteSetDecision {
  action: 'switch_to_right' | 'finish_workout' | 'enter_set_complete';
  nextSide: ArmSide;
  restKind?: RestKind;
  restDurationSeconds?: number;
  outcome?: SessionOutcome;
}

export function resolveCompleteActiveSet(
  plan: WorkoutPlan,
  cursor: CircuitCursor,
  customRestSeconds: number,
  customRoundRestSeconds: number,
  skippedCount: number
): CompleteSetDecision {
  const currentEx = plan.exercises[cursor.exerciseIdx];
  const totalEx = plan.exercises.length;
  const isLastExInRound = cursor.exerciseIdx >= totalEx - 1;
  const isLastRound = cursor.round >= plan.rounds;

  if (currentEx.isUnilateral && cursor.side === 'left') {
    return {
      action: 'switch_to_right',
      nextSide: 'right',
    };
  }

  if (isLastExInRound && isLastRound) {
    return {
      action: 'finish_workout',
      nextSide: cursor.side,
      outcome: skippedCount > 0 ? 'early_exit_partial' : 'completed',
    };
  }

  const kind: RestKind = isLastExInRound ? 'round' : 'exercise';
  const restSec = Math.max(5, kind === 'round' ? customRoundRestSeconds : customRestSeconds);
  return {
    action: 'enter_set_complete',
    nextSide: cursor.side,
    restKind: kind,
    restDurationSeconds: restSec,
  };
}

export function resolveEarlyExitOutcome(loggedSets: LoggedSet[]): SessionOutcome {
  return loggedSets.length === 0 ? 'early_exit_zero' : 'early_exit_partial';
}

export function resolveSummaryCounts(loggedSets: LoggedSet[], skippedRecords: SkippedRecord[]) {
  return {
    totalLoggedSets: loggedSets.length,
    totalActualReps: loggedSets.reduce((sum, item) => sum + item.actualReps, 0),
    totalSkipped: skippedRecords.length,
    totalRestSeconds: loggedSets.reduce((sum, item) => sum + item.actualRestSeconds, 0),
  };
}
