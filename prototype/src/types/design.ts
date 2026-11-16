export type WorkoutPhase =
  | 'today'
  | 'prepare'
  | 'active'
  | 'setComplete'
  | 'rest'
  | 'nextTransition'
  | 'summary';

export type WorkoutCategory = '力量 A' | '力量 B' | '有氧' | '恢复日';

export type DeviceSize = 'promax' | 'standard' | 'se';

export type EffortLevel = '轻松' | '正好' | '吃力';

export type ArmSide = 'left' | 'right' | 'both';

export type RestKind = 'exercise' | 'round';

export type SessionOutcome =
  | 'in_progress'
  | 'completed'
  | 'early_exit_partial'
  | 'early_exit_zero';

export interface PlateSetup {
  id: string;
  platesPerSideKg: number[];
  plateSumPerDumbbellKg: number;
  inventoryUsage: string;
  shortLabel: string;
  detailLabel: string;
  cautionNote?: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: '胸' | '背' | '腿' | '肩' | '核心' | '全身' | '恢复';
  targetMuscle: string;
  usesDumbbells: boolean;
  isUnilateral: boolean;
  recommendedWeightTier: '徒手' | '偏轻配重' | '中等配重';
  targetReps: number;
  unit: '次' | '秒';
  tempo: string;
  voiceCue: string;
  nextPrepCue: string;
  imageUrl: string;
  verticalImageUrl?: string;
  videoUrl?: string;
  hasVerifiedPoseImage?: boolean;
  videoMissingNote?: string;
}

export interface WorkoutPlan {
  id: string;
  category: WorkoutCategory;
  title: string;
  subtitle: string;
  scheduleContext: string;
  estimatedMinutesRange: string;
  rounds: number;
  defaultRestSeconds: number;
  defaultRoundRestSeconds: number;
  defaultPlateId: string | null;
  exercises: ExerciseItem[];
}

export interface LoggedSet {
  id: string;
  round: number;
  exerciseIndex: number;
  exerciseId: string;
  exerciseName: string;
  setIndexInSession: number;
  side: ArmSide;
  targetReps: number;
  actualReps: number;
  unit: '次' | '秒';
  weightUsed: string;
  effort: EffortLevel;
  startedAt: string;
  endedAt: string;
  actualRestSeconds: number;
}

export interface SkippedRecord {
  round: number;
  exerciseIndex: number;
  exerciseName: string;
  reason: string;
  timestamp: string;
}
