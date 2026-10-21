import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';

import { sampleCloset } from '../../lib/sample';
import { loadCloset, resetCloset } from '../../lib/store';
import { navigationRef, RootNavigator } from '../../nav/RootNavigator';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';

const t = drawn.fig19;

/* The Closet stub opens the first garment of the sample closet, g1. */
async function openEditor() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: /^Closet, tab,/ }));
  await user.press(screen.getByRole('button', { name: screens.itemEditor }));
  return user;
}

const saveButton = () => screen.getByRole('button', { name: t.save });
const onTop = () => {
  const root = navigationRef.getRootState();
  return root?.routes[root.index]?.name;
};

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

it('opens the garment with its own words in the fields', async () => {
  await resetCloset(sampleCloset);
  await openEditor();

  expect(await screen.findByRole('header', { name: 'Navy overcoat' })).toBeOnTheScreen();
  expect(screen.getByLabelText(t.name)).toHaveDisplayValue('Navy overcoat');
  expect(screen.getByRole('button', { name: 'Outerwear' })).toBeSelected();
  expect(screen.getByRole('button', { name: 'Warmest' })).toBeSelected();
  expect(saveButton()).toBeDisabled();
});

it('saves a change to that garment and no other', async () => {
  await resetCloset(sampleCloset);
  const user = await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.press(screen.getByRole('button', { name: 'Warm' }));
  expect(saveButton()).toBeEnabled();
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet).toEqual({
    ok: true,
    garments: sampleCloset.map((g) => (g.id === 'g1' ? { ...g, warmth: 'Warm' } : g)),
  });
  expect(onTop()).toBe('Tabs');
});

it('clears the style when it is chosen again', async () => {
  await resetCloset([{ ...sampleCloset[0], style: 'Smart' }]);
  const user = await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.press(screen.getByRole('button', { name: 'Smart' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0]).not.toHaveProperty('style');
});

it('keeps every field when the save fails', async () => {
  await resetCloset(sampleCloset);
  const user = await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.press(screen.getByRole('button', { name: 'Warm' }));
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
  await user.press(saveButton());

  expect(await screen.findByText(capture.saveFailed)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Warm' })).toBeSelected();
  expect(onTop()).toBe('ItemEditor');
});

it('says so, and offers another try, when the closet cannot be read', async () => {
  await AsyncStorage.setItem('wardrobe.closet', '{not json');
  const user = await openEditor();

  expect(await screen.findByText(capture.closetUnreadable)).toBeOnTheScreen();
  expect(screen.queryByLabelText(drawn.fig19.name)).not.toBeOnTheScreen();

  await resetCloset(sampleCloset);
  await user.press(screen.getByRole('button', { name: capture.tryAgain }));
  expect(await screen.findByRole('header', { name: 'Navy overcoat' })).toBeOnTheScreen();
});

it('says the garment is not in the closet rather than showing an empty form', async () => {
  await openEditor();
  expect(await screen.findByText(capture.notInCloset)).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: t.save })).not.toBeOnTheScreen();
});

it('holds an unsaved edit for the next time the garment is opened', async () => {
  await resetCloset(sampleCloset);
  const user = await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.clear(screen.getByLabelText(t.name));
  await user.type(screen.getByLabelText(t.name), 'Navy parka');
  await user.press(screen.getByRole('button', { name: t.close }));
  expect(onTop()).toBe('Tabs');

  await user.press(screen.getByRole('button', { name: screens.itemEditor }));
  expect(await screen.findByLabelText(t.name)).toHaveDisplayValue('Navy parka');
  expect(saveButton()).toBeEnabled();
  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0].name).toBe('Navy overcoat');
});
