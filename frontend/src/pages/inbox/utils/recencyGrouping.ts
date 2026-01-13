import { DateTime } from 'luxon';

export enum RecencyGroup {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_MONTH = 'LAST_MONTH',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_YEAR = 'LAST_YEAR',
  OLDER = 'OLDER',
}

export const RECENCY_GROUP_LABELS: Record<RecencyGroup, string> = {
  [RecencyGroup.TODAY]: 'Today',
  [RecencyGroup.YESTERDAY]: 'Yesterday',
  [RecencyGroup.LAST_7_DAYS]: 'Last 7 Days',
  [RecencyGroup.LAST_MONTH]: 'Last Month',
  [RecencyGroup.LAST_3_MONTHS]: 'Last 3 Months',
  [RecencyGroup.LAST_6_MONTHS]: 'Last 6 Months',
  [RecencyGroup.LAST_YEAR]: 'Last Year',
  [RecencyGroup.OLDER]: 'Older',
};

export function getRecencyGroup(dateStr: string): RecencyGroup {
  const date = DateTime.fromISO(dateStr);
  const now = DateTime.now();
  const startOfToday = now.startOf('day');
  const startOfYesterday = startOfToday.minus({ days: 1 });
  const start7DaysAgo = startOfToday.minus({ days: 7 });
  const start1MonthAgo = startOfToday.minus({ months: 1 });
  const start3MonthsAgo = startOfToday.minus({ months: 3 });
  const start6MonthsAgo = startOfToday.minus({ months: 6 });
  const start1YearAgo = startOfToday.minus({ years: 1 });

  if (date >= startOfToday) return RecencyGroup.TODAY;
  if (date >= startOfYesterday) return RecencyGroup.YESTERDAY;
  if (date >= start7DaysAgo) return RecencyGroup.LAST_7_DAYS;
  if (date >= start1MonthAgo) return RecencyGroup.LAST_MONTH;
  if (date >= start3MonthsAgo) return RecencyGroup.LAST_3_MONTHS;
  if (date >= start6MonthsAgo) return RecencyGroup.LAST_6_MONTHS;
  if (date >= start1YearAgo) return RecencyGroup.LAST_YEAR;
  return RecencyGroup.OLDER;
}

export interface GroupedEmails<T> {
  group: RecencyGroup;
  emails: T[];
}

export function groupEmailsByRecency<T extends { receivedAt: string }>(
  emails: T[],
): GroupedEmails<T>[] {
  const groups = new Map<RecencyGroup, T[]>();

  // Initialize all groups in order
  Object.values(RecencyGroup).forEach((group) => {
    groups.set(group, []);
  });

  // Group emails
  emails.forEach((email) => {
    const group = getRecencyGroup(email.receivedAt);
    groups.get(group)!.push(email);
  });

  // Return only non-empty groups in order
  return Object.values(RecencyGroup)
    .map((group) => ({
      group,
      emails: groups.get(group) || [],
    }))
    .filter((g) => g.emails.length > 0);
}
