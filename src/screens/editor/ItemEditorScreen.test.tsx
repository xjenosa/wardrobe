import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { sampleCloset } from '../../lib/sample';
import { loadCloset, resetCloset } from '../../lib/store';
import * as wears from '../../lib/wears';
import { resetWears } from '../../lib/wears';
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
  expect(screen.getByRole('radio', { name: 'Outerwear' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Warmest' })).toBeChecked();
  expect(saveButton()).toBeDisabled();
});

it('says how often the garment was worn, from the wear log', async () => {
  await resetCloset(sampleCloset);
  await resetWears({ '2026-01-03': ['g1'], '2026-01-10': ['g1'], '2026-01-17': ['g2', 'g1'] });
  await openEditor();

  expect(await screen.findByText('Worn 3 times · last on 17 Jan')).toBeOnTheScreen();
});

it('says a garment worn once in the singular', async () => {
  await resetCloset(sampleCloset);
  await resetWears({ '2026-01-03': ['g1'] });
  await openEditor();

  expect(await screen.findByText('Worn 1 time · last on 3 Jan')).toBeOnTheScreen();
});

it('draws no wear line when the garment has never been worn', async () => {
  await resetCloset(sampleCloset);
  await resetWears({ '2026-01-03': ['g2'] });
  await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });

  expect(screen.queryByText(/^Worn /)).not.toBeOnTheScreen();
});

it('says so when the wear log cannot be read, and reads it again', async () => {
  await resetCloset(sampleCloset);
  const load = jest
    .spyOn(wears, 'loadWears')
    .mockResolvedValueOnce({ ok: false, failure: 'unreadable' })
    .mockResolvedValueOnce({ ok: true, log: { '2026-01-03': ['g1'] } });
  const user = await openEditor();
  expect(await screen.findByText(capture.wearsUnreadable)).toBeOnTheScreen();
  expect(screen.queryByText(/^Worn /)).not.toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: capture.tryAgain }));
  expect(await screen.findByText('Worn 1 time · last on 3 Jan')).toBeOnTheScreen();
  expect(load).toHaveBeenCalledTimes(2);
});

it('saves a change to that garment and no other', async () => {
  await resetCloset(sampleCloset);
  const user = await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
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
  await user.press(screen.getByRole('radio', { name: 'Smart' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0]).not.toHaveProperty('style');
});

it('keeps every field when the save fails', async () => {
  await resetCloset(sampleCloset);
  const user = await openEditor();
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
  await user.press(saveButton());

  expect(await screen.findByText(capture.saveFailed)).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'Warm' })).toBeChecked();
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

/* Close discards an unsaved edit and nothing asks (docs/States.md), so the
   garment opens next time as it was saved. */
async function editTheName(user: Awaited<ReturnType<typeof openEditor>>) {
  await screen.findByRole('header', { name: 'Navy overcoat' });
  await user.clear(screen.getByLabelText(t.name));
  await user.type(screen.getByLabelText(t.name), 'Navy parka');
}

async function reopenedAsSaved(user: Awaited<ReturnType<typeof openEditor>>) {
  expect(onTop()).toBe('Tabs');
  await user.press(screen.getByRole('button', { name: screens.itemEditor }));
  expect(await screen.findByLabelText(t.name)).toHaveDisplayValue('Navy overcoat');
  expect(saveButton()).toBeDisabled();
  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0].name).toBe('Navy overcoat');
}

it('discards an unsaved edit on Close, and asks nothing', async () => {
  await resetCloset(sampleCloset);
  const asked = jest.spyOn(Alert, 'alert');
  const user = await openEditor();
  await editTheName(user);
  await user.press(screen.getByRole('button', { name: t.close }));

  expect(asked).not.toHaveBeenCalled();
  await reopenedAsSaved(user);
});

it('discards an unsaved edit on the back gesture too', async () => {
  await resetCloset(sampleCloset);
  const user = await openEditor();
  await editTheName(user);
  await act(() => navigationRef.goBack());

  await reopenedAsSaved(user);
});
