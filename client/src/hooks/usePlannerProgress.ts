import { useMemo } from 'react';
import { useAttendeeSummary } from '@/api/attendees';
import { useBudgetSummary, usePlannerSchedule, useScheduleDraft } from '@/api/schedule';
import { buildMilestones, hostRank, nextUnlock } from '@/utils/progress';
import type { HostRank, Milestone, NextUnlock, PlannerNumbers } from '@/utils/progress';

interface PlannerProgress {
  /** Null until schedule, budget and RSVP data have all loaded. */
  numbers: PlannerNumbers | null;
  milestones: Milestone[];
  rank: HostRank | null;
  unlock: NextUnlock | null;
  isError: boolean;
  isDraft: boolean;
  refetch: () => void;
}

/**
 * Everything the planner "readiness" widgets need, derived from data already fetched for the
 * dashboard. While an unsaved AI draft is open, it is the draft that is measured.
 */
export function usePlannerProgress(): PlannerProgress {
  const schedule = usePlannerSchedule();
  const draft = useScheduleDraft().data;
  const budget = useBudgetSummary();
  const summary = useAttendeeSummary();

  const items = draft ?? schedule.data;
  const budgetTotal = budget.data?.budget;
  const summaryData = summary.data;

  const numbers = useMemo<PlannerNumbers | null>(
    () =>
      items && budgetTotal !== undefined && summaryData
        ? { items, budget: budgetTotal, summary: summaryData }
        : null,
    [items, budgetTotal, summaryData],
  );

  const derived = useMemo(() => {
    if (!numbers) return { milestones: [], rank: null, unlock: null };
    const milestones = buildMilestones(numbers);
    return { milestones, rank: hostRank(milestones), unlock: nextUnlock(numbers, milestones) };
  }, [numbers]);

  return {
    numbers,
    ...derived,
    isError: (schedule.isError && !draft) || budget.isError || summary.isError,
    isDraft: Boolean(draft),
    refetch: () => {
      void schedule.refetch();
      void budget.refetch();
      void summary.refetch();
    },
  };
}
