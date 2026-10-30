import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as garmentPhoto from '../../lib/garmentPhoto';
import { loadCloset, resetCloset } from '../../lib/store';
import * as tagLib from '../../lib/tag';
import { navigationRef, RootNavigator } from '../../nav/RootNavigator';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const picker = jest.mocked(ImagePicker);
const cam = drawn.fig17;
const reading = drawn.fig17B;
const t = drawn.fig18;

async function openAdd() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: /^Closet, tab,/ }));
  await user.press(screen.getByRole('button', { name: screens.addGarment }));
  await screen.findByRole('header', { name: cam.newGarment });
  return user;
}

async function openConfirm(user: Awaited<ReturnType<typeof openAdd>>) {
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  jest.spyOn(garmentPhoto, 'keepGarmentPhoto').mockResolvedValue({ ok: true, uri: 'file:///documents/garments/g-shot.jpg' });
  jest.spyOn(tagLib, 'tag').mockResolvedValue({
    ok: true,
    response: { name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm', style: 'Smart' },
  });
  await user.press(screen.getByRole('button', { name: cam.upload }));
  await screen.findByLabelText(t.name);
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
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
});

it('opens on the capture plate, not the confirm form', async () => {
  await openAdd();
  expect(screen.getByRole('button', { name: cam.capture })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: cam.upload })).toBeOnTheScreen();
  expect(screen.queryByLabelText(t.name)).not.toBeOnTheScreen();
});

it('starts tagging when the shutter fires, and shows the photograph while it reads', async () => {
  const user = await openAdd();
  let finishTag: (value: tagLib.TagResult) => void = () => undefined;
  const pending = new Promise<tagLib.TagResult>((resolve) => {
    finishTag = resolve;
  });
  picker.launchCameraAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  jest.spyOn(garmentPhoto, 'keepGarmentPhoto').mockResolvedValue({ ok: true, uri: 'file:///documents/garments/g-shot.jpg' });
  const tagSpy = jest.spyOn(tagLib, 'tag').mockReturnValue(pending);

  await user.press(screen.getByRole('button', { name: cam.capture }));
  expect(tagSpy).toHaveBeenCalledWith('file:///documents/garments/g-shot.jpg');
  expect(await screen.findByText(reading.readingTheGarment)).toBeOnTheScreen();
  expect(screen.getByLabelText(reading.readingTheGarment)).toBeOnTheScreen();

  await act(async () => {
    finishTag({ ok: true, response: { name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm' } });
  });
  expect(await screen.findByLabelText(t.name)).toHaveDisplayValue('Camel topcoat');
});

it('keeps the photograph when tagging fails, and can fill by hand', async () => {
  const user = await openAdd();
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  jest.spyOn(garmentPhoto, 'keepGarmentPhoto').mockResolvedValue({ ok: true, uri: 'file:///documents/garments/g-shot.jpg' });
  jest.spyOn(tagLib, 'tag').mockResolvedValue({ ok: false, failure: 'network' });

  await user.press(screen.getByRole('button', { name: cam.upload }));
  expect(await screen.findByText(capture.taggingFailed)).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: capture.fillByHand }));
  expect(await screen.findByLabelText(t.name)).toHaveDisplayValue('');
  expect(screen.getByText(capture.byHand)).toBeOnTheScreen();
});

it('cannot be saved until it is a garment', async () => {
  const user = await openAdd();
  await openConfirm(user);
  expect(saveButton()).toBeEnabled();
  await user.clear(screen.getByLabelText(t.name));
  expect(saveButton()).toBeDisabled();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  expect(saveButton()).toBeEnabled();
});

it('lets an accessory leave warmth out', async () => {
  const user = await openAdd();
  await openConfirm(user);
  await user.clear(screen.getByLabelText(t.name));
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  expect(saveButton()).toBeEnabled();
});

it('saves to the closet with its photograph and goes back', async () => {
  const user = await openAdd();
  await openConfirm(user);
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet).toMatchObject({
    ok: true,
    garments: [{ name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm', style: 'Smart', photo: 'file:///documents/garments/g-shot.jpg' }],
  });
  expect(onTop()).toBe('Tabs');
});

it('adds to the closet it finds and does not replace it', async () => {
  await resetCloset([{ id: 'g1', name: 'Navy overcoat', category: 'Outerwear', warmth: 'Warmest' }]);
  const user = await openAdd();
  await openConfirm(user);
  await user.clear(screen.getByLabelText(t.name));
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments.map((g) => g.name)).toEqual(['Navy overcoat', 'Charcoal beanie']);
});

it('keeps everything entered when the save fails', async () => {
  const user = await openAdd();
  await openConfirm(user);
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
  await openConfirm(user);
  await user.press(saveButton());

  expect(await screen.findByText(capture.saveFailed)).toBeOnTheScreen();
  expect(await AsyncStorage.getItem('wardrobe.closet')).toBe('{not json');
});

it('saves nothing on cancel', async () => {
  const user = await openAdd();
  await openConfirm(user);
  await user.press(screen.getByRole('button', { name: t.cancel }));

  expect(onTop()).toBe('Tabs');
  await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [] });
});

it('adds the garment once when Save is pressed twice before the screen updates', async () => {
  const user = await openAdd();
  await openConfirm(user);
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
  await openConfirm(user);
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  expect(screen.getByRole('radio', { name: 'Warm' })).not.toBeChecked();
  expect(saveButton()).toBeDisabled();
});

it('lets an accessory take its warmth back', async () => {
  const user = await openAdd();
  await openConfirm(user);
  await user.clear(screen.getByLabelText(t.name));
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  /* Tagging left Warm on; one tap clears it for an accessory. */
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0]).not.toHaveProperty('warmth');
});

type Drawn = { type: string; props: Record<string, unknown>; children: (Drawn | string)[] };
const everything = (el: Drawn): Drawn[] => [el, ...el.children.flatMap((c) => (typeof c === 'string' ? [] : everything(c)))];
const GAPS = ['paddingTop', 'paddingVertical', 'padding', 'marginTop', 'marginVertical', 'margin', 'top', 'height'] as const;

it('makes room for the status bar exactly once', async () => {
  const top = 62;
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top, bottom: 34, left: 0, right: 0 });
  await openAdd();
  let page = screen.getByRole('header', { name: cam.newGarment }) as unknown as Drawn & { parent: Drawn | null };
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
