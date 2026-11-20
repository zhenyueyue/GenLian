import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { HistorySessionRecord } from '../../data/appRecords';
import { formatTimeMMSS } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { GlassButton, GlassPanel, GlassSegmentedControl } from './WarmGlass';
import { getWarmArchiveStill, WARM_TOKENS } from './warmTokens';

interface WarmHistoryViewProps {
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  records: HistorySessionRecord[];
  selectedRecord: HistorySessionRecord | null;
  onSelectRecord: (record: HistorySessionRecord | null) => void;
  justArchivedId?: string | null;
}

type CategoryFilter = 'all' | 'strength' | 'cardio' | 'recovery';

const NOV_CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export const WarmHistoryView: React.FC<WarmHistoryViewProps> = ({
  deviceSize,
  reduceMotion = false,
  records,
  selectedRecord,
  onSelectRecord,
  justArchivedId = null,
}) => {
  const [viewMode, setViewMode] = useState<'archive' | 'calendar'>('archive');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [scrollY, setScrollY] = useState(0);

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const scrollBottomPad = isSE ? 'pb-32' : 'pb-36';

  const filteredRecords = records.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'strength') return rec.category === '力量 A' || rec.category === '力量 B';
    if (filter === 'cardio') return rec.category === '有氧';
    return rec.category === '恢复日';
  });

  const countedSessions = records.filter((r) => r.outcome !== 'early_exit_zero');
  const fullCompletedCount = records.filter((r) => r.outcome === 'completed').length;
  const totalMinutes = Math.round(
    countedSessions.reduce((sum, r) => sum + r.durationSeconds, 0) / 60
  );
  const totalLoggedSets = records.reduce((sum, r) => sum + r.loggedSets.length, 0);

  const featuredRecord =
    viewMode === 'archive' && filter === 'all' && filteredRecords.length > 0
      ? filteredRecords[0]
      : null;
  const remainingRecords = featuredRecord ? filteredRecords.slice(1) : filteredRecords;

  return (
    <AnimatePresence mode="wait">
      {selectedRecord ? (
        <motion.div
          key={`warm-detail-${selectedRecord.id}`}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-full flex-col"
          style={{ backgroundColor: WARM_TOKENS.canvasBg, color: WARM_TOKENS.inkPrimary }}
        >
          {(() => {
            const isCompleted = selectedRecord.outcome === 'completed';
            const isZero = selectedRecord.outcome === 'early_exit_zero';
            const totalReps = selectedRecord.loggedSets.reduce((sum, s) => sum + s.actualReps, 0);
            const stillUrl = getWarmArchiveStill(selectedRecord);

            const roundsMap = new Map<number, typeof selectedRecord.loggedSets>();
            for (const item of selectedRecord.loggedSets) {
              const list = roundsMap.get(item.round) ?? [];
              list.push(item);
              roundsMap.set(item.round, list);
            }
            const groupedRounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

            return (
              <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-28' : 'pb-32'}`}>
                {/* 5. 单次训练详情：方案 1 暖光头图 + 方案 2 精密数据系统 */}
                <div
                  className={`relative w-full overflow-hidden ${isSE ? 'h-[245px]' : 'h-[285px]'}`}
                  style={{ backgroundColor: WARM_TOKENS.surfaceBg }}
                >
                  <img
                    src={stillUrl}
                    alt={selectedRecord.title}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover object-center ${
                      isZero ? 'grayscale opacity-65' : WARM_TOKENS.photoFilterClass
                    }`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(244,241,235,0.48) 0%, rgba(244,241,235,0) 34%, rgba(244,241,235,0.88) 82%, #F4F1EB 100%)',
                    }}
                  />

                  <div
                    className={`absolute inset-x-0 top-0 ${topSafePad} px-4 flex items-center justify-between`}
                  >
                    <GlassButton
                      onClick={() => onSelectRecord(null)}
                      className="min-h-[40px] pl-2.5 pr-3.5 text-[12.5px] font-medium gap-0.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>档案</span>
                    </GlassButton>
                    <GlassPanel
                      variant="control"
                      className="px-3 py-1.5 rounded-full font-mono-num text-[11.5px] font-medium"
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      {selectedRecord.isDemoData ? '演示样本实录' : '本次训练实录'}
                    </GlassPanel>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
                    <div
                      className="text-[12px] font-semibold tracking-[0.02em]"
                      style={{
                        color: isCompleted
                          ? WARM_TOKENS.accentTextOnLight
                          : isZero
                          ? WARM_TOKENS.inkMuted
                          : WARM_TOKENS.warning,
                      }}
                    >
                      {selectedRecord.category} ·{' '}
                      {isCompleted
                        ? '按计划完整完成'
                        : isZero
                        ? '提前结束（0 组 · 未计完成）'
                        : '部分完成（已保留实录）'}
                    </div>
                    <h1
                      className="mt-1.5 font-editorial-serif text-[28px] font-semibold leading-[1.14] tracking-[-0.03em] text-balance"
                      style={{ color: WARM_TOKENS.inkPrimary }}
                    >
                      {selectedRecord.title}
                    </h1>
                    <div
                      className="mt-2 font-mono-num text-[12px]"
                      style={{ color: WARM_TOKENS.inkSecondary }}
                    >
                      {selectedRecord.dateLabel} {selectedRecord.weekday} ·{' '}
                      {selectedRecord.startedAt} → {selectedRecord.endedAt} · 暂停{' '}
                      {selectedRecord.pausedSeconds}s
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  {selectedRecord.note && (
                    <GlassPanel
                      variant="chip"
                      className="mt-3 mb-2 rounded-xl px-4 py-3 text-[13px] leading-[1.6]"
                      style={{
                        color: WARM_TOKENS.inkSecondary,
                      }}
                    >
                      {selectedRecord.note}
                    </GlassPanel>
                  )}

                  {/* 精密核心训练度量（方案 2 无框呼吸感分割线） */}
                  <div
                    className="mt-2 grid grid-cols-3 gap-4 py-6"
                    style={{
                      borderTop: `1px solid ${WARM_TOKENS.hairlineBorder}`,
                      borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}`,
                    }}
                  >
                    <div>
                      <div
                        className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        {selectedRecord.loggedSets.length}
                        <span
                          className="text-[14px] font-normal"
                          style={{ color: WARM_TOKENS.inkMuted }}
                        >
                          /{selectedRecord.plannedSetsCount}
                        </span>
                      </div>
                      <div className="text-[12px] mt-2" style={{ color: WARM_TOKENS.inkMuted }}>
                        实录组数
                      </div>
                    </div>
                    <div>
                      <div
                        className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        {totalReps}
                      </div>
                      <div className="text-[12px] mt-2" style={{ color: WARM_TOKENS.inkMuted }}>
                        累计次数/秒
                      </div>
                    </div>
                    <div>
                      <div
                        className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                        style={{ color: WARM_TOKENS.accent }}
                      >
                        {formatTimeMMSS(selectedRecord.durationSeconds)}
                      </div>
                      <div className="text-[12px] mt-2" style={{ color: WARM_TOKENS.inkMuted }}>
                        有效时长
                      </div>
                    </div>
                  </div>

                  {/* 按轮次编排的逐组实录 */}
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <span
                        className="text-[15px] font-semibold"
                        style={{ color: WARM_TOKENS.inkPrimary }}
                      >
                        逐组实录明细
                      </span>
                      <span
                        className="font-mono-num text-[12px]"
                        style={{ color: WARM_TOKENS.auxSlate }}
                      >
                        主配重 {selectedRecord.primaryWeightLabel}
                      </span>
                    </div>

                    {selectedRecord.loggedSets.length === 0 ? (
                      <GlassPanel
                        variant="chip"
                        className="rounded-2xl p-4 text-[13px] leading-[1.6]"
                        style={{
                          color: WARM_TOKENS.inkSecondary,
                        }}
                      >
                        本次未完成任何一组动作，按规则不计入完成次数，也不伪造训练容量。
                      </GlassPanel>
                    ) : (
                      <div className="space-y-5">
                        {groupedRounds.map(([roundNum, items]) => (
                          <div key={roundNum}>
                            <div
                              className="text-[12px] font-semibold pb-1.5"
                              style={{
                                color: WARM_TOKENS.accentTextOnLight,
                                borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}`,
                              }}
                            >
                              第 {roundNum} 轮
                            </div>
                            <div>
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="py-3.5 flex items-center justify-between gap-3"
                                  style={{ borderBottom: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
                                >
                                  <div className="min-w-0">
                                    <div
                                      className="text-[14.5px] font-semibold truncate"
                                      style={{ color: WARM_TOKENS.inkPrimary }}
                                    >
                                      {item.exerciseName}
                                      {item.side === 'left'
                                        ? ' · 左侧'
                                        : item.side === 'right'
                                        ? ' · 右侧'
                                        : ''}
                                    </div>
                                    <div
                                      className="mt-0.5 font-mono-num text-[12px]"
                                      style={{ color: WARM_TOKENS.inkMuted }}
                                    >
                                      {item.weightUsed} · 实休 {item.actualRestSeconds}s
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div
                                      className="font-display-b text-[18px] font-semibold tabular-nums leading-tight"
                                      style={{ color: WARM_TOKENS.inkPrimary }}
                                    >
                                      {item.actualReps}{' '}
                                      <span
                                        className="text-[12px] font-normal"
                                        style={{ color: WARM_TOKENS.inkSecondary }}
                                      >
                                        /{item.targetReps} {item.unit}
                                      </span>
                                    </div>
                                    <div
                                      className="text-[12px] font-medium mt-0.5"
                                      style={{ color: WARM_TOKENS.auxSlate }}
                                    >
                                      {item.effort}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedRecord.skippedRecords.length > 0 && (
                    <div className="mt-6">
                      <div
                        className="text-[13px] font-semibold mb-2"
                        style={{ color: WARM_TOKENS.warning }}
                      >
                        跳过动作（{selectedRecord.skippedRecords.length} 项 · 未计为完成）
                      </div>
                      <div className="space-y-1.5">
                        {selectedRecord.skippedRecords.map((sk, idx) => (
                          <GlassPanel
                            key={`${sk.timestamp}-${idx}`}
                            variant="chip"
                            className="rounded-xl px-3.5 py-2.5 text-[12.5px] flex items-center justify-between"
                            style={{
                              color: WARM_TOKENS.inkSecondary,
                            }}
                          >
                            <span>
                              第 {sk.round} 轮 · {sk.exerciseName}
                            </span>
                            <span className="font-mono-num text-[12px]">{sk.timestamp}</span>
                          </GlassPanel>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      ) : (
        <motion.div
          key="warm-archive-list"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
          className="relative flex h-full flex-col overflow-hidden"
          style={{ backgroundColor: WARM_TOKENS.canvasBg, color: WARM_TOKENS.inkPrimary }}
        >
          {/* 柔和背景光影层：让列表滚动时 warm-lg-chip 卡片呈现细微层级透视感 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 55% at 85% 18%, rgba(194, 65, 12, 0.07) 0%, rgba(232, 224, 210, 0.28) 42%, rgba(244, 241, 235, 0) 100%)',
              }}
            />
            {filteredRecords[0] && (
              <img
                src={getWarmArchiveStill(filteredRecords[0])}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute left-0 right-0 top-24 h-[360px] w-full object-cover opacity-[0.08] blur-2xl scale-110"
              />
            )}
          </div>

          <div
            onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}
            className={`iphone-scroll relative z-10 flex-1 overflow-y-auto ${scrollBottomPad}`}
          >
            {/* 4. 训练档案顶部标题与清透分段控制器（随滚动浮层透底） */}
            <div
              className={`sticky top-0 z-20 transition-colors duration-200 ${
                scrollY > 8 ? 'warm-lg-header-blur' : ''
              }`}
              style={{
                backgroundColor: scrollY > 8 ? undefined : 'transparent',
              }}
            >
              <div className={`${topSafePad} px-5 pb-3 flex items-end justify-between gap-2`}>
                <div>
                  <div className="text-[12px]" style={{ color: WARM_TOKENS.inkMuted }}>
                    个人训练志
                  </div>
                  <h1
                    className="font-editorial-serif text-[30px] font-semibold tracking-[-0.03em] leading-[1.12] mt-0.5"
                    style={{ color: WARM_TOKENS.inkPrimary }}
                  >
                    训练档案
                  </h1>
                </div>

                <GlassSegmentedControl<'archive' | 'calendar'>
                  value={viewMode}
                  onChange={setViewMode}
                  layoutId="warm-history-mode-pill"
                  reduceMotion={reduceMotion}
                  contained
                  buttonClassName="h-8 px-3 text-[12px]"
                  options={[
                    { id: 'archive', label: '记录', icon: <Layers className="w-3.5 h-3.5" /> },
                    { id: 'calendar', label: '月历', icon: <Calendar className="w-3.5 h-3.5" /> },
                  ]}
                />
              </div>

              {/* 分类筛选 */}
              <div
                className="px-5 overflow-x-auto iphone-scroll pb-1.5"
                style={{
                  borderBottom:
                    scrollY > 8 ? '1px solid transparent' : `1px solid ${WARM_TOKENS.hairlineBorder}`,
                }}
              >
                <GlassSegmentedControl<CategoryFilter>
                  value={filter}
                  onChange={setFilter}
                  layoutId="warm-perf-archive-underline"
                  reduceMotion={reduceMotion}
                  contained={false}
                  className="gap-3"
                  buttonClassName="min-h-[36px] px-3 py-1.5 text-[13px]"
                  options={[
                    { id: 'all', label: '全部' },
                    { id: 'strength', label: '力量' },
                    { id: 'cardio', label: '有氧' },
                    { id: 'recovery', label: '恢复' },
                  ]}
                />
              </div>
            </div>

            <div className="px-4">
              <section
                className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl bg-white"
                style={{ boxShadow: `inset 0 0 0 1px ${WARM_TOKENS.hairlineBorder}` }}
              >
              <div className="px-3 py-3.5">
                <div
                  className="font-display-b text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: WARM_TOKENS.inkPrimary }}
                >
                  {countedSessions.length}
                  <span
                    className="text-[12px] font-normal ml-1"
                    style={{ color: WARM_TOKENS.inkMuted }}
                  >
                    次
                  </span>
                </div>
                <div className="text-[12px] mt-1.5 leading-snug" style={{ color: WARM_TOKENS.inkMuted }}>
                  有效训练
                  <div>完整 {fullCompletedCount}</div>
                </div>
              </div>
              <div
                className="px-3 py-3.5"
                style={{ borderLeft: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
              >
                <div
                  className="font-display-b text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: WARM_TOKENS.inkPrimary }}
                >
                  {totalMinutes}
                  <span
                    className="text-[12px] font-normal ml-1"
                    style={{ color: WARM_TOKENS.inkMuted }}
                  >
                    min
                  </span>
                </div>
                <div className="text-[12px] mt-1.5" style={{ color: WARM_TOKENS.inkMuted }}>
                  累计时长
                </div>
              </div>
              <div
                className="px-3 py-3.5"
                style={{ borderLeft: `1px solid ${WARM_TOKENS.hairlineBorder}` }}
              >
                <div
                  className="font-display-b text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: WARM_TOKENS.accent }}
                >
                  {totalLoggedSets}
                  <span
                    className="text-[12px] font-normal ml-1"
                    style={{ color: WARM_TOKENS.inkMuted }}
                  >
                    组
                  </span>
                </div>
                <div className="text-[12px] mt-1.5" style={{ color: WARM_TOKENS.inkMuted }}>
                  实录容量
                </div>
              </div>
            </section>

            {viewMode === 'calendar' && (
              <GlassPanel variant="chip" className="mt-5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: WARM_TOKENS.inkPrimary }}
                  >
                    2026 年 11 月
                  </span>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="font-medium" style={{ color: WARM_TOKENS.accentTextOnLight }}>
                      完整
                    </span>
                    <span className="font-medium" style={{ color: WARM_TOKENS.warning }}>
                      部分
                    </span>
                    <span style={{ color: WARM_TOKENS.inkMuted }}>0组退出</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center font-display-b text-[12.5px]">
                  {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                    <div
                      key={w}
                      className="text-[11.5px] pb-1.5"
                      style={{ color: WARM_TOKENS.inkMuted }}
                    >
                      {w}
                    </div>
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {NOV_CALENDAR_DAYS.map((day) => {
                    const iso = `2026-11-${String(day).padStart(2, '0')}`;
                    const match = records.find((r) => r.isoDate === iso);
                    let cellStyle: React.CSSProperties = { color: WARM_TOKENS.inkMuted };
                    if (match) {
                      if (match.outcome === 'completed') {
                        cellStyle = {
                          backgroundColor: WARM_TOKENS.accent,
                          color: WARM_TOKENS.accentContrastText,
                          fontWeight: 600,
                        };
                      } else if (match.outcome === 'early_exit_partial') {
                        cellStyle = {
                          backgroundColor: WARM_TOKENS.accentSoft,
                          color: WARM_TOKENS.warning,
                          boxShadow: `inset 0 0 0 1px ${WARM_TOKENS.warning}`,
                          fontWeight: 600,
                        };
                      } else {
                        cellStyle = {
                          backgroundColor: WARM_TOKENS.surfaceElevatedBg,
                          color: WARM_TOKENS.inkSecondary,
                        };
                      }
                    }

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!match}
                        onClick={() => match && onSelectRecord(match)}
                        style={cellStyle}
                        className={`h-9 rounded-xl flex items-center justify-center tabular-nums transition-colors ${
                          match ? 'cursor-pointer hover:brightness-95' : 'cursor-default'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </GlassPanel>
            )}

            {featuredRecord && (
              <section className="mt-5">
                <div
                  className="flex items-center justify-between text-[12px] mb-2.5"
                  style={{ color: WARM_TOKENS.inkMuted }}
                >
                  <span>最近一次训练</span>
                  <span
                    style={{
                      color:
                        justArchivedId === featuredRecord.id
                          ? WARM_TOKENS.accentTextOnLight
                          : WARM_TOKENS.inkMuted,
                      fontWeight: justArchivedId === featuredRecord.id ? 600 : 400,
                    }}
                  >
                    {justArchivedId === featuredRecord.id
                      ? '刚刚收入档案 · 点击核对逐组明细'
                      : featuredRecord.isDemoData
                      ? '演示样本'
                      : '本次训练实录'}
                  </span>
                </div>

                <motion.button
                  type="button"
                  initial={
                    !featuredRecord.isDemoData && !reduceMotion
                      ? { opacity: 0.35, y: 14, scale: 0.985 }
                      : false
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelectRecord(featuredRecord)}
                  className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden text-left group cursor-pointer"
                  style={{
                    backgroundColor: WARM_TOKENS.surfaceBg,
                    boxShadow:
                      justArchivedId === featuredRecord.id
                        ? `0 0 0 2px ${WARM_TOKENS.accent}, 0 16px 32px -16px rgba(194,65,12,0.45)`
                        : '0 16px 32px -18px rgba(28,25,23,0.4)',
                  }}
                >
                  <img
                    src={getWarmArchiveStill(featuredRecord)}
                    alt={featuredRecord.title}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                      featuredRecord.outcome === 'early_exit_zero'
                        ? 'grayscale brightness-[0.65]'
                        : WARM_TOKENS.photoFilterClass
                    }`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center gap-2 text-[12px] text-white/90">
                      <span className="font-mono-num">
                        {featuredRecord.dateLabel} {featuredRecord.weekday}
                      </span>
                      <span aria-hidden="true" className="text-white/45">
                        ·
                      </span>
                      <span>{featuredRecord.category}</span>
                      <span aria-hidden="true" className="text-white/45">
                        ·
                      </span>
                      <span className="font-semibold text-white">
                        {featuredRecord.outcome === 'completed'
                          ? '完整完成'
                          : featuredRecord.outcome === 'early_exit_partial'
                          ? '部分完成'
                          : '提前结束（0组）'}
                      </span>
                    </div>

                    <h2 className="mt-1 font-editorial-serif text-[24px] font-semibold leading-[1.2] text-white">
                      {featuredRecord.title}
                    </h2>

                    <div className="mt-1.5 flex items-center justify-between gap-3 font-mono-num text-[12px] text-white/85">
                      <span className="min-w-0 truncate">
                        {formatTimeMMSS(featuredRecord.durationSeconds)} ·{' '}
                        {featuredRecord.loggedSets.length}/{featuredRecord.plannedSetsCount} 组 ·{' '}
                        {featuredRecord.primaryWeightLabel}
                      </span>
                      <span className="text-white flex items-center gap-0.5 shrink-0 font-medium">
                        <span>明细</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              </section>
            )}

            {filteredRecords.length === 0 && (
              <section
                className="mt-6 rounded-2xl px-4 py-8 text-center"
                style={{
                  backgroundColor: WARM_TOKENS.surfaceWhiteLift,
                  boxShadow: `inset 0 0 0 1px ${WARM_TOKENS.hairlineBorder}`,
                }}
              >
                <div className="text-[15px] font-semibold" style={{ color: WARM_TOKENS.inkPrimary }}>
                  这个分类还没有训练记录
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: WARM_TOKENS.inkSecondary }}>
                  完成一次训练并收入档案后，会显示在这里。也可以切换到「全部」查看已有实录。
                </p>
              </section>
            )}

            {remainingRecords.length > 0 && (
            <section className="mt-6">
              <div
                className="flex items-center justify-between text-[12px] mb-2.5"
                style={{ color: WARM_TOKENS.inkMuted }}
              >
                <span>过往实录</span>
                <span>点按查看逐组明细</span>
              </div>

              <div className="space-y-2.5">
                {remainingRecords.map((rec) => {
                  const isCompleted = rec.outcome === 'completed';
                  const isPartial = rec.outcome === 'early_exit_partial';
                  const isZero = rec.outcome === 'early_exit_zero';
                  const stillUrl = getWarmArchiveStill(rec);

                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onSelectRecord(rec)}
                      className="warm-lg-chip w-full rounded-2xl p-3 flex items-center gap-3.5 text-left group cursor-pointer transition-all active:scale-[0.985]"
                    >
                      <div
                        className="relative w-[108px] aspect-[4/3] rounded-xl overflow-hidden shrink-0"
                        style={{ backgroundColor: WARM_TOKENS.surfaceBg }}
                      >
                        <img
                          src={stillUrl}
                          alt={rec.title}
                          referrerPolicy="no-referrer"
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                            isZero ? 'grayscale opacity-65' : WARM_TOKENS.photoFilterClass
                          }`}
                        />
                        <div
                          className={`pointer-events-none absolute inset-0 ${WARM_TOKENS.photoCoolAirTintClass}`}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent" />
                        <span className="absolute bottom-1.5 right-2 font-mono-num text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                          {formatTimeMMSS(rec.durationSeconds)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <span
                            className="font-mono-num"
                            style={{ color: WARM_TOKENS.inkSecondary }}
                          >
                            {rec.dateLabel} {rec.weekday}
                          </span>
                          <span aria-hidden="true" className="opacity-30">
                            ·
                          </span>
                          <span
                            className="font-semibold"
                            style={{
                              color: isCompleted
                                ? WARM_TOKENS.accentTextOnLight
                                : isPartial
                                ? WARM_TOKENS.warning
                                : WARM_TOKENS.inkSecondary,
                            }}
                          >
                            {isCompleted ? '完整完成' : isPartial ? '部分完成' : '提前结束(0组)'}
                          </span>
                          {!rec.isDemoData && (
                            <span
                              className="font-mono-num text-[11px] font-semibold"
                              style={{ color: WARM_TOKENS.accentTextOnLight }}
                            >
                              [本次]
                            </span>
                          )}
                        </div>

                        <div
                          className="mt-1 text-[15px] font-semibold truncate leading-[1.35]"
                          style={{ color: WARM_TOKENS.inkPrimary }}
                        >
                          {rec.category} · {rec.title}
                        </div>

                        <div
                          className="mt-0.5 font-mono-num text-[12px] truncate"
                          style={{ color: WARM_TOKENS.inkSecondary }}
                        >
                          {rec.loggedSets.length}/{rec.plannedSetsCount} 组 ·{' '}
                          {rec.primaryWeightLabel}
                        </div>
                      </div>

                      <ChevronRight
                        className="w-4 h-4 shrink-0 transition-colors"
                        style={{ color: WARM_TOKENS.inkSecondary }}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
            )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
