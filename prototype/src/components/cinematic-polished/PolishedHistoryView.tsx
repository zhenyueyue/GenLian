import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { HistorySessionRecord } from '../../data/appRecords';
import { formatTimeMMSS } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { getPolishedArchiveStill } from './polishedMedia';

interface PolishedHistoryViewProps {
  deviceSize: DeviceSize;
  reduceMotion?: boolean;
  records: HistorySessionRecord[];
  selectedRecord: HistorySessionRecord | null;
  onSelectRecord: (record: HistorySessionRecord | null) => void;
  justArchivedId?: string | null;
}

type CategoryFilter = 'all' | 'strength' | 'cardio' | 'recovery';

const NOV_CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * 3. 训练档案与记录明细（编辑式排版 + 雕塑感数字 + 轮次分组实录）
 * - 统一与「今日首页」「训练总结」相同的暖炭黑画布、Outfit 大号度量与克制留白
 * - 视觉优先：最新完成训练优先呈现 16:10 大画幅卡片，过往实录采用宽松编辑式列表
 * - 单次实录详情与「训练总结页」共用同一套氛围头图与第 N 轮分组结构
 */
export const PolishedHistoryView: React.FC<PolishedHistoryViewProps> = ({
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
          key={`detail-${selectedRecord.id}`}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-full flex-col bg-[#11100F] text-[#F2EDE4]"
        >
          {(() => {
            const isCompleted = selectedRecord.outcome === 'completed';
            const isZero = selectedRecord.outcome === 'early_exit_zero';
            const totalReps = selectedRecord.loggedSets.reduce((sum, s) => sum + s.actualReps, 0);
            const stillUrl = getPolishedArchiveStill(selectedRecord);

            const roundsMap = new Map<number, typeof selectedRecord.loggedSets>();
            for (const item of selectedRecord.loggedSets) {
              const list = roundsMap.get(item.round) ?? [];
              list.push(item);
              roundsMap.set(item.round, list);
            }
            const groupedRounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

            return (
              <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-12' : 'pb-16'}`}>
                {/* 大气余韵头图（与训练总结保持同一视觉规格） */}
                <div
                  className={`relative w-full overflow-hidden bg-[#1A1816] ${
                    isSE ? 'h-[245px]' : 'h-[285px]'
                  }`}
                >
                  <img
                    src={stillUrl}
                    alt={selectedRecord.title}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover object-center ${
                      isZero ? 'grayscale brightness-[0.52]' : 'brightness-[0.9]'
                    }`}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(17,16,15,0.48) 0%, rgba(17,16,15,0) 38%, rgba(17,16,15,0.8) 82%, #11100F 100%)',
                    }}
                  />

                  <div
                    className={`absolute inset-x-0 top-0 ${topSafePad} px-4 flex items-center justify-between`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRecord(null)}
                      className="min-h-[40px] pl-2.5 pr-3.5 rounded-full bg-[#1A1816]/48 backdrop-blur-xl border border-[#F2EDE4]/16 text-[12.5px] font-medium text-[#F2EDE4] flex items-center gap-0.5 cursor-pointer hover:bg-[#1A1816]/72 active:scale-95 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>档案</span>
                    </button>
                    <span className="font-mono-num text-[12px] text-[#E3DDD4]/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
                      {selectedRecord.isDemoData ? '演示样本实录' : '本次训练实录'}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
                    <div
                      className={`text-[12px] font-medium tracking-[0.02em] ${
                        isCompleted
                          ? 'text-[#D9BE94]'
                          : isZero
                          ? 'text-[#B8AFA4]'
                          : 'text-[#D88A38]'
                      }`}
                    >
                      {selectedRecord.category} ·{' '}
                      {isCompleted
                        ? '按计划完整完成'
                        : isZero
                        ? '提前结束（0 组 · 未计完成）'
                        : '部分完成（已保留实录）'}
                    </div>
                    <h1 className="mt-1.5 text-[26px] font-semibold leading-[1.18] tracking-[-0.015em] text-[#F2EDE4] text-balance">
                      {selectedRecord.title}
                    </h1>
                    <div className="mt-2 font-mono-num text-[12px] text-[#C7BFB4]">
                      {selectedRecord.dateLabel} {selectedRecord.weekday} · {selectedRecord.startedAt}{' '}
                      → {selectedRecord.endedAt} · 暂停 {selectedRecord.pausedSeconds}s
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  {selectedRecord.note && (
                    <div className="mt-1 mb-2 border-l-2 border-[#D9BE94]/60 pl-3.5 py-1 text-[13px] text-[#D8D0C5] leading-[1.6]">
                      {selectedRecord.note}
                    </div>
                  )}

                  {/* 雕塑感核心训练度量 */}
                  <div className="mt-2 grid grid-cols-3 gap-4 py-6 border-y border-[#F2EDE4]/10">
                    <div>
                      <div className="font-display-b text-[32px] font-semibold leading-none text-[#F2EDE4] tabular-nums">
                        {selectedRecord.loggedSets.length}
                        <span className="text-[14px] font-normal text-[#948B80]">
                          /{selectedRecord.plannedSetsCount}
                        </span>
                      </div>
                      <div className="text-[12px] text-[#948B80] mt-2">实录组数</div>
                    </div>
                    <div>
                      <div className="font-display-b text-[32px] font-semibold leading-none text-[#F2EDE4] tabular-nums">
                        {totalReps}
                      </div>
                      <div className="text-[12px] text-[#948B80] mt-2">累计次数/秒</div>
                    </div>
                    <div>
                      <div className="font-display-b text-[32px] font-semibold leading-none text-[#D9BE94] tabular-nums">
                        {formatTimeMMSS(selectedRecord.durationSeconds)}
                      </div>
                      <div className="text-[12px] text-[#948B80] mt-2">有效时长</div>
                    </div>
                  </div>

                  {/* 按轮次编排的逐组实录 */}
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-[15px] font-semibold text-[#F2EDE4]">逐组实录明细</span>
                      <span className="font-mono-num text-[12px] text-[#948B80]">
                        主配重 {selectedRecord.primaryWeightLabel}
                      </span>
                    </div>

                    {selectedRecord.loggedSets.length === 0 ? (
                      <div className="rounded-2xl bg-[#191715] p-4 text-[13px] text-[#B8AFA4] leading-[1.6]">
                        本次未完成任何一组动作，按规则不计入完成次数，也不伪造训练容量。
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {groupedRounds.map(([roundNum, items]) => (
                          <div key={roundNum}>
                            <div className="text-[12px] font-medium text-[#D9BE94] pb-1.5 border-b border-[#F2EDE4]/8">
                              第 {roundNum} 轮
                            </div>
                            <div className="divide-y divide-[#F2EDE4]/6">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="py-3.5 flex items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[14.5px] font-medium text-[#F2EDE4] truncate">
                                      {item.exerciseName}
                                      {item.side === 'left'
                                        ? ' · 左侧'
                                        : item.side === 'right'
                                        ? ' · 右侧'
                                        : ''}
                                    </div>
                                    <div className="mt-0.5 font-mono-num text-[12px] text-[#948B80]">
                                      {item.weightUsed} · 实休 {item.actualRestSeconds}s
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-display-b text-[18px] font-semibold text-[#F2EDE4] tabular-nums leading-tight">
                                      {item.actualReps}{' '}
                                      <span className="text-[12px] font-normal text-[#B8AFA4]">
                                        /{item.targetReps} {item.unit}
                                      </span>
                                    </div>
                                    <div className="text-[12px] text-[#D9BE94] mt-0.5">
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
                      <div className="text-[13px] font-semibold text-[#D88A38] mb-2">
                        跳过动作（{selectedRecord.skippedRecords.length} 项 · 未计为完成）
                      </div>
                      <div className="space-y-1.5">
                        {selectedRecord.skippedRecords.map((sk, idx) => (
                          <div
                            key={`${sk.timestamp}-${idx}`}
                            className="rounded-xl bg-[#191715] px-3.5 py-2.5 text-[12.5px] text-[#B8AFA4] flex items-center justify-between"
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
          key="archive-list"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
          className="relative flex h-full flex-col bg-[#11100F] text-[#F2EDE4]"
        >
          {/* 顶部编辑式标题栏 */}
          <div className={`${topSafePad} px-5 pb-3 flex items-end justify-between gap-2 shrink-0`}>
            <div>
              <div className="text-[12px] text-[#948B80]">个人训练志</div>
              <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-[#F2EDE4] leading-[1.18] mt-0.5">
                训练档案
              </h1>
            </div>

            <div className="inline-flex p-0.5 rounded-full bg-[#191715] border border-[#F2EDE4]/10">
              <button
                type="button"
                onClick={() => setViewMode('archive')}
                className={`h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'archive'
                    ? 'bg-[#F2EDE4] text-[#11100F] font-semibold'
                    : 'text-[#B8AFA4] hover:text-[#F2EDE4]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>记录</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-[#F2EDE4] text-[#11100F] font-semibold'
                    : 'text-[#B8AFA4] hover:text-[#F2EDE4]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>月历</span>
              </button>
            </div>
          </div>

          {/* 极简分类筛选（退掉笨重方块胶囊，用细下划线呼应编辑节奏） */}
          <div className="px-5 border-b border-[#F2EDE4]/10 flex items-center gap-5 overflow-x-auto iphone-scroll shrink-0">
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
                  className={`relative min-h-[40px] py-2 text-[13px] whitespace-nowrap cursor-pointer transition-colors ${
                    isActive
                      ? 'text-[#F2EDE4] font-semibold'
                      : 'text-[#948B80] font-medium hover:text-[#D8D0C5]'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.span
                      layoutId={reduceMotion ? undefined : 'archive-filter-underline'}
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#D9BE94]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 内容滚动区（足额底部净空） */}
          <div className={`iphone-scroll flex-1 overflow-y-auto px-5 ${scrollBottomPad}`}>
            {/* 雕塑感累计度量（宽松留白 + Outfit 字体） */}
            <section className="grid grid-cols-3 gap-4 py-5 border-b border-[#F2EDE4]/8">
              <div>
                <div className="font-display-b text-[28px] font-semibold leading-none text-[#F2EDE4] tabular-nums">
                  {countedSessions.length}
                  <span className="text-[12px] font-normal text-[#948B80] ml-1">次</span>
                </div>
                <div className="text-[12px] text-[#948B80] mt-1.5">
                  有效训练（完整 {fullCompletedCount}）
                </div>
              </div>
              <div>
                <div className="font-display-b text-[28px] font-semibold leading-none text-[#F2EDE4] tabular-nums">
                  {totalMinutes}
                  <span className="text-[12px] font-normal text-[#948B80] ml-1">min</span>
                </div>
                <div className="text-[12px] text-[#948B80] mt-1.5">累计时长</div>
              </div>
              <div>
                <div className="font-display-b text-[28px] font-semibold leading-none text-[#D9BE94] tabular-nums">
                  {totalLoggedSets}
                  <span className="text-[12px] font-normal text-[#948B80] ml-1">组</span>
                </div>
                <div className="text-[12px] text-[#948B80] mt-1.5">实录容量</div>
              </div>
            </section>

            {viewMode === 'calendar' && (
              <section className="mt-5 rounded-2xl bg-[#191715] p-4 border border-[#F2EDE4]/8">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[14px] font-semibold text-[#F2EDE4]">2026 年 11 月</span>
                  <div className="flex items-center gap-3 text-[12px] text-[#B8AFA4]">
                    <span className="text-[#D9BE94]">完整</span>
                    <span className="text-[#D88A38]">部分</span>
                    <span className="text-[#948B80]">0组退出</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center font-display-b text-[12.5px]">
                  {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                    <div key={w} className="text-[#948B80] text-[11.5px] pb-1.5">
                      {w}
                    </div>
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {NOV_CALENDAR_DAYS.map((day) => {
                    const iso = `2026-11-${String(day).padStart(2, '0')}`;
                    const match = records.find((r) => r.isoDate === iso);
                    const bgClass = match
                      ? match.outcome === 'completed'
                        ? 'bg-[#D9BE94] text-[#11100F] font-semibold'
                        : match.outcome === 'early_exit_partial'
                        ? 'bg-[#D88A38]/22 text-[#D88A38] ring-1 ring-[#D88A38]/55'
                        : 'bg-[#F2EDE4]/12 text-[#B8AFA4]'
                      : 'text-[#948B80]/80';

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!match}
                        onClick={() => match && onSelectRecord(match)}
                        className={`h-9 rounded-xl flex items-center justify-center tabular-nums transition-colors ${bgClass} ${
                          match ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
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
                <div className="flex items-center justify-between text-[12px] text-[#948B80] mb-2.5">
                  <span>最近一次训练</span>
                  <span
                    className={
                      justArchivedId === featuredRecord.id ? 'text-[#D9BE94] font-semibold' : ''
                    }
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
                  className={`relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[#191715] text-left group cursor-pointer ${
                    justArchivedId === featuredRecord.id ? 'ring-1 ring-[#D9BE94]/75' : ''
                  }`}
                >
                  <img
                    src={getPolishedArchiveStill(featuredRecord)}
                    alt={featuredRecord.title}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                      featuredRecord.outcome === 'early_exit_zero'
                        ? 'grayscale brightness-[0.58]'
                        : 'brightness-95'
                    }`}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(17,16,15,0) 20%, rgba(17,16,15,0.68) 65%, rgba(17,16,15,0.95) 100%)',
                    }}
                  />

                  <div className="absolute inset-x-0 bottom-0 p-4.5">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-mono-num text-[#E3DDD4]">
                        {featuredRecord.dateLabel} {featuredRecord.weekday}
                      </span>
                      <span aria-hidden="true" className="text-[#F2EDE4]/35">
                        ·
                      </span>
                      <span className="text-[#F2EDE4]">{featuredRecord.category}</span>
                      <span aria-hidden="true" className="text-[#F2EDE4]/35">
                        ·
                      </span>
                      <span
                        className={
                          featuredRecord.outcome === 'completed'
                            ? 'text-[#D9BE94] font-semibold'
                            : featuredRecord.outcome === 'early_exit_partial'
                            ? 'text-[#D88A38] font-semibold'
                            : 'text-[#B8AFA4]'
                        }
                      >
                        {featuredRecord.outcome === 'completed'
                          ? '完整完成'
                          : featuredRecord.outcome === 'early_exit_partial'
                          ? '部分完成'
                          : '提前结束（0组）'}
                      </span>
                    </div>

                    <h2 className="mt-1 text-[20px] font-semibold leading-[1.24] text-[#F2EDE4]">
                      {featuredRecord.title}
                    </h2>

                    <div className="mt-1.5 flex items-center justify-between font-mono-num text-[12px] text-[#C7BFB4]">
                      <span>
                        {formatTimeMMSS(featuredRecord.durationSeconds)} ·{' '}
                        {featuredRecord.loggedSets.length}/{featuredRecord.plannedSetsCount} 组 ·{' '}
                        {featuredRecord.primaryWeightLabel}
                      </span>
                      <span className="text-[#F2EDE4] flex items-center gap-0.5 shrink-0">
                        <span>明细</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              </section>
            )}

            <section className="mt-6">
              <div className="flex items-center justify-between text-[12px] text-[#948B80] mb-1">
                <span>过往实录</span>
                <span>点按查看逐组明细</span>
              </div>

              <div className="divide-y divide-[#F2EDE4]/8">
                {remainingRecords.map((rec) => {
                  const isCompleted = rec.outcome === 'completed';
                  const isPartial = rec.outcome === 'early_exit_partial';
                  const isZero = rec.outcome === 'early_exit_zero';
                  const stillUrl = getPolishedArchiveStill(rec);

                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onSelectRecord(rec)}
                      className="w-full py-4 flex items-center gap-3.5 text-left group cursor-pointer"
                    >
                      <div className="relative w-[112px] aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-[#191715]">
                        <img
                          src={stillUrl}
                          alt={rec.title}
                          referrerPolicy="no-referrer"
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                            isZero ? 'grayscale opacity-60' : 'brightness-95'
                          }`}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#11100F]/82 via-transparent to-transparent" />
                        <span className="absolute bottom-1.5 right-2 font-mono-num text-[11px] font-medium text-[#F2EDE4]">
                          {formatTimeMMSS(rec.durationSeconds)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <span className="font-mono-num text-[#B8AFA4]">
                            {rec.dateLabel} {rec.weekday}
                          </span>
                          <span aria-hidden="true" className="text-[#F2EDE4]/25">
                            ·
                          </span>
                          <span
                            className={`font-medium ${
                              isCompleted
                                ? 'text-[#D9BE94]'
                                : isPartial
                                ? 'text-[#D88A38]'
                                : 'text-[#948B80]'
                            }`}
                          >
                            {isCompleted ? '完整完成' : isPartial ? '部分完成' : '提前结束(0组)'}
                          </span>
                          {!rec.isDemoData && (
                            <span className="font-mono-num text-[11px] text-[#B54B35]">[本次]</span>
                          )}
                        </div>

                        <div className="mt-1 text-[15px] font-medium text-[#F2EDE4] truncate leading-[1.35]">
                          {rec.category} · {rec.title}
                        </div>

                        <div className="mt-0.5 font-mono-num text-[12px] text-[#948B80] truncate">
                          {rec.loggedSets.length}/{rec.plannedSetsCount} 组 ·{' '}
                          {rec.primaryWeightLabel}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#948B80] group-hover:text-[#F2EDE4] shrink-0 transition-colors" />
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
