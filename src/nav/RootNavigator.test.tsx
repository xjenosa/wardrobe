import { render, screen, userEvent } from '@testing-library/react-native';

import App from '../../App';
import { weekdayOf } from '../screens/today/TodayFrame';
import { drawn } from '../strings/drawn';
import { screens, stub } from '../strings/screens';
import { navigationRef } from './RootNavigator';

/* STEP 0 IS DONE WHEN EVERY TRACK CAN LAND ON ITS OWN SCREEN, WHERE ITS PLATE
   PUTS IT (docs/Build_Plan.md). Every screen is reached from the first one, the
   way a person would, and then the test asks what is on top: the tabs, so the
   tab bar shows, or the one screen that covers them. */
const paths: [string, string[], string][] = [
  [screens.today, [], 'Tabs'],
  [weekdayOf(new Date()), [screens.noForecast], 'Tabs'],
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
