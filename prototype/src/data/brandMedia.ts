import editorialFloorPress from '../assets/images/editorial_floor_press_1794674653915.jpg';
import editorialSingleRow from '../assets/images/editorial_single_row_1794674654582.jpg';
import editorialGobletSquat from '../assets/images/editorial_goblet_squat_1794674655868.jpg';
import editorialDeadBug from '../assets/images/editorial_dead_bug_v2_1794674675456.jpg';

import precisionFloorPress from '../assets/images/precision_floor_press_1794674657653.jpg';
import precisionSingleRow from '../assets/images/precision_single_row_1794674659174.jpg';
import precisionGobletSquat from '../assets/images/precision_goblet_squat_1794674659754.jpg';
import precisionDeadBug from '../assets/images/precision_dead_bug_v2_1794674676159.jpg';

export type BrandVisualDirection = 'editorial' | 'precision';

const EDITORIAL_BY_EXERCISE: Record<string, string> = {
  'ex-floor-press': editorialFloorPress,
  'ex-floor-press-cardio': editorialFloorPress,
  'ex-single-row': editorialSingleRow,
  'ex-row-cardio': editorialSingleRow,
  'ex-goblet-squat': editorialGobletSquat,
  'ex-goblet-cardio': editorialGobletSquat,
  'ex-dead-bug': editorialDeadBug,
  'ex-dead-bug-b': editorialDeadBug,
  'ex-core-cardio': editorialDeadBug,
  'ex-dead-bug-rec': editorialDeadBug,
};

const PRECISION_BY_EXERCISE: Record<string, string> = {
  'ex-floor-press': precisionFloorPress,
  'ex-floor-press-cardio': precisionFloorPress,
  'ex-single-row': precisionSingleRow,
  'ex-row-cardio': precisionSingleRow,
  'ex-goblet-squat': precisionGobletSquat,
  'ex-goblet-cardio': precisionGobletSquat,
  'ex-dead-bug': precisionDeadBug,
  'ex-dead-bug-b': precisionDeadBug,
  'ex-core-cardio': precisionDeadBug,
  'ex-dead-bug-rec': precisionDeadBug,
};

export function getDirectionExerciseVisual(
  direction: BrandVisualDirection,
  exerciseId: string,
  fallbackImageUrl?: string
): string | undefined {
  const map = direction === 'editorial' ? EDITORIAL_BY_EXERCISE : PRECISION_BY_EXERCISE;
  return map[exerciseId] ?? fallbackImageUrl;
}
