import { render, screen, userEvent } from '@testing-library/react-native';
import { Children, type ReactElement, type ReactNode } from 'react';
import { processColor, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import App from '../../App';
import { drawn } from '../strings/drawn';
import { screens, stub } from '../strings/screens';
import { Hanger, Sunrise, type Icon } from '../theme/icons';
import { light } from '../theme/tokens';
import { navigationRef } from './RootNavigator';

/* THE CLOCK IS FAKE AND SET TO FIG 11'S OWN THURSDAY (ADR 0015), so No forecast
   is titled with the plate's word whatever day the suite runs, and a run that
   crosses midnight cannot read two days. Both the date and its weekday are
   local, so the time zone cannot move it either. */
const thursday = new Date(2026, 0, 8, 9, 41);
beforeEach(() => jest.useFakeTimers({ now: thursday }));
afterEach(() => jest.useRealTimers());

/* STEP 0 IS DONE WHEN EVERY TRACK CAN LAND ON ITS OWN SCREEN, WHERE ITS PLATE
   PUTS IT (docs/Build_Plan.md). Every screen is reached from the first one, the
   way a person would, and then the test asks what is on top: the tabs, so the
   tab bar shows, or the one screen that covers them. */
const paths: [string, string[], string][] = [
  [screens.today, [], 'Tabs'],
  [drawn.fig11.thursday, [screens.noForecast], 'Tabs'],
  [screens.weather, [screens.weather], 'Tabs'],
  [screens.closet, ['tab:' + screens.closet], 'Tabs'],
  [screens.you, [screens.you], 'You'],
  [screens.firstRun, [screens.you, screens.firstRun], 'FirstRun'],
  [drawn.fig18.newGarment, ['tab:' + screens.closet, screens.addGarment], 'AddGarment'],
  [screens.itemEditor, ['tab:' + screens.closet, screens.itemEditor], 'ItemEditor'],
];

const onTop = () => {
  const root = navigationRef.getRootState();
  return root?.routes[root.index]?.name;
};

async function walk(steps: string[]) {
  const user = userEvent.setup();
  await render(<App />);
  for (const step of steps) {
    /* a tab is a button labelled "<name>, tab, <n> of <total>" */
    const name = step.startsWith('tab:') ? new RegExp('^' + step.slice(4) + ', tab,') : step;
    await user.press(screen.getByRole('button', { name }));
  }
  return user;
}

it.each(paths)('reaches %s', async (title, steps, top) => {
  await walk(steps);
  expect(await screen.findByRole('header', { name: title })).toBeOnTheScreen();
  expect(onTop()).toBe(top);
});

it('comes back from a screen that covers the tabs', async () => {
  const user = await walk([screens.you]);
  await user.press(screen.getByRole('button', { name: stub.back }));
  expect(onTop()).toBe('Tabs');
});

/* THE TAB BAR DRAWS THE PLATE'S ICONS (Figs 06 to 15), ink on the open tab and
   muted on the other. The bar draws each icon twice and fades one out, so this
   reads the copy that shows. */
type Drawn = { type: string; props: Record<string, unknown>; children: (Drawn | string)[] };
const nodes = (n: Drawn | string): Drawn[] => (typeof n === 'string' ? [] : [n, ...n.children.flatMap(nodes)]);
const shown = (tab: Drawn) =>
  nodes(tab).find(
    (n) =>
      StyleSheet.flatten(n.props.style as StyleProp<ViewStyle>)?.opacity === 1 &&
      n.children.some((c) => typeof c !== 'string' && c.type === 'RNSVGSvgView'),
  );
const pathsOf = (n: Drawn) => nodes(n).flatMap((c) => (c.type === 'RNSVGPath' ? [c.props.d] : []));
const inkOf = (n: Drawn) => nodes(n).flatMap((c) => (c.type === 'RNSVGGroup' ? [(c.props.stroke as { payload?: unknown })?.payload] : []));
const drawingOf = (icon: Icon) =>
  Children.toArray((icon({}) as ReactElement<{ children: ReactNode }>).props.children).map(
    (c) => (c as ReactElement<{ d?: string }>).props.d,
  );

it.each([
  [screens.today, Sunrise, light.ink],
  [screens.closet, Hanger, light.muted],
] as const)('the %s tab draws its icon from the plate, in the colour of an open or closed tab', async (name, icon, ink) => {
  await render(<App />);
  const tab = screen.getByRole('button', { name: new RegExp('^' + name + ', tab,') }) as unknown as Drawn;
  const icons = shown(tab);
  if (!icons) throw new Error('the ' + name + ' tab shows no icon');
  expect(pathsOf(icons)).toEqual(drawingOf(icon));
  expect(inkOf(icons)).toEqual([processColor(ink)]);
});
