import { useMemo } from 'react';
import { useAttendee } from '@/api/attendees';
import { useMySchedule } from '@/api/schedule';
import type { Attendee, AttendeeScheduleDTO } from '@/types';
import { buildBadges, buildQuests, computeXp, levelInfo, sortSessions, validStamps } from '@/utils/gamification';
import type { Badge, LevelInfo, Quest } from '@/utils/gamification';

export interface AttendeeProgress {
  attendee: Attendee;
  /** The itinerary in the order it happens. */
  sessions: AttendeeScheduleDTO[];
  /** Ids of sessions the attendee has stamped (only ones still in the itinerary). */
  stamps: Set<string>;
  level: LevelInfo;
  quests: Quest[];
  badges: Badge[];
  earnedBadges: number;
}

interface Result {
  /** Null until both the attendee and the itinerary have loaded. */
  progress: AttendeeProgress | null;
  isError: boolean;
  refetch: () => void;
}

/** XP, level, quests and badges for one attendee, derived from their record and the itinerary. */
export function useAttendeeProgress(attendeeId: string): Result {
  const attendeeQuery = useAttendee(attendeeId);
  const scheduleQuery = useMySchedule();

  const attendee = attendeeQuery.data;
  const schedule = scheduleQuery.data;

  const progress = useMemo<AttendeeProgress | null>(() => {
    if (!attendee || !schedule) return null;
    const sessions = sortSessions(schedule);
    const badges = buildBadges(attendee, sessions);
    return {
      attendee,
      sessions,
      stamps: validStamps(attendee, sessions),
      level: levelInfo(computeXp(attendee, sessions)),
      quests: buildQuests(attendee, sessions),
      badges,
      earnedBadges: badges.filter((badge) => badge.earned).length,
    };
  }, [attendee, schedule]);

  return {
    progress,
    isError: attendeeQuery.isError || scheduleQuery.isError,
    refetch: () => {
      void attendeeQuery.refetch();
      void scheduleQuery.refetch();
    },
  };
}
