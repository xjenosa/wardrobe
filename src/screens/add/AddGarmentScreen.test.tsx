import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';

import App from '../../../App';
import { loadCloset, resetCloset } from '../../lib/store';
import { navigationRef } from '../../nav/RootNavigator';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';

const t = drawn.fig18;

async function openAdd() {
  const user = userEvent.setup();
  await render(<App />);
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
  await user.press(screen.getByRole('button', { name: 'Outerwear' }));
  expect(saveButton()).toBeDisabled();
  await user.press(screen.getByRole('button', { name: 'Warm' }));
  expect(saveButton()).toBeEnabled();
});

it('lets an accessory leave warmth out', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('button', { name: 'Accessories' }));
  expect(saveButton()).toBeEnabled();
});

it('saves to the closet and goes back', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), '  Camel topcoat ');
  await user.press(screen.getByRole('button', { name: 'Outerwear' }));
  await user.press(screen.getByRole('button', { name: 'Warm' }));
  await user.press(screen.getByRole('button', { name: 'Smart' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet).toMatchObject({ ok: true, garments: [{ name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm', style: 'Smart' }] });
  expect(onTop()).toBe('Tabs');
});

it('adds to the closet it finds and does not replace it', async () => {
  await resetCloset([{ id: 'g1', name: 'Navy overcoat', category: 'Outerwear', warmth: 'Warmest' }]);
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('button', { name: 'Accessories' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments.map((g) => g.name)).toEqual(['Navy overcoat', 'Charcoal beanie']);
});

it('keeps everything entered when the save fails', async () => {
  const user = await openAdd();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('button', { name: 'Outerwear' }));
  await user.press(screen.getByRole('button', { name: 'Warm' }));
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
  await user.press(screen.getByRole('button', { name: 'Accessories' }));
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
