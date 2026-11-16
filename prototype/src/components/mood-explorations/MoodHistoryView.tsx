import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { HistorySessionRecord } from '../../data/appRecords';
import { formatTimeMMSS } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { getMoodArchiveStill, MoodThemeConfig } from './moodThemes';

interface MoodHistoryViewProps {
  theme: MoodThemeConfig;
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  records: HistorySessionRecord[];
  selectedRecord: HistorySessionRecord | null;
  onSelectRecord: (record: HistorySessionRecord | null) => void;
  justArchivedId?: string | null;
}

type CategoryFilter = 'all' | 'strength' | 'cardio' | 'recovery';

const NOV_CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export const MoodHistoryView: React.FC<MoodHistoryViewProps> = ({
  theme,
  deviceSize,
  reduceMotion = false,
  records,
  selectedRecord,
  onSelectRecord,
  justArchivedId = null,
}) => {
  const [viewMode, setViewMode] = useState<'archive' | 'calendar'>('archive');
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const scrollBottomPad = isSE ? 'pb-32' : 'pb-36';
  const isDynamic = theme.id === 'dynamic';

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
          key={`detail-${theme.id}-${selectedRecord.id}`}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-full flex-col"
          style={{ backgroundColor: theme.canvasBg, color: theme.textPrimary }}
        >
          {(() => {
            const isCompleted = selectedRecord.outcome === 'completed';
            const isZero = selectedRecord.outcome === 'early_exit_zero';
            const totalReps = selectedRecord.loggedSets.reduce((sum, s) => sum + s.actualReps, 0);
            const stillUrl = getMoodArchiveStill(theme, selectedRecord);

            const roundsMap = new Map<number, typeof selectedRecord.loggedSets>();
            for (const item of selectedRecord.loggedSets) {
              const list = roundsMap.get(item.round) ?? [];
              list.push(item);
              roundsMap.set(item.round, list);
            }
            const groupedRounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

            return (
              <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-12' : 'pb-16'}`}>
                {/* 5. 单次训练详情：大气日光明快头图 */}
                <div
                  className={`relative w-full overflow-hidden ${isSE ? 'h-[245px]' : 'h-[285px]'}`}
                  style={{ backgroundColor: theme.detailHeaderBg }}
                >
                  <img
                    src={stillUrl}
                    alt={selectedRecord.title}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover object-center ${
                      isZero ? 'grayscale opacity-65' : theme.photoToneFilterClass
                    }`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: theme.detailHeaderOverlay }}
                  />

                  <div
                    className={`absolute inset-x-0 top-0 ${topSafePad} px-4 flex items-center justify-between`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRecord(null)}
                      className="min-h-[40px] pl-2.5 pr-3.5 rounded-full backdrop-blur-xl text-[12.5px] font-medium flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                      style={{
                        backgroundColor: theme.playerGlassBg,
                        border: `1px solid ${theme.playerGlassBorder}`,
                        color: theme.playerGlassText,
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>档案</span>
                    </button>
                    <span
                      className="font-mono-num text-[12px] font-medium"
                      style={{
                        color: isDynamic ? '#FFFFFF' : theme.textSecondary,
                        textShadow: isDynamic ? '0 1px 6px rgba(0,0,0,0.65)' : undefined,
                      }}
                    >
                      {selectedRecord.isDemoData ? '演示样本实录' : '本次训练实录'}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
                    <div
                      className="text-[12px] font-semibold tracking-[0.02em]"
                      style={{
                        color: isCompleted
                          ? theme.detailHeaderAccent
                          : isZero
                          ? theme.detailHeaderMeta
                          : theme.warning,
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
                      className="mt-1.5 text-[26px] font-semibold leading-[1.18] tracking-[-0.015em] text-balance"
                      style={{ color: theme.detailHeaderTitle }}
                    >
                      {selectedRecord.title}
                    </h1>
                    <div
                      className="mt-2 font-mono-num text-[12px]"
                      style={{ color: theme.detailHeaderMeta }}
                    >
                      {selectedRecord.dateLabel} {selectedRecord.weekday} · {selectedRecord.startedAt}{' '}
                      → {selectedRecord.endedAt} · 暂停 {selectedRecord.pausedSeconds}s
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  {selectedRecord.note && (
                    <div
                      className="mt-3 mb-2 rounded-xl px-4 py-3 text-[13px] leading-[1.6]"
                      style={{
                        backgroundColor: theme.surfaceBg,
                        color: theme.textSecondary,
                      }}
                    >
                      {selectedRecord.note}
                    </div>
                  )}

                  {/* 雕塑感核心训练度量 */}
                  <div
                    className="mt-2 grid grid-cols-3 gap-4 py-6"
                    style={{
                      borderTop: `1px solid ${theme.hairlineBorder}`,
                      borderBottom: `1px solid ${theme.hairlineBorder}`,
                    }}
                  >
                    <div>
                      <div
                        className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                        style={{ color: theme.textPrimary }}
                      >
                        {selectedRecord.loggedSets.length}
                        <span
                          className="text-[14px] font-normal"
                          style={{ color: theme.textMuted }}
                        >
                          /{selectedRecord.plannedSetsCount}
                        </span>
                      </div>
                      <div className="text-[12px] mt-2" style={{ color: theme.textMuted }}>
                        实录组数
                      </div>
                    </div>
                    <div>
                      <div
                        className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                        style={{ color: theme.textPrimary }}
                      >
                        {totalReps}
                      </div>
                      <div className="text-[12px] mt-2" style={{ color: theme.textMuted }}>
                        累计次数/秒
                      </div>
                    </div>
                    <div>
                      <div
                        className="font-display-b text-[32px] font-semibold leading-none tabular-nums"
                        style={{ color: theme.accent }}
                      >
                        {formatTimeMMSS(selectedRecord.durationSeconds)}
                      </div>
                      <div className="text-[12px] mt-2" style={{ color: theme.textMuted }}>
                        有效时长
                      </div>
                    </div>
                  </div>

                  {/* 按轮次编排的逐组实录 */}
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <span
                        className="text-[15px] font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        逐组实录明细
                      </span>
                      <span
                        className="font-mono-num text-[12px]"
                        style={{ color: theme.textMuted }}
                      >
                        主配重 {selectedRecord.primaryWeightLabel}
                      </span>
                    </div>

                    {selectedRecord.loggedSets.length === 0 ? (
                      <div
                        className="rounded-2xl p-4 text-[13px] leading-[1.6]"
                        style={{ backgroundColor: theme.surfaceBg, color: theme.textSecondary }}
                      >
                        本次未完成任何一组动作，按规则不计入完成次数，也不伪造训练容量。
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {groupedRounds.map(([roundNum, items]) => (
                          <div key={roundNum}>
                            <div
                              className="text-[12px] font-semibold pb-1.5"
                              style={{
                                color: theme.accent,
                                borderBottom: `1px solid ${theme.hairlineBorder}`,
                              }}
                            >
                              第 {roundNum} 轮
                            </div>
                            <div>
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="py-3.5 flex items-center justify-between gap-3"
                                  style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
                                >
                                  <div className="min-w-0">
                                    <div
                                      className="text-[14.5px] font-semibold truncate"
                                      style={{ color: theme.textPrimary }}
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
                                      style={{ color: theme.textMuted }}
                                    >
                                      {item.weightUsed} · 实休 {item.actualRestSeconds}s
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div
                                      className="font-display-b text-[18px] font-semibold tabular-nums leading-tight"
                                      style={{ color: theme.textPrimary }}
                                    >
                                      {item.actualReps}{' '}
                                      <span
                                        className="text-[12px] font-normal"
                                        style={{ color: theme.textSecondary }}
                                      >
                                        /{item.targetReps} {item.unit}
                                      </span>
                                    </div>
                                    <div
                                      className="text-[12px] font-medium mt-0.5"
                                      style={{ color: theme.accent }}
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
                        style={{ color: theme.warning }}
                      >
                        跳过动作（{selectedRecord.skippedRecords.length} 项 · 未计为完成）
                      </div>
                      <div className="space-y-1.5">
                        {selectedRecord.skippedRecords.map((sk, idx) => (
                          <div
                            key={`${sk.timestamp}-${idx}`}
                            className="rounded-xl px-3.5 py-2.5 text-[12.5px] flex items-center justify-between"
                            style={{
                              backgroundColor: theme.surfaceBg,
                              color: theme.textSecondary,
                            }}
                          >
                            <span>
                              第 {sk.round} 轮 · {sk.exerciseName}
                            </span>
                            <span className="font-mono-num text-[12px]">{sk.timestamp}</span>
                          </div>
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
          key={`archive-list-${theme.id}`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
          className="relative flex h-full flex-col"
          style={{ backgroundColor: theme.canvasBg, color: theme.textPrimary }}
        >
          {/* 4. 训练档案顶部编辑式标题栏 */}
          <div className={`${topSafePad} px-5 pb-3 flex items-end justify-between gap-2 shrink-0`}>
            <div>
              <div className="text-[12px]" style={{ color: theme.textMuted }}>
                个人训练志
              </div>
              <h1
                className="text-[26px] font-semibold tracking-[-0.015em] leading-[1.18] mt-0.5"
                style={{ color: theme.textPrimary }}
              >
                训练档案
              </h1>
            </div>

            <div
              className="inline-flex p-0.5 rounded-full"
              style={{
                backgroundColor: theme.surfaceBg,
                border: `1px solid ${theme.hairlineBorder}`,
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('archive')}
                className="h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                style={{
                  backgroundColor: viewMode === 'archive' ? theme.primaryCtaBg : 'transparent',
                  color: viewMode === 'archive' ? theme.primaryCtaText : theme.textSecondary,
                  fontWeight: viewMode === 'archive' ? 600 : 500,
                }}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>记录</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className="h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                style={{
                  backgroundColor: viewMode === 'calendar' ? theme.primaryCtaBg : 'transparent',
                  color: viewMode === 'calendar' ? theme.primaryCtaText : theme.textSecondary,
                  fontWeight: viewMode === 'calendar' ? 600 : 500,
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>月历</span>
              </button>
            </div>
          </div>

          {/* 极简分类筛选 */}
          <div
            className="px-5 flex items-center gap-5 overflow-x-auto iphone-scroll shrink-0"
            style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
          >
            {(
              [
                { id: 'all', label: '全部' },
                { id: 'strength', label: '力量' },
                { id: 'cardio', label: '有氧' },
                { id: 'recovery', label: '恢复' },
              ] as { id: CategoryFilter; label: string }[]
            ).map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className="relative min-h-[40px] py-2 text-[13px] whitespace-nowrap cursor-pointer transition-colors"
                  style={{
                    color: isActive ? theme.textPrimary : theme.textMuted,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <motion.span
                      layoutId={
                        reduceMotion ? undefined : `mood-${theme.id}-archive-underline`
                      }
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className={`iphone-scroll flex-1 overflow-y-auto px-5 ${scrollBottomPad}`}>
            {/* 雕塑感累计度量 */}
            <section
              className="grid grid-cols-3 gap-4 py-5"
              style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
            >
              <div>
                <div
                  className="font-display-b text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: theme.textPrimary }}
                >
                  {countedSessions.length}
                  <span
                    className="text-[12px] font-normal ml-1"
                    style={{ color: theme.textMuted }}
                  >
                    次
                  </span>
                </div>
                <div className="text-[12px] mt-1.5" style={{ color: theme.textMuted }}>
                  有效训练（完整 {fullCompletedCount}）
                </div>
              </div>
              <div>
                <div
                  className="font-display-b text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: theme.textPrimary }}
                >
                  {totalMinutes}
                  <span
                    className="text-[12px] font-normal ml-1"
                    style={{ color: theme.textMuted }}
                  >
                    min
                  </span>
                </div>
                <div className="text-[12px] mt-1.5" style={{ color: theme.textMuted }}>
                  累计时长
                </div>
              </div>
              <div>
                <div
                  className="font-display-b text-[28px] font-semibold leading-none tabular-nums"
                  style={{ color: theme.accent }}
                >
                  {totalLoggedSets}
                  <span
                    className="text-[12px] font-normal ml-1"
                    style={{ color: theme.textMuted }}
                  >
                    组
                  </span>
                </div>
                <div className="text-[12px] mt-1.5" style={{ color: theme.textMuted }}>
                  实录容量
                </div>
              </div>
            </section>

            {viewMode === 'calendar' && (
              <section
                className="mt-5 rounded-2xl p-4"
                style={{
                  backgroundColor: theme.surfaceBg,
                  border: `1px solid ${theme.hairlineBorder}`,
                }}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: theme.textPrimary }}
                  >
                    2026 年 11 月
                  </span>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="font-medium" style={{ color: theme.accent }}>
                      完整
                    </span>
                    <span className="font-medium" style={{ color: theme.warning }}>
                      部分
                    </span>
                    <span style={{ color: theme.textMuted }}>0组退出</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center font-display-b text-[12.5px]">
                  {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                    <div
                      key={w}
                      className="text-[11.5px] pb-1.5"
                      style={{ color: theme.textMuted }}
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
                    let cellStyle: React.CSSProperties = { color: theme.textMuted };
                    if (match) {
                      if (match.outcome === 'completed') {
                        cellStyle = {
                          backgroundColor: theme.accent,
                          color: theme.accentContrastText,
                          fontWeight: 600,
                        };
                      } else if (match.outcome === 'early_exit_partial') {
                        cellStyle = {
                          backgroundColor: theme.accentSoft,
                          color: theme.warning,
                          boxShadow: `inset 0 0 0 1px ${theme.warning}`,
                          fontWeight: 600,
                        };
                      } else {
                        cellStyle = {
                          backgroundColor: theme.surfaceElevatedBg,
                          color: theme.textSecondary,
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
              </section>
            )}

            {featuredRecord && (
              <section className="mt-5">
                <div
                  className="flex items-center justify-between text-[12px] mb-2.5"
                  style={{ color: theme.textMuted }}
                >
                  <span>最近一次训练</span>
                  <span
                    style={{
                      color:
                        justArchivedId === featuredRecord.id ? theme.accent : theme.textMuted,
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
                    backgroundColor: theme.surfaceBg,
                    boxShadow:
                      justArchivedId === featuredRecord.id
                        ? `0 0 0 2px ${theme.accent}`
                        : undefined,
                  }}
                >
                  <img
                    src={getMoodArchiveStill(theme, featuredRecord)}
                    alt={featuredRecord.title}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                      featuredRecord.outcome === 'early_exit_zero'
                        ? 'grayscale brightness-[0.65]'
                        : theme.photoToneFilterClass
                    }`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/32 to-transparent" />

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

                    <h2 className="mt-1 text-[20px] font-semibold leading-[1.24] text-white">
                      {featuredRecord.title}
                    </h2>

                    <div className="mt-1.5 flex items-center justify-between font-mono-num text-[12px] text-white/85">
                      <span>
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

            <section className="mt-6">
              <div
                className="flex items-center justify-between text-[12px] mb-1"
                style={{ color: theme.textMuted }}
              >
                <span>过往实录</span>
                <span>点按查看逐组明细</span>
              </div>

              <div>
                {remainingRecords.map((rec) => {
                  const isCompleted = rec.outcome === 'completed';
                  const isPartial = rec.outcome === 'early_exit_partial';
                  const isZero = rec.outcome === 'early_exit_zero';
                  const stillUrl = getMoodArchiveStill(theme, rec);

                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onSelectRecord(rec)}
                      className="w-full py-4 flex items-center gap-3.5 text-left group cursor-pointer"
                      style={{ borderBottom: `1px solid ${theme.hairlineBorder}` }}
                    >
                      <div
                        className="relative w-[112px] aspect-[4/3] rounded-xl overflow-hidden shrink-0"
                        style={{ backgroundColor: theme.surfaceBg }}
                      >
                        <img
                          src={stillUrl}
                          alt={rec.title}
                          referrerPolicy="no-referrer"
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                            isZero ? 'grayscale opacity-65' : theme.photoToneFilterClass
                          }`}
                        />
                        <div
                          className={`pointer-events-none absolute inset-0 ${theme.photoToneTintClass}`}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent" />
                        <span className="absolute bottom-1.5 right-2 font-mono-num text-[11px] font-semibold text-white">
                          {formatTimeMMSS(rec.durationSeconds)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <span
                            className="font-mono-num"
                            style={{ color: theme.textSecondary }}
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
                                ? theme.accent
                                : isPartial
                                ? theme.warning
                                : theme.textMuted,
                            }}
                          >
                            {isCompleted ? '完整完成' : isPartial ? '部分完成' : '提前结束(0组)'}
                          </span>
                          {!rec.isDemoData && (
                            <span
                              className="font-mono-num text-[11px] font-semibold"
                              style={{ color: theme.accent }}
                            >
                              [本次]
                            </span>
                          )}
                        </div>

                        <div
                          className="mt-1 text-[15px] font-semibold truncate leading-[1.35]"
                          style={{ color: theme.textPrimary }}
                        >
                          {rec.category} · {rec.title}
                        </div>

                        <div
                          className="mt-0.5 font-mono-num text-[12px] truncate"
                          style={{ color: theme.textMuted }}
                        >
                          {rec.loggedSets.length}/{rec.plannedSetsCount} 组 ·{' '}
                          {rec.primaryWeightLabel}
                        </div>
                      </div>

                      <ChevronRight
                        className="w-4 h-4 shrink-0 transition-colors"
                        style={{ color: theme.textMuted }}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
