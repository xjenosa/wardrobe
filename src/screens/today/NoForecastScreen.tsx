import { useState } from 'react';

import { vibes, type Vibe } from '../../lib/words';
import { drawn } from '../../strings/drawn';
import { Actions, Hero, HeroSay, Notice, TodayHead, TodayPage, VibeRow, WhyRow } from './TodayFrame';

const t = drawn.fig11;

/* FIG 11, THE FORECAST FAILED, built first (ADR 0003). It is Today with the
   weather's box saying so and nothing picked: every control is still drawn in
   its place, disabled, so trying again changes what is in the boxes and not
   the page. No pick is asked for without weather, so pick() is not called. */
export function NoForecastScreen({
  onRetry,
  place,
  vibe = vibes[0],
  now: initial,
}: {
  onRetry: () => void;
  place?: string;
  vibe?: Vibe;
  now?: Date;
}) {
  const [now] = useState(() => initial ?? new Date());
  return (
    <TodayPage>
      <TodayHead now={now} place={place}>
        <Notice text={t.couldNotReachTheForecast} action={t.tryAgain} onPress={onRetry} />
      </TodayHead>
      <Hero>
        <HeroSay text={t.noPickWithoutAForecast} />
      </Hero>
      <VibeRow vibe={vibe} disabled />
      <Actions disabled />
      <WhyRow disabled />
    </TodayPage>
  );
}
