/* A FINGER NEEDS 44 POINTS. A piece the plates draw shorter keeps its drawn
   height and reaches the rest with slop above and below it, never to the
   sides, where its neighbours sit. */
export const TOUCH = 44;

export function reach(height: number) {
  const slop = Math.max(0, (TOUCH - height) / 2);
  return { top: slop, bottom: slop };
}
