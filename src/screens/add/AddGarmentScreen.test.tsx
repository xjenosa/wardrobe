import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadCloset, resetCloset } from '../../lib/store';
import { navigationRef, RootNavigator } from '../../nav/RootNavigator';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';

const t = drawn.fig18;

async function openAdd() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: /^Closet, tab,/ }));
  await user.press(screen.getByRole('button', { name: screens.addGarment }));
  await screen.findByRole('header', { name: t.newGarment });
  return user;
}

const saveButton = () => screen.getByRole('button', { name: t.saveToCloset });
const onTop = () => {
  const root = navigationRef.getRootState();
  return root?.routes[root.index]?.name;
};

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

it('cannot be saved until it is a garment', async () => {
  const user = await openAdd();
  expect(saveButton()).toBeDisabled();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  expect(saveButton()).toBeDisabled();
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  expect(saveButton()).toBeEnabled();
});

it('lets an accessory leave warmth out', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  expect(saveButton()).toBeEnabled();
});

it('saves to the closet and goes back', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), '  Camel topcoat ');
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(screen.getByRole('radio', { name: 'Smart' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet).toMatchObject({ ok: true, garments: [{ name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm', style: 'Smart' }] });
  expect(onTop()).toBe('Tabs');
});

it('adds to the closet it finds and does not replace it', async () => {
  await resetCloset([{ id: 'g1', name: 'Navy overcoat', category: 'Outerwear', warmth: 'Warmest' }]);
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments.map((g) => g.name)).toEqual(['Navy overcoat', 'Charcoal beanie']);
});

it('keeps everything entered when the save fails', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
  await user.press(saveButton());

  expect(await screen.findByText(capture.saveFailed)).toBeOnTheScreen();
  expect(screen.getByLabelText(t.name)).toHaveDisplayValue('Camel topcoat');
  expect(onTop()).toBe('AddGarment');
  expect(saveButton()).toBeEnabled();
});

it('does not write over a closet that could not be read', async () => {
  await AsyncStorage.setItem('wardrobe.closet', '{not json');
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  await user.press(saveButton());

  expect(await screen.findByText(capture.saveFailed)).toBeOnTheScreen();
  expect(await AsyncStorage.getItem('wardrobe.closet')).toBe('{not json');
});

it('saves nothing on cancel', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('button', { name: t.cancel }));

  expect(onTop()).toBe('Tabs');
  await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [] });
});

it('adds the garment once when Save is pressed twice before the screen updates', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  /* Both presses reach the handler this render gave the button, before the
     screen has updated to say it is saving. */
  const click = saveButton().props.onClick as (event: object) => void;
  const press = () => click({ stopPropagation() {}, nativeEvent: {} });
  await act(async () => {
    press();
    press();
  });

  const closet = await loadCloset();
  expect(closet.ok && closet.garments).toHaveLength(1);
});

it('clears a warmth that is chosen again, and then wants one', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));

  expect(screen.getByRole('radio', { name: 'Warm' })).not.toBeChecked();
  expect(saveButton()).toBeDisabled();
});

it('lets an accessory take its warmth back', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0]).not.toHaveProperty('warmth');
});

/* Same check as First run: the full-screen modal pads the status bar from the
   insets in exactly one place, and never through a SafeAreaView (which would
   double the top on Android). */
type Drawn = { type: string; props: Record<string, unknown>; children: (Drawn | string)[] };
const everything = (el: Drawn): Drawn[] => [el, ...el.children.flatMap((c) => (typeof c === 'string' ? [] : everything(c)))];
const GAPS = ['paddingTop', 'paddingVertical', 'padding', 'marginTop', 'marginVertical', 'margin', 'top', 'height'] as const;

it('makes room for the status bar exactly once', async () => {
  const top = 62;
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top, bottom: 34, left: 0, right: 0 });
  await openAdd();
  let page = screen.getByRole('header', { name: t.newGarment }) as unknown as Drawn & { parent: Drawn | null };
  while (page.parent && !/^RNS.*Screen$/.test(page.type)) page = page.parent as typeof page;
  const elements = everything(page);
  const gaps = elements.flatMap((el) =>
    Object.keys(el.props)
      .filter((prop) => prop === 'style' || prop.endsWith('Style'))
      .flatMap((prop) => {
        const style = (StyleSheet.flatten(el.props[prop] as StyleProp<ViewStyle>) ?? {}) as Record<string, unknown>;
        return GAPS.filter((k) => style[k] === top).map((k) => el.type + ' ' + prop + ' ' + k);
      }),
  );
  expect(gaps).toHaveLength(1);
  expect(elements.some((el) => el.type === 'RNCSafeAreaView')).toBe(false);
});
