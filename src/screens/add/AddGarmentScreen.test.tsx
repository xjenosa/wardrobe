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

const mockTakePictureAsync = jest.fn();

jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs before imports
  const React = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs before imports
  const { View } = require('react-native') as typeof import('react-native');
  const CameraView = React.forwardRef((_props: object, ref: React.Ref<{ takePictureAsync: typeof mockTakePictureAsync }>) => {
    React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePictureAsync }));
    return <View testID="camera-view" />;
  });
  CameraView.displayName = 'CameraView';
  return {
    CameraView,
    useCameraPermissions: () => [{ granted: true, canAskAgain: true, expires: 'never', status: 'granted' }, jest.fn(), jest.fn()],
  };
});

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const picker = jest.mocked(ImagePicker);
const cam = drawn.fig17;
const reading = drawn.fig17B;
const t = drawn.fig18;
const PHOTO_NAME = 'g-shot.jpg';
const PHOTO_URI = 'file:///documents/garments/g-shot.jpg';

async function openAdd() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: /^Closet, tab,/ }));
  await user.press(screen.getByRole('button', { name: screens.addGarment }));
  await screen.findByRole('header', { name: cam.newGarment });
  return user;
}

function mockKeptPhoto() {
  jest.spyOn(garmentPhoto, 'keepGarmentPhoto').mockResolvedValue({ ok: true, name: PHOTO_NAME });
  jest.spyOn(garmentPhoto, 'loadGarmentPhoto').mockReturnValue({ ok: true, uri: PHOTO_URI });
  jest.spyOn(garmentPhoto, 'removeGarmentPhoto').mockReturnValue({ ok: true });
}

async function openConfirmTagged(user: Awaited<ReturnType<typeof openAdd>>) {
  jest.spyOn(tagLib, 'hasTagService').mockReturnValue(true);
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  mockKeptPhoto();
  jest.spyOn(tagLib, 'tag').mockResolvedValue({
    ok: true,
    response: { name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm', style: 'Smart' },
  });
  await user.press(screen.getByRole('button', { name: cam.upload }));
  await screen.findByLabelText(t.name);
  return user;
}

async function openConfirmByHand(user: Awaited<ReturnType<typeof openAdd>>) {
  jest.spyOn(tagLib, 'hasTagService').mockReturnValue(false);
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  mockKeptPhoto();
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
  mockTakePictureAsync.mockReset();
  await AsyncStorage.clear();
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
});

it('opens on the capture plate, not the confirm form', async () => {
  await openAdd();
  expect(screen.getByRole('button', { name: cam.capture })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: cam.upload })).toBeOnTheScreen();
  expect(screen.getByLabelText(capture.viewfinder)).toBeOnTheScreen();
  expect(screen.queryByLabelText(t.name)).not.toBeOnTheScreen();
});

it('starts tagging when the shutter fires, and shows the photograph while it reads', async () => {
  const user = await openAdd();
  jest.spyOn(tagLib, 'hasTagService').mockReturnValue(true);
  let finishTag: (value: tagLib.TagResult) => void = () => undefined;
  const pending = new Promise<tagLib.TagResult>((resolve) => {
    finishTag = resolve;
  });
  mockTakePictureAsync.mockResolvedValue({ uri: 'file:///cache/shot.jpg' });
  mockKeptPhoto();
  const tagSpy = jest.spyOn(tagLib, 'tag').mockReturnValue(pending);

  await user.press(screen.getByRole('button', { name: cam.capture }));
  expect(tagSpy).toHaveBeenCalledWith(PHOTO_URI);
  expect(await screen.findByText(reading.readingTheGarment)).toBeOnTheScreen();
  expect(screen.getByLabelText(capture.photographReading)).toBeOnTheScreen();

  await act(async () => {
    finishTag({ ok: true, response: { name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm' } });
  });
  expect(await screen.findByLabelText(t.name)).toHaveDisplayValue('Camel topcoat');
  expect(screen.getByLabelText(capture.photographConfirm)).toBeOnTheScreen();
});

it('goes to the form by hand with the photo kept when no tagging address is set', async () => {
  const user = await openAdd();
  const tagSpy = jest.spyOn(tagLib, 'tag');
  await openConfirmByHand(user);
  expect(tagSpy).not.toHaveBeenCalled();
  expect(screen.getByLabelText(t.name)).toHaveDisplayValue('');
  expect(screen.getByText(capture.byHand)).toBeOnTheScreen();
  expect(screen.getByLabelText(capture.photographConfirm)).toBeOnTheScreen();
});

it('keeps the photograph when tagging fails, and can fill by hand', async () => {
  const user = await openAdd();
  jest.spyOn(tagLib, 'hasTagService').mockReturnValue(true);
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  mockKeptPhoto();
  jest.spyOn(tagLib, 'tag').mockResolvedValue({ ok: false, failure: 'network' });

  await user.press(screen.getByRole('button', { name: cam.upload }));
  expect(await screen.findByText(capture.taggingFailed)).toBeOnTheScreen();
  expect(screen.getByLabelText(capture.photographFailed)).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: capture.fillByHand }));
  expect(await screen.findByLabelText(t.name)).toHaveDisplayValue('');
  expect(screen.getByText(capture.byHand)).toBeOnTheScreen();
  expect(screen.getByLabelText(capture.photographConfirm)).toBeOnTheScreen();

  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(saveButton());
  const closet = await loadCloset();
  expect(closet).toMatchObject({
    ok: true,
    garments: [{ name: 'Camel topcoat', photo: PHOTO_NAME }],
  });
});

it('removes an unsaved photograph when Add garment is closed without saving', async () => {
  const user = await openAdd();
  await openConfirmByHand(user);
  const remove = jest.spyOn(garmentPhoto, 'removeGarmentPhoto').mockReturnValue({ ok: true });
  await user.press(screen.getByRole('button', { name: t.cancel }));
  expect(remove).toHaveBeenCalled();
  expect(onTop()).toBe('Tabs');
});

it('cannot be saved until it is a garment', async () => {
  const user = await openAdd();
  await openConfirmTagged(user);
  expect(saveButton()).toBeEnabled();
  await user.clear(screen.getByLabelText(t.name));
  expect(saveButton()).toBeDisabled();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  expect(saveButton()).toBeEnabled();
});

it('cannot be saved from an empty by-hand form until category and warmth are chosen', async () => {
  const user = await openAdd();
  await openConfirmByHand(user);
  expect(saveButton()).toBeDisabled();
  await user.type(screen.getByLabelText(t.name), 'Camel topcoat');
  expect(saveButton()).toBeDisabled();
  await user.press(screen.getByRole('radio', { name: 'Outerwear' }));
  expect(saveButton()).toBeDisabled();
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  expect(saveButton()).toBeEnabled();
});

it('lets an accessory leave warmth out', async () => {
  const user = await openAdd();
  await openConfirmByHand(user);
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  expect(saveButton()).toBeEnabled();
  await user.press(saveButton());
  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0]).toMatchObject({ name: 'Charcoal beanie', category: 'Accessories' });
  expect(closet.ok && closet.garments[0]).not.toHaveProperty('warmth');
});

it('saves to the closet with its photograph and goes back', async () => {
  const user = await openAdd();
  await openConfirmTagged(user);
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet).toMatchObject({
    ok: true,
    garments: [{ name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm', style: 'Smart', photo: PHOTO_NAME }],
  });
  expect(onTop()).toBe('Tabs');
});

it('adds to the closet it finds and does not replace it', async () => {
  await resetCloset([{ id: 'g1', name: 'Navy overcoat', category: 'Outerwear', warmth: 'Warmest' }]);
  const user = await openAdd();
  await openConfirmByHand(user);
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments.map((g) => g.name)).toEqual(['Navy overcoat', 'Charcoal beanie']);
});

it('keeps everything entered when the save fails', async () => {
  const user = await openAdd();
  await openConfirmTagged(user);
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
  await openConfirmTagged(user);
  await user.press(saveButton());

  expect(await screen.findByText(capture.saveFailed)).toBeOnTheScreen();
  expect(await AsyncStorage.getItem('wardrobe.closet')).toBe('{not json');
});

it('saves nothing on cancel', async () => {
  const user = await openAdd();
  await openConfirmTagged(user);
  await user.press(screen.getByRole('button', { name: t.cancel }));

  expect(onTop()).toBe('Tabs');
  await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [] });
});

it('adds the garment once when Save is pressed twice before the screen updates', async () => {
  const user = await openAdd();
  await openConfirmTagged(user);
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
  await openConfirmTagged(user);
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  expect(screen.getByRole('radio', { name: 'Warm' })).not.toBeChecked();
  expect(saveButton()).toBeDisabled();
});

it('lets an accessory take its warmth back', async () => {
  const user = await openAdd();
  await openConfirmTagged(user);
  await user.clear(screen.getByLabelText(t.name));
  await user.type(screen.getByLabelText(t.name), 'Charcoal beanie');
  await user.press(screen.getByRole('radio', { name: 'Accessories' }));
  /* Tagging left Warm on; one tap clears it for an accessory. */
  await user.press(screen.getByRole('radio', { name: 'Warm' }));
  await user.press(saveButton());

  const closet = await loadCloset();
  expect(closet.ok && closet.garments[0]).not.toHaveProperty('warmth');
});

it('offers fill by hand when the photograph could not be kept, and retries the same source', async () => {
  const user = await openAdd();
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg', width: 1, height: 1 }],
  } as ImagePicker.ImagePickerResult);
  jest.spyOn(garmentPhoto, 'keepGarmentPhoto').mockResolvedValue({ ok: false });
  await user.press(screen.getByRole('button', { name: cam.upload }));
  expect(await screen.findByText(capture.photoFailed)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: capture.fillByHand })).toBeOnTheScreen();
  jest.spyOn(garmentPhoto, 'keepGarmentPhoto').mockResolvedValue({ ok: true, name: PHOTO_NAME });
  jest.spyOn(garmentPhoto, 'loadGarmentPhoto').mockReturnValue({ ok: true, uri: PHOTO_URI });
  jest.spyOn(tagLib, 'hasTagService').mockReturnValue(false);
  picker.launchImageLibraryAsync.mockClear();
  await user.press(screen.getByRole('button', { name: capture.tryAgain }));
  expect(picker.launchImageLibraryAsync).toHaveBeenCalled();
  expect(await screen.findByLabelText(t.name)).toBeOnTheScreen();
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
