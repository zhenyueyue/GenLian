import { HistorySessionRecord } from '../../data/appRecords';
import { ExerciseItem } from '../../types/design';

export type PolishedScreen = 'today' | 'history';

export interface UnifiedMediaAsset {
  wideUrl: string;
  playerVertUrl: string;
  focalClass?: string;
}

/**
 * 「跟练」统一摄影艺术指导规范（Unified Art Direction Bible）
 * - 空间与道具：同一现代极简混凝土＋温润橡木居家训练室，深炭灰编织训练垫、哑光黑可调哑铃
 * - 人物与着装：同一位 29 岁精瘦薄肌男性，哑光炭橄榄训练短袖＋纯黑运动短裤，赤足训练
 * - 双色温布光：窗外冷调暮蓝天光作环境暗部补光（保留阴影细节）＋室内 3000K 暖钨丝灯作主体轮廓光
 * - 构图与安全区：9:16 竖构图将人体完整控制在画面中段 50%，底部 25% 保留干净地面/垫面以承接悬浮控件
 */
export const PHOTOGRAPHY_SPEC_NOTES = [
  { label: '统一空间', value: '混凝土建筑墙面 × 温润橡木饰面 · 同一居家训练室' },
  { label: '双色温布光', value: '窗外暮蓝冷光提亮暗部 + 3000K 暖钨丝灯勾勒发力轮廓' },
  { label: '人物与着装', value: '统一炭橄榄哑光短袖 + 黑色短裤，关节与哑铃角度清晰' },
  { label: '9:16 安全构图', value: '人物居画面中段 50%，底留 25% 干净地面承接悬浮控件' },
];

export const POLISHED_PLAN_MEDIA: Record<
  string,
  {
    heroUrl: string;
    wideUrl: string;
    kicker: string;
    intentLine: string;
  }
> = {
  'strength-a': {
    heroUrl: '/src/assets/images/polish_player_floor_press_1794680644922.jpg',
    wideUrl: '/src/assets/images/polish_wide_floor_press_1794680641675.jpg',
    kicker: '力量 A · 全身基础',
    intentLine: '胸推、单臂划船与高脚杯深蹲的稳健复合循环，兼顾核心控制。',
  },
  'strength-b': {
    heroUrl: '/src/assets/images/polish_player_shoulder_press_1794680649526.jpg',
    wideUrl: '/src/assets/images/polish_still_strength_b_1794679880006.jpg',
    kicker: '力量 B · 肩背与后链',
    intentLine: '偏轻可控配重，专注肩中束宽度与髋铰链动作质量。',
  },
  cardio: {
    heroUrl: '/src/assets/images/polish_player_goblet_squat_1794680647023.jpg',
    wideUrl: '/src/assets/images/polish_still_cardio_1794679928289.jpg',
    kicker: '有氧 · 轻负重代谢',
    intentLine: '30 秒短间歇流畅衔接，在不牺牲动作幅度的前提下提升心率。',
  },
  recovery: {
    heroUrl: '/src/assets/images/polish_player_thoracic_1794680651707.jpg',
    wideUrl: '/src/assets/images/polish_still_recovery_1794679880275.jpg',
    kicker: '恢复日 · 舒展与呼吸',
    intentLine: '释放胸椎与髋部紧绷感，让身体为下一次负重训练留出余量。',
  },
};

const FLOOR_PRESS_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_wide_floor_press_1794680641675.jpg',
  playerVertUrl: '/src/assets/images/polish_player_floor_press_1794680644922.jpg',
  focalClass: 'object-[50%_58%]',
};

const SINGLE_ROW_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_wide_single_row_1794680642147.jpg',
  playerVertUrl: '/src/assets/images/polish_player_single_row_1794680646689.jpg',
  focalClass: 'object-[50%_46%]',
};

const GOBLET_SQUAT_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_still_cardio_1794679928289.jpg',
  playerVertUrl: '/src/assets/images/polish_player_goblet_squat_1794680647023.jpg',
  focalClass: 'object-[50%_48%]',
};

const DEAD_BUG_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_wide_dead_bug_1794680643230.jpg',
  playerVertUrl: '/src/assets/images/polish_player_dead_bug_1794680650111.jpg',
  focalClass: 'object-[50%_58%]',
};

const SHOULDER_PRESS_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_still_strength_b_1794679880006.jpg',
  playerVertUrl: '/src/assets/images/polish_player_shoulder_press_1794680649526.jpg',
  focalClass: 'object-[50%_42%]',
};

const LATERAL_RAISE_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_wide_lateral_raise_1794680642811.jpg',
  playerVertUrl: '/src/assets/images/polish_player_lateral_raise_1794680649059.jpg',
  focalClass: 'object-[50%_44%]',
};

const RDL_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_wide_rdl_1794680644434.jpg',
  playerVertUrl: '/src/assets/images/polish_player_rdl_1794680649230.jpg',
  focalClass: 'object-[50%_46%]',
};

const THORACIC_ASSET: UnifiedMediaAsset = {
  wideUrl: '/src/assets/images/polish_still_recovery_1794679880275.jpg',
  playerVertUrl: '/src/assets/images/polish_player_thoracic_1794680651707.jpg',
  focalClass: 'object-[50%_48%]',
};

export const POLISHED_EXERCISE_MEDIA: Record<string, UnifiedMediaAsset> = {
  'ex-floor-press': FLOOR_PRESS_ASSET,
  'ex-floor-press-cardio': FLOOR_PRESS_ASSET,
  'ex-single-row': SINGLE_ROW_ASSET,
  'ex-row-cardio': SINGLE_ROW_ASSET,
  'ex-goblet-squat': GOBLET_SQUAT_ASSET,
  'ex-goblet-cardio': GOBLET_SQUAT_ASSET,
  'ex-dead-bug': DEAD_BUG_ASSET,
  'ex-dead-bug-b': DEAD_BUG_ASSET,
  'ex-core-cardio': DEAD_BUG_ASSET,
  'ex-dead-bug-rec': DEAD_BUG_ASSET,
  'ex-shoulder-press': SHOULDER_PRESS_ASSET,
  'ex-lateral-raise': LATERAL_RAISE_ASSET,
  'ex-rdl': RDL_ASSET,
  'ex-thoracic': THORACIC_ASSET,
};

export function getPolishedExerciseMedia(exercise: ExerciseItem): UnifiedMediaAsset {
  return POLISHED_EXERCISE_MEDIA[exercise.id] ?? FLOOR_PRESS_ASSET;
}

export function getPolishedArchiveStill(rec: HistorySessionRecord): string {
  const media = POLISHED_PLAN_MEDIA[rec.planId];
  if (media) return media.wideUrl;
  return FLOOR_PRESS_ASSET.wideUrl;
}

export function formatTempoExplanation(tempo: string): string {
  if (/^\d+-\d+-\d+$/.test(tempo)) {
    const [ecc, pause, con] = tempo.split('-');
    return `离心下放 ${ecc} 秒 · 底部停顿 ${pause} 秒 · 发力推拉 ${con} 秒`;
  }
  return `节奏要求：${tempo}，全程控制呼吸与躯干稳定`;
}
