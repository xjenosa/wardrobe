import { render, screen, userEvent } from '@testing-library/react-native';

import * as pick from '../../lib/pick';
import { RootNavigator } from '../../nav/RootNavigator';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';
import { NoForecastScreen } from './NoForecastScreen';

const t = drawn.fig11;

/* a Thursday, the plate's own day */
const thursday = new Date(2026, 0, 8, 9, 41);

it('says the forecast failed, and that nothing is picked without it', async () => {
  await render(<NoForecastScreen onRetry={() => {}} now={thursday} />);
  expect(screen.getByRole('alert')).toHaveTextContent(t.couldNotReachTheForecast);
  expect(screen.getByText(t.noPickWithoutAForecast)).toBeOnTheScreen();
});

it('dates the page from the phone, and names no place it does not know', async () => {
  await render(<NoForecastScreen onRetry={() => {}} now={thursday} />);
  expect(screen.getByRole('header', { name: t.thursday })).toBeOnTheScreen();
  expect(screen.getByText('Thu 8 Jan')).toBeOnTheScreen();
});

it('puts the place before the date when the place is known', async () => {
  await render(<NoForecastScreen onRetry={() => {}} now={thursday} place="Toronto, CA" />);
  expect(screen.getByText(t.torontoCaThu8Jan)).toBeOnTheScreen();
});

it('draws every control in its place, and none of them works', async () => {
  await render(<NoForecastScreen onRetry={() => {}} now={thursday} />);
  for (const name of [t.wearThis, t.shuffle, t.whyThis, t.tooWarm, t.tooCold]) {
    expect(screen.getByRole('button', { name })).toBeDisabled();
  }
  expect(screen.getByRole('radio', { name: t.everyday })).toBeChecked();
  for (const name of [t.everyday, t.smart, t.active, t.occasion]) {
    expect(screen.getByRole('radio', { name })).toBeDisabled();
  }
});

/* On a small phone or at a large text size the boxes outgrow the space above
   the tab bar, so the last of them has to be reachable by scrolling. */
it('scrolls, so Why this is never stranded under the tab bar', async () => {
  await render(<NoForecastScreen onRetry={() => {}} now={thursday} />);
  const scrolls = (el: { type: unknown; parent: unknown } | null): boolean =>
    el !== null && (el.type === 'RCTScrollView' || scrolls(el.parent as typeof el));
  expect(scrolls(screen.getByRole('button', { name: t.whyThis }))).toBe(true);
  expect(scrolls(screen.getByRole('header', { name: t.thursday }))).toBe(true);
});

it('asks for no pick', async () => {
  const asked = jest.spyOn(pick, 'pick');
  await render(<NoForecastScreen onRetry={() => {}} now={thursday} />);
  expect(asked).not.toHaveBeenCalled();
});

it('tries again from inside Today, with the tab bar still there', async () => {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: screens.noForecast }));
  await user.press(await screen.findByRole('button', { name: t.tryAgain }));
  expect(await screen.findByRole('header', { name: screens.today })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^Closet, tab,/ })).toBeOnTheScreen();
});
