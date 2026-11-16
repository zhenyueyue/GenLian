import { HistorySessionRecord } from '../../data/appRecords';
import { ExerciseItem, WorkoutPhase } from '../../types/design';

export type MoodId = 'daylight' | 'airy' | 'dynamic';

export interface MoodMediaAsset {
  wideUrl: string;
  playerVertUrl: string;
  focalClass?: string;
}

export interface MoodThemeConfig {
  id: MoodId;
  code: 'A' | 'B' | 'C';
  nameZh: string;
  nameEn: string;
  tagline: string;
  summary: string;
  paletteSwatches: { label: string; hex: string }[];
  lightingSpec: string;
  restBehaviorSpec: string;

  // 核心画布与文字色板
  canvasBg: string;
  surfaceBg: string;
  surfaceElevatedBg: string;
  hairlineBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentContrastText: string;
  warning: string;

  // 主操作按钮（Today / Detail / Player / Summary）
  primaryCtaBg: string;
  primaryCtaText: string;
  primaryCtaHoverBg: string;
  secondaryBtnBg: string;
  secondaryBtnBorder: string;
  secondaryBtnText: string;

  // Today Hero 与 Horizon（C 方向采用石墨基座形成高反差竞技节奏，A/B 采用通透日光融接）
  todayHeroTopScrim: string;
  todayHeroBottomGradient: string;
  todayHeroTitleColor: string;
  todayHeroKickerColor: string;
  todayHeroMetaColor: string;
  todayHeroMetaAccent: string;
  todayHorizonBg: string;
  todayHorizonBorder: string;
  todayHorizonIntentColor: string;
  todayHorizonPrimaryBg: string;
  todayHorizonPrimaryText: string;
  todayHorizonSecondaryBg: string;
  todayHorizonSecondaryBorder: string;
  todayHorizonSecondaryText: string;
  todayDockedHeaderBg: string;
  todayDockedHeaderText: string;
  todayDockedHeaderSub: string;
  todayDockedBtnBg: string;
  todayDockedBtnText: string;
  todayUndockedSetupBg: string;
  todayUndockedSetupText: string;

  // 播放器全屏舞台光影与控件材质
  playerImageFilterClass: string;
  playerTopScrim: string;
  playerBottomScrimActive: string;
  playerBottomScrimOverlay: string;
  playerActiveTextPrimary: string;
  playerActiveTextSecondary: string;
  playerActiveAccentText: string;
  playerActiveTextShadow: string;
  playerGlassBg: string;
  playerGlassBorder: string;
  playerGlassText: string;
  playerProgressDone: string;
  playerProgressCurrent: string;
  playerProgressPending: string;
  playerPrimaryCtaBg: string;
  playerPrimaryCtaText: string;

  // 休息阶段平滑降亮过渡（非突兀黑屏）
  restDimFilterClass: string;
  restDimVeilClass: string;
  restPreviewCardBg: string;
  restPreviewCardBorder: string;
  restTextPrimary: string;
  restTextSecondary: string;
  restAccentText: string;
  restProgressTrack: string;
  restProgressFill: string;
  restPrimaryCtaBg: string;
  restPrimaryCtaText: string;
  restSecondaryBtnBg: string;
  restSecondaryBtnBorder: string;
  restSecondaryBtnText: string;

  // 底部主导航栏
  bottomNavBg: string;
  bottomNavBorder: string;
  bottomNavActive: string;
  bottomNavInactive: string;
  bottomNavCenterAccent: string;

  // 单次训练详情 & 总结大气头图过渡
  detailHeaderBg: string;
  detailHeaderOverlay: string;
  detailHeaderTitle: string;
  detailHeaderMeta: string;
  detailHeaderAccent: string;

  // 照片集与统一调色滤镜
  photoToneFilterClass: string;
  photoToneTintClass: string;
  planMedia: Record<
    string,
    {
      heroUrl: string;
      wideUrl: string;
      kicker: string;
      intentLine: string;
    }
  >;
  exerciseMedia: Record<string, MoodMediaAsset>;

  // 设备状态栏深浅
  getStatusBarTone: (
    phase: WorkoutPhase,
    activeScreen: 'today' | 'history',
    hasDetail: boolean,
    hasHistoryDetail: boolean
  ) => 'light' | 'dark';
}

const MOOD_A_FLOOR_PRESS: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_wide_floor_press_1794682426679.jpg',
  playerVertUrl: '/src/assets/images/mood_a_player_floor_press_1794682423173.jpg',
  focalClass: 'object-[50%_54%]',
};

const MOOD_A_SINGLE_ROW: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_wide_single_row_1794682426537.jpg',
  playerVertUrl: '/src/assets/images/mood_a_player_single_row_1794682425212.jpg',
  focalClass: 'object-[50%_42%]',
};

const MOOD_A_GOBLET_SQUAT: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_player_goblet_squat_1794682424502.jpg',
  playerVertUrl: '/src/assets/images/mood_a_player_goblet_squat_1794682424502.jpg',
  focalClass: 'object-[50%_38%]',
};

const MOOD_A_DEAD_BUG: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_player_dead_bug_1794682424533.jpg',
  playerVertUrl: '/src/assets/images/mood_a_player_dead_bug_1794682424533.jpg',
  focalClass: 'object-[50%_60%]',
};

const MOOD_A_SHOULDER: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_wide_shoulder_1794682427190.jpg',
  playerVertUrl: '/src/assets/images/mood_a_wide_shoulder_1794682427190.jpg',
  focalClass: 'object-[50%_40%]',
};

const MOOD_A_RECOVERY: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_wide_recovery_1794682427795.jpg',
  playerVertUrl: '/src/assets/images/mood_a_wide_recovery_1794682427795.jpg',
  focalClass: 'object-[50%_45%]',
};

// Mood B: Nordic coastal sky-white studio
const MOOD_B_FLOOR_PRESS: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_b_player_floor_press_1794682428342.jpg',
  playerVertUrl: '/src/assets/images/mood_b_player_floor_press_1794682428342.jpg',
  focalClass: 'object-[50%_55%]',
};

const MOOD_B_SINGLE_ROW: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_b_player_single_row_1794682429363.jpg',
  playerVertUrl: '/src/assets/images/mood_b_player_single_row_1794682429363.jpg',
  focalClass: 'object-[50%_48%]',
};

const MOOD_B_GOBLET_SQUAT: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_c_player_goblet_squat_1794682435233.jpg',
  playerVertUrl: '/src/assets/images/mood_c_player_goblet_squat_1794682435233.jpg',
  focalClass: 'object-[50%_48%]',
};

const MOOD_B_DEAD_BUG: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_c_player_dead_bug_1794682434923.jpg',
  playerVertUrl: '/src/assets/images/mood_c_player_dead_bug_1794682434923.jpg',
  focalClass: 'object-[50%_62%]',
};

const MOOD_B_SHOULDER: MoodMediaAsset = {
  wideUrl: '/src/assets/images/workout_press_minimal_1794666142530.jpg',
  playerVertUrl: '/src/assets/images/workout_press_minimal_1794666142530.jpg',
  focalClass: 'object-[50%_38%]',
};

const MOOD_B_RECOVERY: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_a_wide_recovery_1794682427795.jpg',
  playerVertUrl: '/src/assets/images/mood_a_wide_recovery_1794682427795.jpg',
  focalClass: 'object-[50%_46%]',
};

// Mood C: Bright skylight concrete athletic loft
const MOOD_C_FLOOR_PRESS: MoodMediaAsset = {
  wideUrl: '/src/assets/images/editorial_floor_press_1794674653915.jpg',
  playerVertUrl: '/src/assets/images/editorial_floor_press_1794674653915.jpg',
  focalClass: 'object-[50%_52%]',
};

const MOOD_C_SINGLE_ROW: MoodMediaAsset = {
  wideUrl: '/src/assets/images/editorial_single_row_1794674654582.jpg',
  playerVertUrl: '/src/assets/images/editorial_single_row_1794674654582.jpg',
  focalClass: 'object-[50%_46%]',
};

const MOOD_C_GOBLET_SQUAT: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_c_player_goblet_squat_1794682435233.jpg',
  playerVertUrl: '/src/assets/images/mood_c_player_goblet_squat_1794682435233.jpg',
  focalClass: 'object-[50%_48%]',
};

const MOOD_C_DEAD_BUG: MoodMediaAsset = {
  wideUrl: '/src/assets/images/mood_c_player_dead_bug_1794682434923.jpg',
  playerVertUrl: '/src/assets/images/mood_c_player_dead_bug_1794682434923.jpg',
  focalClass: 'object-[50%_62%]',
};

const MOOD_C_SHOULDER: MoodMediaAsset = {
  wideUrl: '/src/assets/images/workout_press_minimal_1794666142530.jpg',
  playerVertUrl: '/src/assets/images/workout_press_minimal_1794666142530.jpg',
  focalClass: 'object-[50%_38%]',
};

const MOOD_C_RECOVERY: MoodMediaAsset = {
  wideUrl: '/src/assets/images/editorial_goblet_squat_1794674655868.jpg',
  playerVertUrl: '/src/assets/images/editorial_goblet_squat_1794674655868.jpg',
  focalClass: 'object-[50%_45%]',
};

export const MOOD_THEMES: Record<MoodId, MoodThemeConfig> = {
  daylight: {
    id: 'daylight',
    code: 'A',
    nameZh: '日光运动',
    nameEn: 'Daylight Athletics',
    tagline: '暖白 · 浅石灰 · 深石墨 · 克制活力橙',
    summary:
      '清晨自然光照进温润石灰岩与浅橡木空间，全界面以暖白画布与深石墨排版取代黑夜压抑感，活力橙仅克制点亮训练进度与发力节点。',
    paletteSwatches: [
      { label: '暖白画布', hex: '#FAF7F2' },
      { label: '浅石灰面', hex: '#EFECE3' },
      { label: '深石墨字', hex: '#1E201D' },
      { label: '活力橙点缀', hex: '#E05A2B' },
    ],
    lightingSpec: '自然晨光穿透亚麻窗纱，暖调橡木地板反光提亮皮肤与肌群纹理，零重黑暗角。',
    restBehaviorSpec: '动作舞台平滑降至 44% 亮度并叠加暖炭薄纱，大号白字与活力橙细进度线自然进入恢复节奏。',

    canvasBg: '#FAF7F2',
    surfaceBg: '#EFECE3',
    surfaceElevatedBg: '#E6E1D6',
    hairlineBorder: 'rgba(30, 32, 29, 0.10)',
    textPrimary: '#1E201D',
    textSecondary: '#4F524B',
    textMuted: '#73766D',
    accent: '#E05A2B',
    accentSoft: 'rgba(224, 90, 43, 0.12)',
    accentContrastText: '#FFFFFF',
    warning: '#C96A1B',

    primaryCtaBg: '#1E201D',
    primaryCtaText: '#FAF7F2',
    primaryCtaHoverBg: '#31342F',
    secondaryBtnBg: '#EFECE3',
    secondaryBtnBorder: 'rgba(30, 32, 29, 0.12)',
    secondaryBtnText: '#1E201D',

    todayHeroTopScrim: 'linear-gradient(180deg, rgba(250,247,242,0.72) 0%, rgba(250,247,242,0.18) 65%, rgba(250,247,242,0) 100%)',
    todayHeroBottomGradient:
      'linear-gradient(180deg, rgba(250,247,242,0) 0%, rgba(250,247,242,0) 56%, rgba(250,247,242,0.78) 84%, #FAF7F2 100%)',
    todayHeroTitleColor: '#1E201D',
    todayHeroKickerColor: '#C94B20',
    todayHeroMetaColor: '#4F524B',
    todayHeroMetaAccent: '#C94B20',
    todayHorizonBg: '#FAF7F2',
    todayHorizonBorder: 'rgba(30, 32, 29, 0.10)',
    todayHorizonIntentColor: '#4F524B',
    todayHorizonPrimaryBg: '#E05A2B',
    todayHorizonPrimaryText: '#FFFFFF',
    todayHorizonSecondaryBg: '#EFECE3',
    todayHorizonSecondaryBorder: 'rgba(30, 32, 29, 0.12)',
    todayHorizonSecondaryText: '#1E201D',
    todayDockedHeaderBg: 'rgba(250, 247, 242, 0.92)',
    todayDockedHeaderText: '#1E201D',
    todayDockedHeaderSub: '#6B6E65',
    todayDockedBtnBg: '#E05A2B',
    todayDockedBtnText: '#FFFFFF',
    todayUndockedSetupBg: 'rgba(250, 247, 242, 0.78)',
    todayUndockedSetupText: '#1E201D',

    playerImageFilterClass: 'brightness-[1.01] saturate-[1.03]',
    playerTopScrim: 'linear-gradient(180deg, rgba(250,247,242,0.68) 0%, rgba(250,247,242,0.16) 58%, rgba(250,247,242,0) 100%)',
    playerBottomScrimActive: 'linear-gradient(180deg, rgba(250,247,242,0) 0%, rgba(250,247,242,0.58) 46%, rgba(250,247,242,0.94) 100%)',
    playerBottomScrimOverlay: 'linear-gradient(180deg, rgba(30,32,29,0) 0%, rgba(30,32,29,0.52) 60%, rgba(30,32,29,0.78) 100%)',
    playerActiveTextPrimary: '#1E201D',
    playerActiveTextSecondary: '#43463F',
    playerActiveAccentText: '#C94B20',
    playerActiveTextShadow: 'none',
    playerGlassBg: 'rgba(250, 247, 242, 0.78)',
    playerGlassBorder: 'rgba(30, 32, 29, 0.14)',
    playerGlassText: '#1E201D',
    playerProgressDone: '#E05A2B',
    playerProgressCurrent: '#1E201D',
    playerProgressPending: 'rgba(30, 32, 29, 0.20)',
    playerPrimaryCtaBg: '#1E201D',
    playerPrimaryCtaText: '#FAF7F2',

    restDimFilterClass: 'scale-[1.025] brightness-[0.44] saturate-[0.72]',
    restDimVeilClass: 'bg-[#211E1A]/48',
    restPreviewCardBg: 'rgba(250, 247, 242, 0.92)',
    restPreviewCardBorder: 'rgba(30, 32, 29, 0.12)',
    restTextPrimary: '#FAF7F2',
    restTextSecondary: '#DFD9CE',
    restAccentText: '#FF8A5C',
    restProgressTrack: 'rgba(250, 247, 242, 0.24)',
    restProgressFill: '#E05A2B',
    restPrimaryCtaBg: '#FAF7F2',
    restPrimaryCtaText: '#1E201D',
    restSecondaryBtnBg: 'rgba(250, 247, 242, 0.16)',
    restSecondaryBtnBorder: 'rgba(250, 247, 242, 0.24)',
    restSecondaryBtnText: '#FAF7F2',

    bottomNavBg: 'rgba(250, 247, 242, 0.92)',
    bottomNavBorder: 'rgba(30, 32, 29, 0.10)',
    bottomNavActive: '#1E201D',
    bottomNavInactive: '#73766D',
    bottomNavCenterAccent: '#E05A2B',

    detailHeaderBg: '#EFECE3',
    detailHeaderOverlay:
      'linear-gradient(180deg, rgba(250,247,242,0.58) 0%, rgba(250,247,242,0) 35%, rgba(250,247,242,0.82) 82%, #FAF7F2 100%)',
    detailHeaderTitle: '#1E201D',
    detailHeaderMeta: '#4F524B',
    detailHeaderAccent: '#C94B20',

    photoToneFilterClass: 'brightness-[1.02] saturate-[1.02]',
    photoToneTintClass: 'bg-transparent',
    planMedia: {
      'strength-a': {
        heroUrl: MOOD_A_FLOOR_PRESS.playerVertUrl,
        wideUrl: MOOD_A_FLOOR_PRESS.wideUrl,
        kicker: '力量 A · 全身基础',
        intentLine: '晨光下的胸推、划船与深蹲复合循环，保持呼吸与核心稳定。',
      },
      'strength-b': {
        heroUrl: MOOD_A_SHOULDER.wideUrl,
        wideUrl: MOOD_A_SHOULDER.wideUrl,
        kicker: '力量 B · 肩背与后链',
        intentLine: '偏轻可控配重，专注肩中束线条与髋铰链动作质量。',
      },
      cardio: {
        heroUrl: MOOD_A_GOBLET_SQUAT.playerVertUrl,
        wideUrl: MOOD_A_GOBLET_SQUAT.wideUrl,
        kicker: '有氧 · 轻负重代谢',
        intentLine: '30 秒短间歇流畅衔接，在明亮节奏里平稳抬升心率。',
      },
      recovery: {
        heroUrl: MOOD_A_RECOVERY.wideUrl,
        wideUrl: MOOD_A_RECOVERY.wideUrl,
        kicker: '恢复日 · 舒展与呼吸',
        intentLine: '释放胸椎与髋部紧绷感，让身体保有轻盈余量。',
      },
    },
    exerciseMedia: {
      'ex-floor-press': MOOD_A_FLOOR_PRESS,
      'ex-floor-press-cardio': MOOD_A_FLOOR_PRESS,
      'ex-single-row': MOOD_A_SINGLE_ROW,
      'ex-row-cardio': MOOD_A_SINGLE_ROW,
      'ex-goblet-squat': MOOD_A_GOBLET_SQUAT,
      'ex-goblet-cardio': MOOD_A_GOBLET_SQUAT,
      'ex-dead-bug': MOOD_A_DEAD_BUG,
      'ex-dead-bug-b': MOOD_A_DEAD_BUG,
      'ex-core-cardio': MOOD_A_DEAD_BUG,
      'ex-dead-bug-rec': MOOD_A_DEAD_BUG,
      'ex-shoulder-press': MOOD_A_SHOULDER,
      'ex-lateral-raise': MOOD_A_SHOULDER,
      'ex-rdl': MOOD_A_SINGLE_ROW,
      'ex-thoracic': MOOD_A_RECOVERY,
    },
    getStatusBarTone: (phase) =>
      phase === 'rest' || phase === 'prepare' || phase === 'nextTransition' || phase === 'setComplete'
        ? 'light'
        : 'dark',
  },

  airy: {
    id: 'airy',
    code: 'B',
    nameZh: '清透运动',
    nameEn: 'Airy Performance',
    tagline: '冷白 · 浅蓝灰 · 深海蓝 · 少量暖意',
    summary:
      '北欧海岸漫射天光与磨砂玻璃空间，用冷白与浅蓝灰建立舒展呼吸感，深海蓝锚定专业秩序，一点暖杏铜唤醒训练完成时刻。',
    paletteSwatches: [
      { label: '冷白画布', hex: '#F5F8FB' },
      { label: '浅蓝灰面', hex: '#E8EEF5' },
      { label: '深海蓝字', hex: '#13293D' },
      { label: '暖杏铜点缀', hex: '#D97943' },
    ],
    lightingSpec: '高窗海岸天光漫射，冷白混凝土与深海蓝运动服形成通透干净的身体轮廓与空间空气感。',
    restBehaviorSpec: '舞台平稳压暗至深海蓝暮光（非死黑），清澈白色倒计时与暖杏铜呼吸线带来松弛感。',

    canvasBg: '#F5F8FB',
    surfaceBg: '#E8EEF5',
    surfaceElevatedBg: '#DCE5F0',
    hairlineBorder: 'rgba(19, 41, 61, 0.10)',
    textPrimary: '#13293D',
    textSecondary: '#3C546B',
    textMuted: '#637A90',
    accent: '#D97943',
    accentSoft: 'rgba(217, 121, 67, 0.14)',
    accentContrastText: '#FFFFFF',
    warning: '#C96A32',

    primaryCtaBg: '#13293D',
    primaryCtaText: '#F5F8FB',
    primaryCtaHoverBg: '#1C3B57',
    secondaryBtnBg: '#E8EEF5',
    secondaryBtnBorder: 'rgba(19, 41, 61, 0.12)',
    secondaryBtnText: '#13293D',

    todayHeroTopScrim: 'linear-gradient(180deg, rgba(245,248,251,0.72) 0%, rgba(245,248,251,0.18) 65%, rgba(245,248,251,0) 100%)',
    todayHeroBottomGradient:
      'linear-gradient(180deg, rgba(245,248,251,0) 0%, rgba(245,248,251,0) 56%, rgba(245,248,251,0.8) 84%, #F5F8FB 100%)',
    todayHeroTitleColor: '#13293D',
    todayHeroKickerColor: '#25527A',
    todayHeroMetaColor: '#3C546B',
    todayHeroMetaAccent: '#C6632C',
    todayHorizonBg: '#F5F8FB',
    todayHorizonBorder: 'rgba(19, 41, 61, 0.10)',
    todayHorizonIntentColor: '#3C546B',
    todayHorizonPrimaryBg: '#13293D',
    todayHorizonPrimaryText: '#F5F8FB',
    todayHorizonSecondaryBg: '#E8EEF5',
    todayHorizonSecondaryBorder: 'rgba(19, 41, 61, 0.12)',
    todayHorizonSecondaryText: '#13293D',
    todayDockedHeaderBg: 'rgba(245, 248, 251, 0.92)',
    todayDockedHeaderText: '#13293D',
    todayDockedHeaderSub: '#637A90',
    todayDockedBtnBg: '#13293D',
    todayDockedBtnText: '#F5F8FB',
    todayUndockedSetupBg: 'rgba(245, 248, 251, 0.80)',
    todayUndockedSetupText: '#13293D',

    playerImageFilterClass: 'brightness-[1.02] saturate-[0.92] contrast-[0.98]',
    playerTopScrim: 'linear-gradient(180deg, rgba(245,248,251,0.70) 0%, rgba(245,248,251,0.18) 58%, rgba(245,248,251,0) 100%)',
    playerBottomScrimActive: 'linear-gradient(180deg, rgba(245,248,251,0) 0%, rgba(245,248,251,0.62) 46%, rgba(245,248,251,0.95) 100%)',
    playerBottomScrimOverlay: 'linear-gradient(180deg, rgba(19,41,61,0) 0%, rgba(19,41,61,0.58) 60%, rgba(19,41,61,0.82) 100%)',
    playerActiveTextPrimary: '#13293D',
    playerActiveTextSecondary: '#3C546B',
    playerActiveAccentText: '#C6632C',
    playerActiveTextShadow: 'none',
    playerGlassBg: 'rgba(245, 248, 251, 0.80)',
    playerGlassBorder: 'rgba(19, 41, 61, 0.14)',
    playerGlassText: '#13293D',
    playerProgressDone: '#D97943',
    playerProgressCurrent: '#13293D',
    playerProgressPending: 'rgba(19, 41, 61, 0.18)',
    playerPrimaryCtaBg: '#13293D',
    playerPrimaryCtaText: '#F5F8FB',

    restDimFilterClass: 'scale-[1.025] brightness-[0.42] saturate-[0.68]',
    restDimVeilClass: 'bg-[#0F2234]/56',
    restPreviewCardBg: 'rgba(245, 248, 251, 0.94)',
    restPreviewCardBorder: 'rgba(19, 41, 61, 0.12)',
    restTextPrimary: '#F5F8FB',
    restTextSecondary: '#D2DFEC',
    restAccentText: '#F09866',
    restProgressTrack: 'rgba(245, 248, 251, 0.24)',
    restProgressFill: '#D97943',
    restPrimaryCtaBg: '#F5F8FB',
    restPrimaryCtaText: '#13293D',
    restSecondaryBtnBg: 'rgba(245, 248, 251, 0.16)',
    restSecondaryBtnBorder: 'rgba(245, 248, 251, 0.26)',
    restSecondaryBtnText: '#F5F8FB',

    bottomNavBg: 'rgba(245, 248, 251, 0.92)',
    bottomNavBorder: 'rgba(19, 41, 61, 0.10)',
    bottomNavActive: '#13293D',
    bottomNavInactive: '#637A90',
    bottomNavCenterAccent: '#D97943',

    detailHeaderBg: '#E8EEF5',
    detailHeaderOverlay:
      'linear-gradient(180deg, rgba(245,248,251,0.58) 0%, rgba(245,248,251,0) 35%, rgba(245,248,251,0.82) 82%, #F5F8FB 100%)',
    detailHeaderTitle: '#13293D',
    detailHeaderMeta: '#3C546B',
    detailHeaderAccent: '#C6632C',

    photoToneFilterClass: 'brightness-[1.03] saturate-[0.86] hue-rotate-[-6deg]',
    photoToneTintClass: 'bg-[#DCE9F7]/14',
    planMedia: {
      'strength-a': {
        heroUrl: MOOD_B_FLOOR_PRESS.playerVertUrl,
        wideUrl: MOOD_B_FLOOR_PRESS.wideUrl,
        kicker: '力量 A · 全身基础',
        intentLine: '清透日光中的均衡复合训练，专注节奏控制与舒展发力。',
      },
      'strength-b': {
        heroUrl: MOOD_B_SHOULDER.wideUrl,
        wideUrl: MOOD_B_SHOULDER.wideUrl,
        kicker: '力量 B · 肩背与后链',
        intentLine: '轻盈可控配重，在清晰天光下精准打磨肩背线条。',
      },
      cardio: {
        heroUrl: MOOD_B_GOBLET_SQUAT.playerVertUrl,
        wideUrl: MOOD_B_GOBLET_SQUAT.wideUrl,
        kicker: '有氧 · 轻负重代谢',
        intentLine: '30 秒呼吸循环衔接，清爽不闷热的有氧心肺律动。',
      },
      recovery: {
        heroUrl: MOOD_B_RECOVERY.wideUrl,
        wideUrl: MOOD_B_RECOVERY.wideUrl,
        kicker: '恢复日 · 舒展与呼吸',
        intentLine: '温和开启胸椎与髋关节，保持身体舒展通透。',
      },
    },
    exerciseMedia: {
      'ex-floor-press': MOOD_B_FLOOR_PRESS,
      'ex-floor-press-cardio': MOOD_B_FLOOR_PRESS,
      'ex-single-row': MOOD_B_SINGLE_ROW,
      'ex-row-cardio': MOOD_B_SINGLE_ROW,
      'ex-goblet-squat': MOOD_B_GOBLET_SQUAT,
      'ex-goblet-cardio': MOOD_B_GOBLET_SQUAT,
      'ex-dead-bug': MOOD_B_DEAD_BUG,
      'ex-dead-bug-b': MOOD_B_DEAD_BUG,
      'ex-core-cardio': MOOD_B_DEAD_BUG,
      'ex-dead-bug-rec': MOOD_B_DEAD_BUG,
      'ex-shoulder-press': MOOD_B_SHOULDER,
      'ex-lateral-raise': MOOD_B_SHOULDER,
      'ex-rdl': MOOD_B_SINGLE_ROW,
      'ex-thoracic': MOOD_B_RECOVERY,
    },
    getStatusBarTone: (phase) =>
      phase === 'rest' || phase === 'prepare' || phase === 'nextTransition' || phase === 'setComplete'
        ? 'light'
        : 'dark',
  },

  dynamic: {
    id: 'dynamic',
    code: 'C',
    nameZh: '活力竞技',
    nameEn: 'Dynamic Studio',
    tagline: '中性石墨灰 · 钴蓝 · 珊瑚橙',
    summary:
      '顶部天窗透亮的现代混凝土训练俱乐部美学：用中调石墨基座承接高反差运动舞台，钴蓝锁定主行动线，珊瑚橙标记次数与节奏爆发点。',
    paletteSwatches: [
      { label: '训练石膏白', hex: '#F2F4F7' },
      { label: '中性石墨灰', hex: '#262A31' },
      { label: '竞技钴蓝', hex: '#2356D8' },
      { label: '珊瑚橙节奏', hex: '#EE5A3A' },
    ],
    lightingSpec: '工业天窗直射漫射日光、清晰水泥肌理与地面钴蓝场线，对比鲜明但绝非暗黑健身房。',
    restBehaviorSpec: '中性石墨灰冷调降亮收束，珊瑚橙进度线与明快预备卡形成清晰的发力-恢复交替韵律。',

    canvasBg: '#F2F4F7',
    surfaceBg: '#E5E8EE',
    surfaceElevatedBg: '#D8DCE5',
    hairlineBorder: 'rgba(30, 34, 42, 0.11)',
    textPrimary: '#1D2026',
    textSecondary: '#4B515E',
    textMuted: '#6D7482',
    accent: '#2356D8',
    accentSoft: 'rgba(35, 86, 216, 0.11)',
    accentContrastText: '#FFFFFF',
    warning: '#EE5A3A',

    primaryCtaBg: '#2356D8',
    primaryCtaText: '#FFFFFF',
    primaryCtaHoverBg: '#1B46B5',
    secondaryBtnBg: '#E5E8EE',
    secondaryBtnBorder: 'rgba(30, 34, 42, 0.14)',
    secondaryBtnText: '#1D2026',

    // C 方向的特色明暗对比：亮天窗建筑照片 -> 沉稳中性石墨地平线区 -> 亮石灰训练动作流
    todayHeroTopScrim: 'linear-gradient(180deg, rgba(242,244,247,0.68) 0%, rgba(242,244,247,0.14) 60%, rgba(242,244,247,0) 100%)',
    todayHeroBottomGradient:
      'linear-gradient(180deg, rgba(38,42,49,0) 0%, rgba(38,42,49,0) 56%, rgba(38,42,49,0.78) 84%, #262A31 100%)',
    todayHeroTitleColor: '#FFFFFF',
    todayHeroKickerColor: '#FF8468',
    todayHeroMetaColor: '#D6DAE2',
    todayHeroMetaAccent: '#7CA3FF',
    todayHorizonBg: '#262A31',
    todayHorizonBorder: 'rgba(255, 255, 255, 0.10)',
    todayHorizonIntentColor: '#CFD4DE',
    todayHorizonPrimaryBg: '#2356D8',
    todayHorizonPrimaryText: '#FFFFFF',
    todayHorizonSecondaryBg: 'rgba(255, 255, 255, 0.10)',
    todayHorizonSecondaryBorder: 'rgba(255, 255, 255, 0.16)',
    todayHorizonSecondaryText: '#F4F6F9',
    todayDockedHeaderBg: 'rgba(38, 42, 49, 0.94)',
    todayDockedHeaderText: '#FFFFFF',
    todayDockedHeaderSub: '#B7BECC',
    todayDockedBtnBg: '#2356D8',
    todayDockedBtnText: '#FFFFFF',
    todayUndockedSetupBg: 'rgba(38, 42, 49, 0.72)',
    todayUndockedSetupText: '#FFFFFF',

    playerImageFilterClass: 'contrast-[1.06] saturate-[0.95] brightness-[0.98]',
    playerTopScrim: 'linear-gradient(180deg, rgba(30,34,40,0.48) 0%, rgba(30,34,40,0.12) 60%, rgba(30,34,40,0) 100%)',
    playerBottomScrimActive: 'linear-gradient(180deg, rgba(30,34,40,0) 0%, rgba(30,34,40,0.46) 44%, rgba(28,31,37,0.86) 100%)',
    playerBottomScrimOverlay: 'linear-gradient(180deg, rgba(28,31,37,0) 0%, rgba(28,31,37,0.58) 55%, rgba(28,31,37,0.85) 100%)',
    playerActiveTextPrimary: '#FFFFFF',
    playerActiveTextSecondary: '#DCE1EB',
    playerActiveAccentText: '#FF8468',
    playerActiveTextShadow: '0 2px 10px rgba(0,0,0,0.65)',
    playerGlassBg: 'rgba(38, 42, 49, 0.68)',
    playerGlassBorder: 'rgba(255, 255, 255, 0.18)',
    playerGlassText: '#FFFFFF',
    playerProgressDone: '#EE5A3A',
    playerProgressCurrent: '#FFFFFF',
    playerProgressPending: 'rgba(255, 255, 255, 0.28)',
    playerPrimaryCtaBg: '#2356D8',
    playerPrimaryCtaText: '#FFFFFF',

    restDimFilterClass: 'scale-[1.025] brightness-[0.38] saturate-[0.65]',
    restDimVeilClass: 'bg-[#1C1F26]/58',
    restPreviewCardBg: 'rgba(38, 42, 49, 0.88)',
    restPreviewCardBorder: 'rgba(255, 255, 255, 0.16)',
    restTextPrimary: '#FFFFFF',
    restTextSecondary: '#CFD5E1',
    restAccentText: '#FF8468',
    restProgressTrack: 'rgba(255, 255, 255, 0.22)',
    restProgressFill: '#EE5A3A',
    restPrimaryCtaBg: '#2356D8',
    restPrimaryCtaText: '#FFFFFF',
    restSecondaryBtnBg: 'rgba(38, 42, 49, 0.72)',
    restSecondaryBtnBorder: 'rgba(255, 255, 255, 0.18)',
    restSecondaryBtnText: '#FFFFFF',

    bottomNavBg: 'rgba(242, 244, 247, 0.94)',
    bottomNavBorder: 'rgba(30, 34, 42, 0.10)',
    bottomNavActive: '#1D2026',
    bottomNavInactive: '#6D7482',
    bottomNavCenterAccent: '#2356D8',

    detailHeaderBg: '#262A31',
    detailHeaderOverlay:
      'linear-gradient(180deg, rgba(38,42,49,0.52) 0%, rgba(38,42,49,0) 36%, rgba(38,42,49,0.82) 82%, #262A31 100%)',
    detailHeaderTitle: '#FFFFFF',
    detailHeaderMeta: '#CFD4DE',
    detailHeaderAccent: '#FF8468',

    photoToneFilterClass: 'contrast-[1.06] saturate-[0.94]',
    photoToneTintClass: 'bg-[#2356D8]/5',
    planMedia: {
      'strength-a': {
        heroUrl: MOOD_C_GOBLET_SQUAT.playerVertUrl,
        wideUrl: MOOD_C_FLOOR_PRESS.wideUrl,
        kicker: '力量 A · 全身基础',
        intentLine: '明快混凝土训练馆内的复合节奏循环，稳定发力推进每一组。',
      },
      'strength-b': {
        heroUrl: MOOD_C_SHOULDER.wideUrl,
        wideUrl: MOOD_C_SHOULDER.wideUrl,
        kicker: '力量 B · 肩背与后链',
        intentLine: '干脆利落的上肢推拉与后链铰链，强化动作质感。',
      },
      cardio: {
        heroUrl: MOOD_C_GOBLET_SQUAT.playerVertUrl,
        wideUrl: MOOD_C_GOBLET_SQUAT.wideUrl,
        kicker: '有氧 · 轻负重代谢',
        intentLine: '30 秒高频转换节奏，点燃心肺与下肢动力。',
      },
      recovery: {
        heroUrl: MOOD_C_RECOVERY.wideUrl,
        wideUrl: MOOD_C_RECOVERY.wideUrl,
        kicker: '恢复日 · 舒展与呼吸',
        intentLine: '重新校准关节活动度，让每一次发力更高效。',
      },
    },
    exerciseMedia: {
      'ex-floor-press': MOOD_C_FLOOR_PRESS,
      'ex-floor-press-cardio': MOOD_C_FLOOR_PRESS,
      'ex-single-row': MOOD_C_SINGLE_ROW,
      'ex-row-cardio': MOOD_C_SINGLE_ROW,
      'ex-goblet-squat': MOOD_C_GOBLET_SQUAT,
      'ex-goblet-cardio': MOOD_C_GOBLET_SQUAT,
      'ex-dead-bug': MOOD_C_DEAD_BUG,
      'ex-dead-bug-b': MOOD_C_DEAD_BUG,
      'ex-core-cardio': MOOD_C_DEAD_BUG,
      'ex-dead-bug-rec': MOOD_C_DEAD_BUG,
      'ex-shoulder-press': MOOD_C_SHOULDER,
      'ex-lateral-raise': MOOD_C_SHOULDER,
      'ex-rdl': MOOD_C_SINGLE_ROW,
      'ex-thoracic': MOOD_C_RECOVERY,
    },
    getStatusBarTone: (phase, activeScreen, hasDetail, hasHistoryDetail) => {
      if (phase !== 'today') return 'light';
      if (hasDetail || hasHistoryDetail) return 'light';
      return activeScreen === 'today' ? 'dark' : 'dark';
    },
  },
};

export function getMoodExerciseMedia(theme: MoodThemeConfig, exercise: ExerciseItem): MoodMediaAsset {
  return theme.exerciseMedia[exercise.id] ?? theme.exerciseMedia['ex-floor-press'];
}

export function getMoodArchiveStill(theme: MoodThemeConfig, rec: HistorySessionRecord): string {
  const media = theme.planMedia[rec.planId];
  if (media) return media.wideUrl;
  return theme.exerciseMedia['ex-floor-press'].wideUrl;
}
