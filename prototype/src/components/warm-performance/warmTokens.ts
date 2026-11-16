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
    '以「日光运动」的晨光温度与全幅沉浸为基底，吸收「清透运动」的精密数字排版、克制分隔线与轻量悬浮控件，建立单一且统一的私人健身品牌系统。',

  // 60% 主画布：温润矿物白（非死白、非发黄奶油、非深黑）
  canvasBg: '#F9F7F3',
  // 30% 结构表面：浅石灰岩与纯白抬升层（明度差 <= 4.5%，避免厚重卡片堆叠）
  surfaceBg: '#F1EFE8',
  surfaceElevatedBg: '#E6E2D8',
  surfaceBackdropStudio: '#EAE5DC',
  surfaceWhiteLift: '#FFFFFF',
  hairlineBorder: 'rgba(25, 29, 34, 0.085)',
  hairlineStrong: 'rgba(25, 29, 34, 0.14)',

  // 主次文字：深矿物石墨 + 中性冷石板灰（吸收方案 2 的清透精准度，对比度 >= 4.5:1）
  inkPrimary: '#191D22',
  inkSecondary: '#4D545E',
  inkMuted: '#686F7A',

  // 10% 单一品牌强调色：暖光运动橙（克制用于关键运动触发与进度，绝不与蓝色竞争）
  accent: '#D44E24',
  accentHover: '#BF421B',
  accentTextOnLight: '#B83E18', // 12-13px 小字在 #F9F7F3 上的 WCAG AA 校准色 (~5.6:1)
  accentSoft: 'rgba(212, 78, 36, 0.10)',
  accentContrastText: '#FFFFFF',

  // 克制辅助冷色：仅用于恢复/暂停/次要数值注释，绝不充当主品牌色或 CTA
  auxSlate: '#415A72',
  auxSlateSoft: 'rgba(65, 90, 114, 0.09)',
  warning: '#B86214',

  // 实色结构按钮（非大面积纯黑，保持温润石墨质感）
  graphiteCtaBg: '#191D22',
  graphiteCtaText: '#F9F7F3',

  // 顶部吸顶栏与 Hero 光影过渡（强化明亮天光下的小字可读性）
  heroTopScrim:
    'linear-gradient(180deg, rgba(249,247,243,0.92) 0%, rgba(249,247,243,0.62) 56%, rgba(249,247,243,0) 100%)',
  heroBottomScrim:
    'linear-gradient(180deg, rgba(249,247,243,0) 0%, rgba(249,247,243,0) 44%, rgba(249,247,243,0.72) 72%, rgba(249,247,243,0.96) 88%, #F9F7F3 100%)',
  dockedHeaderBg: 'rgba(249, 247, 243, 0.92)',

  // 动作舞台与受控光学悬浮控件（少量 Apple Liquid Glass 质感）
  playerGlassBg: 'rgba(249, 247, 243, 0.84)',
  playerGlassBorder: 'rgba(25, 29, 34, 0.13)',
  playerGlassHighlight: 'inset 0 0.75px 0 rgba(255, 255, 255, 0.82)',
  playerTopScrim:
    'linear-gradient(180deg, rgba(249,247,243,0.92) 0%, rgba(249,247,243,0.72) 56%, rgba(249,247,243,0.22) 82%, rgba(249,247,243,0) 100%)',
  playerBottomScrimActive:
    'linear-gradient(180deg, rgba(249,247,243,0) 0%, rgba(249,247,243,0.68) 32%, rgba(249,247,243,0.94) 64%, rgba(249,247,243,0.99) 100%)',
  playerBottomScrimOverlay:
    'linear-gradient(180deg, rgba(25,29,34,0) 0%, rgba(25,29,34,0.22) 52%, rgba(25,29,34,0.46) 100%)',
  playerProgressPending: 'rgba(25, 29, 34, 0.20)',

  // 休息阶段：温和降亮 72% + 轻透石板暮纱（空间与人物轮廓保持清晰可见，彻底杜绝黑屏压抑）
  restDimFilterClass: 'scale-[1.015] brightness-[0.72] saturate-[0.82]',
  restDimVeilClass: 'bg-[#1F242B]/32',
  restTextPrimary: '#F9F7F3',
  restTextSecondary: '#EEF1F4',
  restAccentText: '#FF9E7D',
  restProgressTrack: 'rgba(249, 247, 243, 0.28)',
  restPreviewCardBg: 'rgba(249, 247, 243, 0.96)',
  restPreviewCardBorder: 'rgba(25, 29, 34, 0.11)',
  restSecondaryBtnBg: 'rgba(249, 247, 243, 0.22)',
  restSecondaryBtnBorder: 'rgba(249, 247, 243, 0.34)',

  // 底部浅色悬浮胶囊导航栏（轻盈暖白磨砂 × 浅米白激活胶囊 × 细描边）
  bottomNavBg: 'rgba(252, 250, 246, 0.88)',
  bottomNavBorder: 'rgba(25, 29, 34, 0.085)',
  bottomNavHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.92)',
  bottomNavShadow: '0 12px 32px -10px rgba(25, 29, 34, 0.11), 0 2px 8px -2px rgba(25, 29, 34, 0.04)',
  bottomNavActivePillBg: '#F3EEE3',
  bottomNavActivePillBorder: 'rgba(212, 78, 36, 0.22)',
  bottomNavCenterBg: 'rgba(212, 78, 36, 0.09)',
  bottomNavCenterBorder: 'rgba(212, 78, 36, 0.24)',

  // 摄影光学调色（消除过黄/家居感，校准为清透晨光）
  photoFilterClass: 'brightness-[1.01] contrast-[1.03] saturate-[0.94] hue-rotate-[-2deg]',
  photoCoolAirTintClass: 'bg-[#F2F6FA]/[0.06]',

  // 详情/总结头图淡入渐变
  detailHeaderOverlay:
    'linear-gradient(180deg, rgba(249,247,243,0.78) 0%, rgba(249,247,243,0) 34%, rgba(249,247,243,0.88) 82%, #F9F7F3 100%)',
} as const;

export const WARM_PALETTE_SPEC = [
  {
    role: '60% 主画布 · Warm Mineral White',
    name: '暖白矿物纸',
    hex: '#F9F7F3',
    usage: '首页底色、训练档案、单次详情与动作拆解底布，柔和清透、不刺眼也不昏暗。',
  },
  {
    role: '30% 结构表面 · Soft Limestone',
    name: '浅石灰岩',
    hex: '#F1EFE8',
    usage: '分段开关底槽、节拍卡片、月历容器与次级按钮，与主画布维持约 3.2% 轻量明度差。',
  },
  {
    role: '主墨与结构锚点 · Mineral Graphite',
    name: '深矿物石墨',
    hex: '#191D22',
    usage: '中文主标题、核心数字、当前进度段与次级确认操作（#F9F7F3 上对比度 15.8:1）。',
  },
  {
    role: '辅墨 · Slate Neutral',
    name: '中性石板灰',
    hex: '#4D545E',
    usage: '动作说明、目标肌群与辅助文案（对比度 7.1:1），平衡暖光摄影不发黄浊。',
  },
  {
    role: '10% 唯一品牌强调 · Warm Signal Orange',
    name: '暖光运动橙',
    hex: '#D44E24',
    usage: '主开练按钮、完成本动作、已完成进度线、底部激活态与月历节点；12px 小字校准为 #B83E18。',
  },
  {
    role: '克制辅助冷色 · Quiet Coastal Slate',
    name: '静谧辅色灰蓝',
    hex: '#415A72',
    usage: '仅用于暂停余量、休息微调提示与晨光摄影天光中和，不参与主操作竞争。',
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
    font: 'Plus Jakarta Sans + PingFang SC',
    spec: '31px / 26px · SemiBold 600 · 行高 1.15 · -0.02em',
    sample: '全身哑铃力量循环',
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
    title: '01 · 首页晨光 Hero 与 Horizon 操作坞',
    detail:
      '力量、有氧、恢复三种课程共用同一套 #F9F7F3 / #D44E24 / #191D22 排版与操作骨架，仅以动作摄影与节律文案区分发力专注、有氧动态与舒展感。',
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
    title: '04 · 浅色悬浮底栏与清爽训练档案',
    detail:
      '去掉厚重深色底栏与黑色药丸：首页、训练档案与单次详情统一采用暖白半透悬浮胶囊，选中态以浅米白胶囊、细描边与橙色小下划线轻盈表达；档案页延续精密数据带与逐轮实录明细。',
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
