/* A moment as the phone's own calendar day, YYYY-MM-DD in local time. The kept
   answer and the wear record both key on it, so "today" means the same day to
   both. */
export const dayOf = (d: Date) =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
