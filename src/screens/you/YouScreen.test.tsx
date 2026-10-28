import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { loadPrefs } from '../../lib/prefs';
import { loadReference, removeReference } from '../../lib/reference';
import { navigationRef, RootNavigator } from '../../nav/RootNavigator';
import { drawn } from '../../strings/drawn';
import { frame } from '../../strings/frame';
import { screens, stub } from '../../strings/screens';

jest.mock('../../lib/reference', () => ({
  loadReference: jest.fn(() => ({ ok: true, uri: null })),
  removeReference: jest.fn(() => ({ ok: true })),
  pickReference: jest.fn(),
}));

const t = drawn.fig23;

/* The sample closet replaces whatever is saved, so it is offered only while
   there is no service to keep a real closet for. */
afterEach(() => {
  delete process.env.EXPO_PUBLIC_PICK_URL;
});

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.mocked(loadReference).mockReturnValue({ ok: true, uri: null });
  jest.mocked(removeReference).mockReturnValue({ ok: true });
  await AsyncStorage.clear();
});

const onTop = () => {
  const root = navigationRef.getRootState();
  return root?.routes[root.index]?.name;
};

async function openYou() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: screens.you }));
  await screen.findByRole('header', { name: screens.you });
  return user;
}

it('offers the sample closet and the fixture days with no service', async () => {
  await openYou();
  expect(screen.getByText(stub.withoutService)).toBeOnTheScreen();
  for (const name of [stub.sampleCloset, stub.fixtureFits, stub.fixtureNothingFits]) {
    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  }
});

it('offers none of them with a service address set', async () => {
  process.env.EXPO_PUBLIC_PICK_URL = 'https://pick.example';
  await openYou();
  expect(screen.queryByText(stub.withoutService)).toBeNull();
  for (const name of [stub.sampleCloset, stub.fixtureFits, stub.fixtureNothingFits]) {
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
});

/* docs/Acceptance.md asks that You's list is grouped in sections in Fig 23's
   order, and that there is no theme setting (ADR 0008). */
it("lists its sections and rows in Fig 23's order, with no theme among them", async () => {
  await openYou();
  const order = [t.preferences, t.location, t.units, t.resetPreferences, t.pictures, t.openaiKey, t.storedOnThisDeviceOnly, t.referencePhoto];
  const words = screen.getAllByText(/./).map((el) => el.props.children);
  const at = order.map((w) => words.indexOf(w));
  expect(at.every((i) => i >= 0)).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
  expect(screen.queryByText(/theme/i)).toBeNull();
});

/* Fig 23 sets You's title row 4 in from each side (.you-name) and runs the
   rule under it the page's full width. Each edge is measured from the page's
   own padding, adding every margin on the way down and every padding above. */
type Drawn = { type: string; props: Record<string, unknown>; parent: Drawn | null; children: (Drawn | string)[] };
const n = (v: unknown) => (typeof v === 'number' ? v : 0);
function inFrom(side: 'Left' | 'Right', el: Drawn) {
  let at = 0;
  for (let node: Drawn | null = el; node && node.parent?.type !== 'RCTScrollView'; node = node.parent) {
    const s = (StyleSheet.flatten(node.props.style as StyleProp<ViewStyle>) ?? {}) as Record<string, unknown>;
    at += n(s['margin' + side] ?? s.marginHorizontal ?? s.margin);
    if (node !== el) at += n(s['padding' + side] ?? s.paddingHorizontal ?? s.padding);
  }
  return at;
}

it("sets the title row in by 4 and runs the rule under it the full width, as Fig 23 does", async () => {
  await openYou();
  const row = (screen.getByRole('header', { name: screens.you }) as unknown as Drawn).parent!.parent!;
  const rule = row.parent!.children[1] as Drawn;
  for (const side of ['Left', 'Right'] as const) {
    expect(inFrom(side, row)).toBe(4);
    expect(inFrom(side, rule)).toBe(0);
  }
});

it('closes back to what opened it', async () => {
  const user = await openYou();
  await user.press(screen.getByRole('button', { name: t.close }));
  expect(onTop()).toBe('Tabs');
});

it('chooses the units the sentences print degrees in, Celsius first, and keeps the choice', async () => {
  const user = await openYou();
  expect(screen.getByLabelText(t.units)).toHaveProp('accessibilityRole', 'radiogroup');
  expect(screen.getByRole('radio', { name: t.c })).toBeChecked();
  await user.press(screen.getByRole('radio', { name: t.f }));
  expect(screen.getByRole('radio', { name: t.f })).toBeChecked();
  await expect(loadPrefs()).resolves.toEqual({ ok: true, prefs: { units: 'F' } });
});

it('resets the preferences to Celsius', async () => {
  const user = await openYou();
  await user.press(screen.getByRole('radio', { name: t.f }));
  await user.press(screen.getByRole('button', { name: t.reset }));
  expect(screen.getByRole('radio', { name: t.c })).toBeChecked();
  await expect(loadPrefs()).resolves.toEqual({ ok: true, prefs: { units: 'C' } });
});

it('says a choice could not be saved, keeps the one there was, and tries again', async () => {
  const user = await openYou();
  /* the storage double is shared by every test, so its count starts here */
  const writing = jest.spyOn(AsyncStorage, 'setItem');
  writing.mockClear();
  writing.mockRejectedValueOnce(new Error('full'));
  await user.press(screen.getByRole('radio', { name: t.f }));
  expect(screen.getByRole('alert')).toHaveTextContent(frame.prefsNotSaved);
  expect(screen.getByRole('radio', { name: t.c })).toBeChecked();
  await user.press(screen.getByRole('button', { name: drawn.fig11.tryAgain }));
  expect(writing).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('radio', { name: t.f })).toBeChecked();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('says preferences it cannot read could not be read, holds Units still, and reads them again', async () => {
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('io'));
  const user = await openYou();
  expect(screen.getByRole('alert')).toHaveTextContent(frame.prefsUnreadable);
  expect(screen.getByRole('radio', { name: t.c })).toBeDisabled();
  expect(screen.getByRole('button', { name: t.reset })).toBeEnabled();
  await user.press(screen.getByRole('button', { name: drawn.fig11.tryAgain }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('radio', { name: t.c })).toBeEnabled();
});

/* Reset is the person's say-so, as forgetting the wear log is (ADR 0023), and
   the only way out of a save from another version, which reading again never
   fixes (ADR 0026). */
it('resets preferences it cannot read, the way out of a save that will never read', async () => {
  await AsyncStorage.setItem('wardrobe.prefs', JSON.stringify({ version: 2, units: 'F' }));
  const user = await openYou();
  await user.press(screen.getByRole('button', { name: drawn.fig11.tryAgain }));
  expect(screen.getByRole('alert')).toHaveTextContent(frame.prefsUnreadable);
  await user.press(screen.getByRole('button', { name: t.reset }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('radio', { name: t.c })).toBeChecked();
  expect(screen.getByRole('radio', { name: t.c })).toBeEnabled();
  await expect(loadPrefs()).resolves.toEqual({ ok: true, prefs: { units: 'C' } });
});

it('draws Location and the key as values not known yet, which open nothing', async () => {
  await openYou();
  expect(screen.getAllByText(drawn.fig14D.s)).toHaveLength(2);
  expect(screen.queryByRole('button', { name: drawn.fig14D.s })).toBeNull();
});

it('changes the reference photo on First run', async () => {
  const user = await openYou();
  await user.press(screen.getByRole('button', { name: t.change }));
  expect(onTop()).toBe('FirstRun');
});

it('has nothing to remove without a photo', async () => {
  await openYou();
  expect(screen.getByRole('button', { name: t.remove })).toBeDisabled();
});

it('removes the photo there is', async () => {
  jest.mocked(loadReference).mockReturnValue({ ok: true, uri: 'file:///documents/reference/photo-1.jpg' });
  const user = await openYou();
  const remove = screen.getByRole('button', { name: t.remove });
  expect(remove).toBeEnabled();
  await user.press(remove);
  expect(removeReference).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: t.remove })).toBeDisabled();
});

it('says a photo it could not remove is still there', async () => {
  jest.mocked(loadReference).mockReturnValue({ ok: true, uri: 'file:///documents/reference/photo-1.jpg' });
  jest.mocked(removeReference).mockReturnValue({ ok: false });
  const user = await openYou();
  await user.press(screen.getByRole('button', { name: t.remove }));
  expect(screen.getByRole('alert')).toHaveTextContent(frame.photoNotRemoved);
  expect(screen.getByRole('button', { name: t.remove })).toBeEnabled();
});
