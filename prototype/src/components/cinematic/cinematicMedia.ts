import { HistorySessionRecord } from '../../data/appRecords';

export type CinematicScreen = 'today' | 'history';

/**
 * 电影级沉浸视觉（Cinematic Fitness）专属剧照与封面映射：
 * - 优先使用统一暗调 35mm 胶片光影剧照作为课程海报与档案封面
 * - 训练进行中仍严格优先使用真实动作示范视频（若开启测试流）或已核验的动作姿态参考图，确保动作教学准确
 */
export const CINEMA_POSTER_BY_PLAN: Record<
  string,
  {
    heroPosterUrl: string;
    widescreenStillUrl: string;
    filmKicker: string;
    moodLine: string;
  }
> = {
  'strength-a': {
    heroPosterUrl: '/src/assets/images/cinema_hero_strength_a_1794679401192.jpg',
    widescreenStillUrl: '/src/assets/images/demo_floor_press_1794667630997.jpg',
    filmKicker: '力与控制 · 精选循环',
    moodLine: '在安静的夜晚灯光下，用四组经典复合推拉建立全身线条',
  },
  'strength-b': {
    heroPosterUrl: '/src/assets/images/cinema_still_strength_b_1794679401973.jpg',
    widescreenStillUrl: '/src/assets/images/cinema_still_strength_b_1794679401973.jpg',
    filmKicker: '肩背雕刻 · 后链张力',
    moodLine: '偏轻可控配重，以慢速离心雕刻肩部轮廓与背部厚度',
  },
  cardio: {
    heroPosterUrl: '/src/assets/images/cinema_still_cardio_1794679401520.jpg',
    widescreenStillUrl: '/src/assets/images/cinema_still_cardio_1794679401520.jpg',
    filmKicker: '代谢节奏 · 30s 短歇流',
    moodLine: '轻负重连续转换，拉升心肺耐力而不牺牲动作幅度',
  },
  recovery: {
    heroPosterUrl: '/src/assets/images/cinema_still_recovery_1794679401997.jpg',
    widescreenStillUrl: '/src/assets/images/cinema_still_recovery_1794679401997.jpg',
    filmKicker: '呼吸舒展 · 恢复篇章',
    moodLine: '放慢呼吸与胸椎旋转，为下一次负重训练留出余量',
  },
};

export function getArchiveStillForSession(rec: HistorySessionRecord): string {
  const planMedia = CINEMA_POSTER_BY_PLAN[rec.planId];
  if (planMedia) return planMedia.widescreenStillUrl;
  return '/src/assets/images/demo_floor_press_1794667630997.jpg';
}
