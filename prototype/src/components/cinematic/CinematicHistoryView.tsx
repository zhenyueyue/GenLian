import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { HistorySessionRecord } from '../../data/appRecords';
import { formatTimeMMSS } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';
import { getArchiveStillForSession } from './cinematicMedia';

interface CinematicHistoryViewProps {
  deviceSize: DeviceSize;
  records: HistorySessionRecord[];
  selectedRecord: HistorySessionRecord | null;
  onSelectRecord: (record: HistorySessionRecord | null) => void;
}

type CategoryFilter = 'all' | 'strength' | 'cardio' | 'recovery';

const NOV_CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * 「训练历史」具有内容感的训练档案（Cinematic Fitness）
 * - 以影像剧照、分镜缩略图与排版节奏取代干瘪纯文字列表
 * - 严格保留事实边界：区分「完整完成」「部分完成」「提前结束（0组·不计入完成次数）」与「演示档案 / 本次实录」
 */
export const CinematicHistoryView: React.FC<CinematicHistoryViewProps> = ({
  deviceSize,
  records,
  selectedRecord,
  onSelectRecord,
}) => {
  const [viewMode, setViewMode] = useState<'reel' | 'calendar'>('reel');
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[50px]';
  const scrollBottomPad = isSE ? 'pb-24' : 'pb-28';

  // 单次训练实录档案详情页
  if (selectedRecord) {
    const isCompleted = selectedRecord.outcome === 'completed';
    const isZero = selectedRecord.outcome === 'early_exit_zero';
    const totalReps = selectedRecord.loggedSets.reduce((sum, s) => sum + s.actualReps, 0);
    const stillUrl = getArchiveStillForSession(selectedRecord);

    return (
      <div className="relative flex h-full flex-col bg-[#0B0908] text-[#F4EFE6]">
        <div className={`iphone-scroll flex-1 overflow-y-auto ${isSE ? 'pb-10' : 'pb-12'}`}>
          {/* 顶部 16:9 电影剧照头图 */}
          <div className="relative h-[240px] w-full overflow-hidden bg-[#14110F]">
            <img
              src={stillUrl}
              alt={selectedRecord.title}
              referrerPolicy="no-referrer"
              className={`h-full w-full object-cover ${isZero ? 'grayscale brightness-50' : 'brightness-85'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908] via-[#0B0908]/45 to-[#0B0908]/65" />

            {/* 顶部返回导航 */}
            <div
              className={`absolute inset-x-0 top-0 ${topSafePad} px-4 flex items-center justify-between`}
            >
              <button
                type="button"
                onClick={() => onSelectRecord(null)}
                className="min-h-[38px] pl-2 pr-3 rounded-lg bg-[#0B0908]/45 backdrop-blur-md border border-[#F4EFE6]/14 text-[12.5px] font-medium text-[#F4EFE6] flex items-center gap-1 cursor-pointer hover:bg-[#0B0908]/65"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>返回档案</span>
              </button>
              <span className="font-mono-num text-[11px] text-[#D8D0C5]/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                {selectedRecord.isDemoData ? '演示样本档案' : '本次真实实录'}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
              <div
                className={`text-[12px] font-semibold ${
                  isCompleted ? 'text-[#D9BE94]' : isZero ? 'text-[#A89F94]' : 'text-[#D88A38]'
                }`}
              >
                {selectedRecord.category} ·{' '}
                {isCompleted
                  ? '完整完成'
                  : isZero
                  ? '提前结束（0 组·未计入完成次数）'
                  : '部分完成（保留实录）'}
              </div>
              <h1 className="font-display-a mt-1 text-[28px] font-bold leading-tight text-[#F4EFE6]">
                {selectedRecord.title}
              </h1>
              <div className="mt-1 font-mono-num text-[11.5px] text-[#A89F94]">
                {selectedRecord.dateLabel} {selectedRecord.weekday} · {selectedRecord.startedAt} →{' '}
                {selectedRecord.endedAt} · 暂停 {selectedRecord.pausedSeconds}s
              </div>
            </div>
          </div>

          <div className="px-5">
            {selectedRecord.note && (
              <p className="mt-1 rounded-xl bg-[#14110F] px-3.5 py-2.5 text-[12.5px] text-[#C8C0B5] leading-relaxed">
                {selectedRecord.note}
              </p>
            )}

            {/* 3 项事实统计 */}
            <div className="mt-4 grid grid-cols-3 gap-2 py-3.5 border-y border-[#F4EFE6]/10">
              <div>
                <div className="font-mono-num text-[21px] font-bold text-[#F4EFE6]">
                  {selectedRecord.loggedSets.length}/{selectedRecord.plannedSetsCount}
                </div>
                <div className="text-[11px] text-[#A89F94] mt-0.5">实录组数</div>
              </div>
              <div>
                <div className="font-mono-num text-[21px] font-bold text-[#F4EFE6]">{totalReps}</div>
                <div className="text-[11px] text-[#A89F94] mt-0.5">总次数/秒</div>
              </div>
              <div>
                <div className="font-mono-num text-[21px] font-bold text-[#D9BE94]">
                  {formatTimeMMSS(selectedRecord.durationSeconds)}
                </div>
                <div className="text-[11px] text-[#A89F94] mt-0.5">有效时长</div>
              </div>
            </div>

            {/* 逐组实录胶片明细 */}
            <div className="mt-5">
              <div className="text-[13px] font-semibold text-[#F4EFE6] mb-2">
                逐组实录明细（{selectedRecord.loggedSets.length} 组）
              </div>
              {selectedRecord.loggedSets.length === 0 ? (
                <div className="rounded-xl bg-[#14110F] p-4 text-[12.5px] text-[#A89F94] leading-relaxed">
                  本次未完成任何一组动作，按规则不计入完成次数，也不伪造训练容量。
                </div>
              ) : (
                <div className="divide-y divide-[#F4EFE6]/8">
                  {selectedRecord.loggedSets.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#F4EFE6] truncate">
                          R{item.round} · {item.exerciseName}
                          {item.side === 'left' ? '（左）' : item.side === 'right' ? '（右）' : ''}
                        </div>
                        <div className="mt-0.5 font-mono-num text-[11px] text-[#A89F94]">
                          {item.weightUsed} · 实休 {item.actualRestSeconds}s
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono-num font-bold text-[#D9BE94]">
                          {item.actualReps}/{item.targetReps} {item.unit}
                        </div>
                        <div className="text-[#A89F94] mt-0.5">{item.effort}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedRecord.skippedRecords.length > 0 && (
              <div className="mt-5">
                <div className="text-[12.5px] font-semibold text-[#D88A38] mb-2">
                  跳过动作（{selectedRecord.skippedRecords.length} 项 · 未计为完成）
                </div>
                <div className="space-y-1.5">
                  {selectedRecord.skippedRecords.map((sk, idx) => (
                    <div
                      key={`${sk.timestamp}-${idx}`}
                      className="rounded-xl bg-[#14110F] px-3 py-2 text-[12px] text-[#A89F94] flex items-center justify-between"
                    >
                      <span>
                        R{sk.round} · {sk.exerciseName}
                      </span>
                      <span className="font-mono-num text-[11px]">{sk.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 主档案视图
  const filteredRecords = records.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'strength') return rec.category === '力量 A' || rec.category === '力量 B';
    if (filter === 'cardio') return rec.category === '有氧';
    return rec.category === '恢复日';
  });

  // 严格排除 0 组提前结束，绝不虚报完成次数
  const countedSessions = records.filter((r) => r.outcome !== 'early_exit_zero');
  const fullCompletedCount = records.filter((r) => r.outcome === 'completed').length;
  const totalMinutes = Math.round(
    countedSessions.reduce((sum, r) => sum + r.durationSeconds, 0) / 60
  );
  const totalLoggedSets = records.reduce((sum, r) => sum + r.loggedSets.length, 0);

  const featuredRecord =
    viewMode === 'reel' && filter === 'all' && filteredRecords.length > 0
      ? filteredRecords[0]
      : null;
  const remainingRecords = featuredRecord ? filteredRecords.slice(1) : filteredRecords;

  return (
    <div className="relative flex h-full flex-col bg-[#0B0908] text-[#F4EFE6]">
      {/* 顶部档案头 */}
      <div className={`${topSafePad} px-5 pb-3 flex items-end justify-between gap-2 shrink-0`}>
        <div>
          <div className="text-[11px] text-[#A89F94]">个人影像实录</div>
          <h1 className="font-display-a text-[28px] font-bold tracking-tight text-[#F4EFE6] leading-none mt-0.5">
            训练档案
          </h1>
        </div>

        <div className="inline-flex p-0.5 rounded-lg bg-[#14110F] border border-[#F4EFE6]/10">
          <button
            type="button"
            onClick={() => setViewMode('reel')}
            className={`h-8 px-3 rounded-md text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              viewMode === 'reel' ? 'bg-[#F4EFE6] text-[#0B0908]' : 'text-[#A89F94] hover:text-[#F4EFE6]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>影集</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`h-8 px-3 rounded-md text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              viewMode === 'calendar' ? 'bg-[#F4EFE6] text-[#0B0908]' : 'text-[#A89F94] hover:text-[#F4EFE6]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>月历</span>
          </button>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="px-5 pb-3 flex items-center gap-1.5 overflow-x-auto iphone-scroll shrink-0">
        {(
          [
            { id: 'all', label: '全部档案' },
            { id: 'strength', label: '力量' },
            { id: 'cardio', label: '有氧' },
            { id: 'recovery', label: '恢复' },
          ] as { id: CategoryFilter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[34px] px-3.5 rounded-lg text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              filter === tab.id
                ? 'bg-[#BA4832] text-[#F4EFE6]'
                : 'bg-[#14110F] text-[#A89F94] hover:text-[#F4EFE6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 主滚动档案流 */}
      <div className={`iphone-scroll flex-1 overflow-y-auto px-5 ${scrollBottomPad}`}>
        {/* 事实累计条 */}
        <section className="grid grid-cols-3 gap-2 py-3 border-y border-[#F4EFE6]/10">
          <div>
            <div className="font-mono-num text-[20px] font-bold text-[#F4EFE6]">
              {countedSessions.length}
              <span className="text-[11px] font-normal text-[#A89F94] ml-1">
                (完整 {fullCompletedCount})
              </span>
            </div>
            <div className="text-[11px] text-[#A89F94] mt-0.5">有效训练次数</div>
          </div>
          <div>
            <div className="font-mono-num text-[20px] font-bold text-[#F4EFE6]">
              {totalMinutes}
              <span className="text-[11px] font-normal text-[#A89F94] ml-1">min</span>
            </div>
            <div className="text-[11px] text-[#A89F94] mt-0.5">累计有效时长</div>
          </div>
          <div>
            <div className="font-mono-num text-[20px] font-bold text-[#D9BE94]">
              {totalLoggedSets}
            </div>
            <div className="text-[11px] text-[#A89F94] mt-0.5">累计实录组</div>
          </div>
        </section>

        {/* 月历格 */}
        {viewMode === 'calendar' && (
          <section className="mt-4 rounded-xl bg-[#14110F] p-4 border border-[#F4EFE6]/8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#F4EFE6]">2026 年 11 月</span>
              <div className="flex items-center gap-3 text-[10.5px] text-[#A89F94]">
                <span>完整</span>
                <span className="text-[#D88A38]">部分</span>
                <span className="text-[#70685F]">0组终止</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center font-mono-num text-[11px]">
              {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                <div key={w} className="text-[#70685F] pb-1">
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
                    ? 'bg-[#D9BE94] text-[#0B0908] font-bold'
                    : match.outcome === 'early_exit_partial'
                    ? 'bg-[#D88A38]/25 text-[#D88A38] ring-1 ring-[#D88A38]/60'
                    : 'bg-[#F4EFE6]/12 text-[#A89F94]'
                  : 'text-[#70685F]';

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!match}
                    onClick={() => match && onSelectRecord(match)}
                    className={`h-8 rounded-lg flex items-center justify-center transition-colors ${bgClass} ${
                      match ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 最新入档 16:9 宽银幕重点档案 */}
        {featuredRecord && (
          <section className="mt-4">
            <div className="flex items-center justify-between text-[11.5px] text-[#A89F94] mb-2">
              <span>最新入档实录</span>
              <span>{featuredRecord.isDemoData ? '演示样本档案' : '本次真实实录'}</span>
            </div>

            <button
              type="button"
              onClick={() => onSelectRecord(featuredRecord)}
              className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#14110F] text-left group cursor-pointer"
            >
              <img
                src={getArchiveStillForSession(featuredRecord)}
                alt={featuredRecord.title}
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                  featuredRecord.outcome === 'early_exit_zero'
                    ? 'grayscale brightness-50'
                    : 'brightness-90'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908] via-[#0B0908]/45 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono-num text-[#D8D0C5]">
                    {featuredRecord.dateLabel} {featuredRecord.weekday}
                  </span>
                  <span aria-hidden="true" className="text-[#F4EFE6]/30">·</span>
                  <span className="text-[#F4EFE6]">{featuredRecord.category}</span>
                  <span aria-hidden="true" className="text-[#F4EFE6]/30">·</span>
                  <span
                    className={
                      featuredRecord.outcome === 'completed'
                        ? 'text-[#D9BE94] font-semibold'
                        : featuredRecord.outcome === 'early_exit_partial'
                        ? 'text-[#D88A38] font-semibold'
                        : 'text-[#A89F94]'
                    }
                  >
                    {featuredRecord.outcome === 'completed'
                      ? '完整完成'
                      : featuredRecord.outcome === 'early_exit_partial'
                      ? '部分完成'
                      : '提前结束（0组）'}
                  </span>
                </div>

                <h2 className="font-display-a mt-1 text-[22px] font-bold leading-tight text-[#F4EFE6]">
                  {featuredRecord.title}
                </h2>

                <div className="mt-1 flex items-center justify-between font-mono-num text-[11.5px] text-[#C8C0B5]">
                  <span>
                    {formatTimeMMSS(featuredRecord.durationSeconds)} ·{' '}
                    {featuredRecord.loggedSets.length}/{featuredRecord.plannedSetsCount} 组 ·{' '}
                    {featuredRecord.primaryWeightLabel}
                  </span>
                  <span className="text-[#F4EFE6] flex items-center gap-0.5">
                    <span>实录</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* 影像训练档案胶片行 */}
        <section className="mt-5">
          <div className="flex items-center justify-between text-[11.5px] text-[#70685F] mb-1">
            <span>往期训练影像档案</span>
            <span>点击查看逐组重量与次数</span>
          </div>

          <div className="divide-y divide-[#F4EFE6]/8">
            {remainingRecords.map((rec) => {
              const isCompleted = rec.outcome === 'completed';
              const isPartial = rec.outcome === 'early_exit_partial';
              const isZero = rec.outcome === 'early_exit_zero';
              const stillUrl = getArchiveStillForSession(rec);

              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecord(rec)}
                  className="w-full py-3.5 flex items-center gap-3.5 text-left group cursor-pointer"
                >
                  {/* 16:9 档案缩略剧照 */}
                  <div className="relative w-[114px] aspect-[16/9] rounded-lg overflow-hidden shrink-0 bg-[#14110F]">
                    <img
                      src={stillUrl}
                      alt={rec.title}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] ${
                        isZero ? 'grayscale opacity-55' : 'brightness-90'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908]/80 via-transparent to-transparent" />
                    <span className="absolute bottom-1 right-1.5 font-mono-num text-[10px] font-medium text-[#F4EFE6]/90">
                      {formatTimeMMSS(rec.durationSeconds)}
                    </span>
                  </div>

                  {/* 右侧内容信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono-num text-[#A89F94]">
                        {rec.dateLabel} {rec.weekday}
                      </span>
                      <span aria-hidden="true" className="text-[#F4EFE6]/25">·</span>
                      <span
                        className={`font-semibold ${
                          isCompleted
                            ? 'text-[#D9BE94]'
                            : isPartial
                            ? 'text-[#D88A38]'
                            : 'text-[#70685F]'
                        }`}
                      >
                        {isCompleted ? '完整完成' : isPartial ? '部分完成' : '提前结束(0组)'}
                      </span>
                      {!rec.isDemoData && (
                        <span className="font-mono-num text-[10px] text-[#BA4832]">[本次实录]</span>
                      )}
                    </div>

                    <div className="mt-0.5 text-[14px] font-semibold text-[#F4EFE6] truncate">
                      {rec.category} · {rec.title}
                    </div>

                    <div className="mt-0.5 font-mono-num text-[11px] text-[#70685F] truncate">
                      {rec.loggedSets.length}/{rec.plannedSetsCount} 组 · {rec.primaryWeightLabel}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#70685F] group-hover:text-[#F4EFE6] shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
