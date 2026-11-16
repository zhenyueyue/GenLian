import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { HistorySessionRecord } from '../../data/appRecords';
import { formatTimeMMSS } from '../../hooks/useWorkoutSimulator';
import { DeviceSize } from '../../types/design';

interface WorkoutHistoryViewProps {
  deviceSize: DeviceSize;
  records: HistorySessionRecord[];
  selectedRecord: HistorySessionRecord | null;
  onSelectRecord: (record: HistorySessionRecord | null) => void;
}

type CategoryFilter = 'all' | 'strength' | 'cardio' | 'recovery';

const NOV_CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * 3. 训练历史（History Tab）
 * - 支持时间线与月历格切换、力量/有氧/恢复分类筛选
 * - 严格区分「完整完成」「部分完成」「提前结束（0组·不计入完成次数）」
 * - 清晰区分「当前会话实录」与「历史演示数据」
 * - 支持点入单次训练详情，查看每组重量、实际次数与主观难度
 */
export const WorkoutHistoryView: React.FC<WorkoutHistoryViewProps> = ({
  deviceSize,
  records,
  selectedRecord,
  onSelectRecord,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const isSE = deviceSize === 'se';
  const topSafePad = isSE ? 'pt-[34px]' : 'pt-[52px]';
  const scrollBottomPad = isSE ? 'pb-24' : 'pb-28';

  // 单次训练详情页
  if (selectedRecord) {
    const isCompleted = selectedRecord.outcome === 'completed';
    const isZero = selectedRecord.outcome === 'early_exit_zero';
    const totalReps = selectedRecord.loggedSets.reduce((sum, s) => sum + s.actualReps, 0);

    return (
      <div className="relative flex h-full flex-col bg-[#0B0D10] text-[#F1F3F5]">
        <div className={`${topSafePad} px-5 pb-3 border-b border-white/8 flex items-center justify-between shrink-0`}>
          <button
            type="button"
            onClick={() => onSelectRecord(null)}
            className="min-h-[38px] pr-2 flex items-center gap-1 text-[13px] font-medium text-white hover:text-[#C8F542] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回记录</span>
          </button>
          <span className="font-mono-num text-[11px] text-[#8E95A0]">
            {selectedRecord.isDemoData ? '演示样本数据' : '本次会话实录'}
          </span>
        </div>

        <div className={`iphone-scroll flex-1 overflow-y-auto px-5 pt-4 ${scrollBottomPad}`}>
          <div
            className={`text-[12.5px] font-semibold ${
              isCompleted ? 'text-[#C8F542]' : isZero ? 'text-[#8E95A0]' : 'text-[#E3A05B]'
            }`}
          >
            {selectedRecord.category} ·{' '}
            {isCompleted
              ? '完整完成'
              : isZero
              ? '提前结束（0 组·未计入完成次数）'
              : '部分完成（保留实录）'}
          </div>

          <h1 className="font-display-b mt-1 text-[24px] font-extrabold leading-tight text-white">
            {selectedRecord.title}
          </h1>

          <div className="mt-1.5 font-mono-num text-[12px] text-[#8E95A0]">
            {selectedRecord.dateLabel} {selectedRecord.weekday} · {selectedRecord.startedAt} →{' '}
            {selectedRecord.endedAt} · 暂停 {selectedRecord.pausedSeconds}s
          </div>

          {selectedRecord.note && (
            <p className="mt-3 rounded-xl bg-[#16191E] px-3.5 py-2.5 text-[12.5px] text-[#C8CDD6] leading-relaxed">
              {selectedRecord.note}
            </p>
          )}

          {/* 3 项实录统计 */}
          <div className="mt-4 grid grid-cols-3 gap-2 py-3.5 border-y border-white/8">
            <div>
              <div className="font-mono-num text-[21px] font-bold text-white">
                {selectedRecord.loggedSets.length}/{selectedRecord.plannedSetsCount}
              </div>
              <div className="text-[11px] text-[#8E95A0] mt-0.5">实录组数</div>
            </div>
            <div>
              <div className="font-mono-num text-[21px] font-bold text-white">{totalReps}</div>
              <div className="text-[11px] text-[#8E95A0] mt-0.5">总次数/秒</div>
            </div>
            <div>
              <div className="font-mono-num text-[21px] font-bold text-[#C8F542]">
                {formatTimeMMSS(selectedRecord.durationSeconds)}
              </div>
              <div className="text-[11px] text-[#8E95A0] mt-0.5">有效时长</div>
            </div>
          </div>

          {/* 逐组动作、重量与主观难度明细 */}
          <div className="mt-5">
            <div className="text-[13px] font-semibold text-white mb-2">
              动作实录明细（{selectedRecord.loggedSets.length} 组）
            </div>
            {selectedRecord.loggedSets.length === 0 ? (
              <div className="rounded-xl bg-[#16191E] p-4 text-[12.5px] text-[#8E95A0] leading-relaxed">
                本次未完成任何一组动作，按规则不计入完成次数，也不伪造训练容量。
              </div>
            ) : (
              <div className="divide-y divide-white/8">
                {selectedRecord.loggedSets.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-2 text-[12px]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        R{item.round} · {item.exerciseName}
                        {item.side === 'left' ? '（左）' : item.side === 'right' ? '（右）' : ''}
                      </div>
                      <div className="mt-0.5 font-mono-num text-[11.5px] text-[#8E95A0]">
                        {item.weightUsed} · 实休 {item.actualRestSeconds}s
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono-num font-bold text-[#C8F542]">
                        {item.actualReps}/{item.targetReps} {item.unit}
                      </div>
                      <div className="text-[#9EA4AE] mt-0.5">{item.effort}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedRecord.skippedRecords.length > 0 && (
            <div className="mt-5">
              <div className="text-[12.5px] font-semibold text-[#E3A05B] mb-2">
                跳过动作（{selectedRecord.skippedRecords.length} 项）
              </div>
              <div className="space-y-1.5">
                {selectedRecord.skippedRecords.map((sk, idx) => (
                  <div
                    key={`${sk.timestamp}-${idx}`}
                    className="rounded-xl bg-[#16191E] px-3 py-2 text-[12px] text-[#9EA4AE] flex items-center justify-between"
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
    );
  }

  // 主列表 / 日历视图
  const filteredRecords = records.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'strength') return rec.category === '力量 A' || rec.category === '力量 B';
    if (filter === 'cardio') return rec.category === '有氧';
    return rec.category === '恢复日';
  });

  // 严格不将 0 组提前结束计入完成训练次数
  const countedSessions = records.filter((r) => r.outcome !== 'early_exit_zero');
  const fullCompletedCount = records.filter((r) => r.outcome === 'completed').length;
  const totalMinutes = Math.round(
    countedSessions.reduce((sum, r) => sum + r.durationSeconds, 0) / 60
  );
  const totalLoggedSets = records.reduce((sum, r) => sum + r.loggedSets.length, 0);

  return (
    <div className="relative flex h-full flex-col bg-[#0B0D10] text-[#F1F3F5]">
      {/* 顶部栏 */}
      <div className={`${topSafePad} px-5 pb-3 flex items-center justify-between gap-2 shrink-0`}>
        <div>
          <div className="font-mono-num text-[11px] text-[#8E95A0]">TRAINING LOGBOOK</div>
          <h1 className="font-display-b text-[22px] font-bold tracking-tight text-white">
            训练历史
          </h1>
        </div>

        <div className="inline-flex p-1 rounded-full bg-[#16191E] border border-white/8">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`h-8 px-3 rounded-full text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer ${
              viewMode === 'timeline' ? 'bg-white text-[#111315]' : 'text-[#8E95A0]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>时间线</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`h-8 px-3 rounded-full text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer ${
              viewMode === 'calendar' ? 'bg-white text-[#111315]' : 'text-[#8E95A0]'
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
            { id: 'all', label: '全部' },
            { id: 'strength', label: '力量' },
            { id: 'cardio', label: '有氧' },
            { id: 'recovery', label: '恢复' },
          ] as { id: CategoryFilter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[34px] px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              filter === tab.id
                ? 'bg-[#C8F542] text-[#111315]'
                : 'bg-[#16191E] text-[#9EA4AE] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容滚动区 */}
      <div className={`iphone-scroll flex-1 overflow-y-auto px-5 ${scrollBottomPad}`}>
        {/* 事实统计汇总（仅计入实际完成/部分完成，绝不含 0 组退出） */}
        <section className="grid grid-cols-3 gap-2 py-3.5 border-y border-white/8">
          <div>
            <div className="font-mono-num text-[20px] font-bold text-white">
              {countedSessions.length}
              <span className="text-[11px] font-normal text-[#8E95A0] ml-1">
                (完整 {fullCompletedCount})
              </span>
            </div>
            <div className="text-[11px] text-[#8E95A0] mt-0.5">有效训练次数</div>
          </div>
          <div>
            <div className="font-mono-num text-[20px] font-bold text-white">
              {totalMinutes}
              <span className="text-[11px] font-normal text-[#8E95A0] ml-1">min</span>
            </div>
            <div className="text-[11px] text-[#8E95A0] mt-0.5">累计有效时长</div>
          </div>
          <div>
            <div className="font-mono-num text-[20px] font-bold text-[#C8F542]">
              {totalLoggedSets}
            </div>
            <div className="text-[11px] text-[#8E95A0] mt-0.5">累计实录组</div>
          </div>
        </section>

        {viewMode === 'calendar' && (
          <section className="mt-4 rounded-2xl bg-[#16191E] p-4 border border-white/8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-white">2026 年 11 月</span>
              <div className="flex items-center gap-3 text-[10.5px] text-[#8E95A0]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#C8F542]" /> 完整
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#E3A05B]" /> 部分
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/30" /> 0组终止
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center font-mono-num text-[11px]">
              {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                <div key={w} className="text-[#6E7580] pb-1">
                  {w}
                </div>
              ))}
              {/* Nov 1 2026 is Sunday -> 6 leading empty cells */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {NOV_CALENDAR_DAYS.map((day) => {
                const iso = `2026-11-${String(day).padStart(2, '0')}`;
                const match = records.find((r) => r.isoDate === iso);
                const bgClass = match
                  ? match.outcome === 'completed'
                    ? 'bg-[#C8F542] text-[#111315] font-bold'
                    : match.outcome === 'early_exit_partial'
                    ? 'bg-[#E3A05B]/25 text-[#E3A05B] ring-1 ring-[#E3A05B]/60'
                    : 'bg-white/12 text-white/65'
                  : 'text-[#8E95A0]';

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

        {/* 时间线列表 */}
        <section className="mt-4">
          <div className="flex items-center justify-between text-[11.5px] text-[#7D8490] mb-1">
            <span>点击单次记录查看动作重量与主观难度</span>
            <span>含演示样本标注</span>
          </div>

          <div className="divide-y divide-white/8">
            {filteredRecords.map((rec) => {
              const isCompleted = rec.outcome === 'completed';
              const isPartial = rec.outcome === 'early_exit_partial';

              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecord(rec)}
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11.5px]">
                      <span className="font-mono-num text-[#8E95A0]">
                        {rec.dateLabel} {rec.weekday}
                      </span>
                      <span aria-hidden="true" className="text-white/25">·</span>
                      <span className="text-[#C8CDD6] font-medium">{rec.category}</span>
                      <span aria-hidden="true" className="text-white/25">·</span>
                      <span
                        className={`font-semibold ${
                          isCompleted
                            ? 'text-[#C8F542]'
                            : isPartial
                            ? 'text-[#E3A05B]'
                            : 'text-[#7D8490]'
                        }`}
                      >
                        {isCompleted
                          ? '完整完成'
                          : isPartial
                          ? '部分完成'
                          : '提前结束（0组）'}
                      </span>
                      {!rec.isDemoData && (
                        <span className="font-mono-num text-[10px] text-[#C8F542]">[本次实录]</span>
                      )}
                    </div>

                    <div className="mt-1 text-[15px] font-semibold text-white truncate">
                      {rec.title}
                    </div>

                    <div className="mt-0.5 font-mono-num text-[11.5px] text-[#8E95A0] truncate">
                      {formatTimeMMSS(rec.durationSeconds)} · {rec.loggedSets.length}/
                      {rec.plannedSetsCount} 组 · {rec.primaryWeightLabel}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#6E7580] group-hover:text-white shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
