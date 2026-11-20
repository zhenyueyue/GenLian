import { HistorySessionRecord } from '../../data/appRecords';
import { ExerciseItem, WorkoutPhase } from '../../types/design';
import editorialDeadBugV2Img from '../../assets/images/editorial_dead_bug_v2_1794674675456.jpg';
import editorialFloorPressImg from '../../assets/images/editorial_floor_press_1794674653915.jpg';
import editorialGobletSquatImg from '../../assets/images/editorial_goblet_squat_1794674655868.jpg';
import editorialSingleRowImg from '../../assets/images/editorial_single_row_1794674654582.jpg';
import moodAPlayerDeadBugImg from '../../assets/images/mood_a_player_dead_bug_1794682424533.jpg';
import moodAPlayerFloorPressImg from '../../assets/images/mood_a_player_floor_press_1794682423173.jpg';
import moodAPlayerSingleRowImg from '../../assets/images/mood_a_player_single_row_1794682425212.jpg';
import moodAWideFloorPressImg from '../../assets/images/mood_a_wide_floor_press_1794682426679.jpg';
import moodAWideRecoveryImg from '../../assets/images/mood_a_wide_recovery_1794682427795.jpg';
import moodAWideShoulderImg from '../../assets/images/mood_a_wide_shoulder_1794682427190.jpg';
import moodAWideSingleRowImg from '../../assets/images/mood_a_wide_single_row_1794682426537.jpg';
import warmCardioRowWideImg from '../../assets/images/warm_cardio_row_wide_1794683843128.jpg';
import warmCardioSquatHeroImg from '../../assets/images/warm_cardio_squat_hero_1794683842233.jpg';

export interface WarmMediaAsset {
  wideUrl: string;
  playerVertUrl: string;
  focalClass?: string;
  wideFocalClass?: string;
  heroFocalClass?: string;
  wideContain?: boolean;
  playerContain?: boolean;
  detailContain?: boolean;
}

export const WARM_TOKENS = {
  brandNameZh: '暖光运动',
  brandNameEn: 'Warm Performance',
  positioning:
    '以骨色纸面、衬线标题与柿色行动点构成私人训练志。摄影仍是内容，界面退成稳定的版面、卡片与实色控件。',

  // 60% 主画布：骨色纸（比纯白暖，比旧矿物白更干净）
  canvasBg: '#F4F1EB',
  // 30% 结构表面：抬升白卡与浅石色槽
  surfaceBg: '#E9E4DB',
  surfaceElevatedBg: '#DDD7CC',
  surfaceBackdropStudio: '#E7E1D6',
  surfaceWhiteLift: '#FFFFFF',
  hairlineBorder: 'rgba(28, 25, 23, 0.10)',
  hairlineStrong: 'rgba(28, 25, 23, 0.18)',

  // 主次文字：暖墨与石色，小字在纸面上保持 AA
  inkPrimary: '#1C1917',
  inkSecondary: '#44403C',
  inkMuted: '#5C564F',

  // 10% 品牌强调：柿色，白字对比约 5.2:1；浅底小字用更深的 #9A3412
  accent: '#C2410C',
  accentHover: '#9A3412',
  accentTextOnLight: '#9A3412',
  accentSoft: 'rgba(194, 65, 12, 0.12)',
  accentContrastText: '#FFFFFF',

  // 辅助色只用于休息、暂停与次要标注
  auxSlate: '#3E5348',
  auxSlateSoft: 'rgba(62, 83, 72, 0.10)',
  warning: '#92400E',

  graphiteCtaBg: '#1C1917',
  graphiteCtaText: '#F4F1EB',

  heroTopScrim:
    'linear-gradient(180deg, rgba(244,241,235,0.92) 0%, rgba(244,241,235,0.62) 56%, rgba(244,241,235,0) 100%)',
  heroBottomScrim:
    'linear-gradient(180deg, rgba(28,25,23,0) 0%, rgba(28,25,23,0.08) 36%, rgba(28,25,23,0.62) 72%, rgba(28,25,23,0.82) 100%)',
  dockedHeaderBg: 'rgba(244, 241, 235, 0.92)',

  playerGlassBg: 'rgba(255, 255, 255, 0.92)',
  playerGlassBorder: 'rgba(28, 25, 23, 0.10)',
  playerGlassHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  playerTopScrim:
    'linear-gradient(180deg, rgba(244,241,235,0.94) 0%, rgba(244,241,235,0.72) 52%, rgba(244,241,235,0.16) 82%, rgba(244,241,235,0) 100%)',
  playerBottomScrimActive:
    'linear-gradient(180deg, rgba(244,241,235,0) 0%, rgba(244,241,235,0.72) 28%, rgba(244,241,235,0.96) 62%, #F4F1EB 100%)',
  playerBottomScrimOverlay:
    'linear-gradient(180deg, rgba(28,25,23,0) 0%, rgba(28,25,23,0.28) 48%, rgba(28,25,23,0.55) 100%)',
  playerProgressPending: 'rgba(28, 25, 23, 0.18)',

  restDimFilterClass: 'scale-[1.015] brightness-[0.72] saturate-[0.82]',
  restDimVeilClass: 'bg-[#1C1917]/38',
  restTextPrimary: '#F4F1EB',
  restTextSecondary: '#F3EDE4',
  restAccentText: '#FFB08A',
  restProgressTrack: 'rgba(244, 241, 235, 0.32)',
  restPreviewCardBg: 'rgba(255, 252, 248, 0.94)',
  restPreviewCardBorder: 'rgba(255, 255, 255, 0.45)',
  restSecondaryBtnBg: 'rgba(28, 25, 23, 0.55)',
  restSecondaryBtnBorder: 'rgba(255, 255, 255, 0.22)',

  bottomNavBg: 'rgba(255, 252, 248, 0.94)',
  bottomNavBorder: 'rgba(28, 25, 23, 0.08)',
  bottomNavHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.95)',
  bottomNavShadow: '0 16px 40px -18px rgba(28, 25, 23, 0.32), 0 2px 8px -4px rgba(28, 25, 23, 0.08)',
  bottomNavActivePillBg: '#1C1917',
  bottomNavActivePillBorder: 'transparent',
  bottomNavCenterBg: '#C2410C',
  bottomNavCenterBorder: 'transparent',

  photoFilterClass: 'brightness-[1.02] contrast-[1.04] saturate-[0.92] hue-rotate-[-3deg]',
  photoCoolAirTintClass: 'bg-[#F7F4EF]/[0.05]',

  detailHeaderOverlay:
    'linear-gradient(180deg, rgba(244,241,235,0.72) 0%, rgba(244,241,235,0) 32%, rgba(244,241,235,0.9) 80%, #F4F1EB 100%)',
} as const;

export const WARM_PALETTE_SPEC = [
  {
    role: '60% 主画布 · Bone Paper',
    name: '骨色纸',
    hex: '#F4F1EB',
    usage: '首页、档案、详情与动作拆解的底纸。比纯白暖，比旧矿物白更干净。',
  },
  {
    role: '30% 结构表面 · Lifted Card',
    name: '抬升白卡',
    hex: '#FFFFFF',
    usage: '指标条、课程卡、档案条目与抽屉内容。以 1px 发丝线和短阴影与纸面分开。',
  },
  {
    role: '主墨 · Warm Ink',
    name: '暖墨',
    hex: '#1C1917',
    usage: '衬线主标题、核心数字、选中导航胶囊与次级确认。在 #F4F1EB 上对比充足。',
  },
  {
    role: '辅墨 · Stone',
    name: '石色正文',
    hex: '#44403C',
    usage: '动作说明、肌群与辅助文案。弱化注记用 #5C564F，小字仍保持 AA。',
  },
  {
    role: '10% 品牌强调 · Persimmon',
    name: '柿色',
    hex: '#C2410C',
    usage: '主开练按钮、完成动作、进度与月历完整日。白字约 5.2:1；12px 浅底小字用 #9A3412。',
  },
  {
    role: '辅助 · Quiet Sage',
    name: '静绿',
    hex: '#3E5348',
    usage: '只用于休息设定、暂停余量与次要标注，不和柿色主按钮抢注意力。',
  },
] as const;

export const WARM_TYPE_SCALE = [
  {
    level: '计时器与核心度量',
    font: 'Outfit · Tabular',
    spec: '90px / 32px / 28px · SemiBold 600 · -0.03em',
    sample: '00:48 · 16 组',
  },
  {
    level: 'Hero 与页面主标题',
    font: 'Fraunces + Noto Serif SC',
    spec: '32px / 28px / 26px · SemiBold 600 · 行高 1.12',
    sample: '全身均衡循环',
  },
  {
    level: '章节与动作列表标题',
    font: 'PingFang SC / Noto Sans SC',
    spec: '15.5px – 16px · SemiBold 600 · 行高 1.35',
    sample: '哑铃地板卧推 · 单臂划船',
  },
  {
    level: '动作提示与导语正文',
    font: 'PingFang SC / Noto Sans SC',
    spec: '13px · Regular 400 · 行高 1.60',
    sample: '背阔肌发力将哑铃拉向髋侧，避免躯干借力旋转。',
  },
  {
    level: '时间码 / 节奏 / 配重',
    font: 'JetBrains Mono · Tabular',
    spec: '11.5px – 12.5px · Medium 500 · 等宽对齐',
    sample: '06:24 · 3-1-1 · 6.5 kg',
  },
] as const;

export const WARM_COMPONENT_SPECS = [
  {
    title: '01 · 首页照片卡与首屏训练志',
    detail:
      '力量、有氧、恢复共用骨色纸、衬线标题与柿色主按钮。首屏把课程照片收成圆角卡片，指标、开练和动作顺序同时露出。',
  },
  {
    title: '02 · 训练中全屏舞台与小字对比度保护',
    detail:
      '全幅展示完整身体姿态与哑铃器械，不裁切头部、足底与哑铃；顶部 144px 与底部 37% 渐层配合轻磨砂状态胶囊，确保明亮窗光下 12px 小字对比度稳定 >= 7:1。',
  },
  {
    title: '03 · 通透不压抑的组间 / 训练间歇休息',
    detail:
      '进入休息后画面在 500ms 内温和降至 72% 亮度并叠加 32% 石板暮纱，保留阳光训练空间呼吸感；90px Outfit 倒计时配合 2.5px 细进度线与亮色预告卡。',
  },
  {
    title: '04 · 实色底栏与训练档案',
    detail:
      '底栏改为实色白卡。选中项用暖墨胶囊配浅色文字，开练保持柿色圆点。档案页用三列指标卡、可点日历和空分类提示。',
  },
] as const;

// 力量 A · 专注发力与肌肉控制
const WARM_FLOOR_PRESS: WarmMediaAsset = {
  wideUrl: moodAWideFloorPressImg,
  playerVertUrl: moodAPlayerFloorPressImg,
  heroFocalClass: 'object-[50%_48%]',
  focalClass: 'object-[50%_54%]',
  detailContain: true,
};

const WARM_SINGLE_ROW: WarmMediaAsset = {
  wideUrl: moodAWideSingleRowImg,
  playerVertUrl: moodAPlayerSingleRowImg,
  focalClass: 'object-[50%_46%]',
  detailContain: true,
};

const WARM_GOBLET_SQUAT: WarmMediaAsset = {
  wideUrl: editorialGobletSquatImg,
  playerVertUrl: editorialGobletSquatImg,
  focalClass: 'object-[50%_46%]',
  wideContain: true,
  detailContain: true,
};

const WARM_DEAD_BUG: WarmMediaAsset = {
  wideUrl: editorialDeadBugV2Img,
  playerVertUrl: moodAPlayerDeadBugImg,
  focalClass: 'object-[50%_52%]',
  wideFocalClass: 'object-[50%_62%]',
  detailContain: true,
};

// 有氧训练 · 鲜明身体动态与流畅节奏（保持同一日光品牌调性，拒绝霓虹与游戏化 HUD）
const WARM_GOBLET_CARDIO: WarmMediaAsset = {
  wideUrl: warmCardioSquatHeroImg,
  playerVertUrl: warmCardioSquatHeroImg,
  heroFocalClass: 'object-[50%_44%]',
  focalClass: 'object-[50%_46%]',
  wideContain: true,
  detailContain: true,
};

const WARM_ROW_CARDIO: WarmMediaAsset = {
  wideUrl: warmCardioRowWideImg,
  playerVertUrl: editorialSingleRowImg,
  focalClass: 'object-[50%_48%]',
  detailContain: true,
};

const WARM_FLOOR_PRESS_CARDIO: WarmMediaAsset = {
  wideUrl: moodAWideFloorPressImg,
  playerVertUrl: editorialFloorPressImg,
  focalClass: 'object-[50%_54%]',
  detailContain: true,
};

// 力量 B & 恢复日
const WARM_SHOULDER: WarmMediaAsset = {
  wideUrl: moodAWideShoulderImg,
  playerVertUrl: moodAWideShoulderImg,
  heroFocalClass: 'object-[50%_38%]',
  focalClass: 'object-center',
  playerContain: true,
  detailContain: true,
};

const WARM_RECOVERY: WarmMediaAsset = {
  wideUrl: moodAWideRecoveryImg,
  playerVertUrl: moodAWideRecoveryImg,
  heroFocalClass: 'object-[46%_45%]',
  focalClass: 'object-center',
  playerContain: true,
  detailContain: true,
};

export const WARM_PLAN_MEDIA: Record<
  string,
  {
    heroUrl: string;
    wideUrl: string;
    heroFocalClass?: string;
    kicker: string;
    intentLine: string;
  }
> = {
  'strength-a': {
    heroUrl: WARM_FLOOR_PRESS.playerVertUrl,
    wideUrl: WARM_FLOOR_PRESS.wideUrl,
    heroFocalClass: WARM_FLOOR_PRESS.heroFocalClass,
    kicker: '力量 A · 全身均衡循环',
    intentLine: '晨光下的胸推、划船与深蹲复合循环，保持肌肉张力与稳定呼吸节奏。',
  },
  'strength-b': {
    heroUrl: WARM_SHOULDER.wideUrl,
    wideUrl: WARM_SHOULDER.wideUrl,
    heroFocalClass: WARM_SHOULDER.heroFocalClass,
    kicker: '力量 B · 肩背与腿后链',
    intentLine: '可控配重打磨肩中束与髋铰链动作质量，不抢节奏不耸肩。',
  },
  cardio: {
    heroUrl: WARM_GOBLET_CARDIO.playerVertUrl,
    wideUrl: WARM_ROW_CARDIO.wideUrl,
    heroFocalClass: WARM_GOBLET_CARDIO.heroFocalClass,
    kicker: '有氧 · 轻负重代谢循环',
    intentLine: '30 秒流畅间歇衔接，在鲜明身体动态与清透节奏中抬升心肺动力。',
  },
  recovery: {
    heroUrl: WARM_RECOVERY.wideUrl,
    wideUrl: WARM_RECOVERY.wideUrl,
    heroFocalClass: WARM_RECOVERY.heroFocalClass,
    kicker: '恢复日 · 舒展与呼吸',
    intentLine: '温和唤醒胸椎旋转与髋部活动度，为身体留出长久余量。',
  },
};

export const WARM_EXERCISE_MEDIA: Record<string, WarmMediaAsset> = {
  'ex-floor-press': WARM_FLOOR_PRESS,
  'ex-floor-press-cardio': WARM_FLOOR_PRESS_CARDIO,
  'ex-single-row': WARM_SINGLE_ROW,
  'ex-row-cardio': WARM_ROW_CARDIO,
  'ex-goblet-squat': WARM_GOBLET_SQUAT,
  'ex-goblet-cardio': WARM_GOBLET_CARDIO,
  'ex-dead-bug': WARM_DEAD_BUG,
  'ex-dead-bug-b': WARM_DEAD_BUG,
  'ex-core-cardio': WARM_DEAD_BUG,
  'ex-dead-bug-rec': WARM_DEAD_BUG,
  'ex-shoulder-press': WARM_SHOULDER,
  'ex-lateral-raise': WARM_SHOULDER,
  'ex-rdl': WARM_SINGLE_ROW,
  'ex-thoracic': WARM_RECOVERY,
};

export function getWarmExerciseMedia(exercise: ExerciseItem): WarmMediaAsset {
  return WARM_EXERCISE_MEDIA[exercise.id] ?? WARM_FLOOR_PRESS;
}

export function getWarmArchiveStill(rec: HistorySessionRecord): string {
  const media = WARM_PLAN_MEDIA[rec.planId];
  if (media) return media.wideUrl;
  return WARM_FLOOR_PRESS.wideUrl;
}

export function getWarmStatusBarTone(phase: WorkoutPhase): 'light' | 'dark' {
  return phase === 'rest' ||
    phase === 'prepare' ||
    phase === 'nextTransition' ||
    phase === 'setComplete'
    ? 'light'
    : 'dark';
}
