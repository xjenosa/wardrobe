import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pickReference } from '../../lib/reference';
import { navigationRef, RootNavigator } from '../../nav/RootNavigator';
import { drawn } from '../../strings/drawn';
import { frame } from '../../strings/frame';

jest.mock('../../lib/reference', () => ({ pickReference: jest.fn() }));
const asking = jest.mocked(pickReference);

const t = drawn.fig05;

const onTop = () => {
  const root = navigationRef.getRootState();
  return root?.routes[root.index]?.name;
};

async function open() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await act(async () => navigationRef.navigate('FirstRun'));
  await screen.findByRole('header', { name: t.aPhotoOfYou });
  return user;
}

beforeEach(() => jest.clearAllMocks());

it('asks for one photo of you and says what it is for', async () => {
  await open();
  expect(screen.getByText(t.fullLengthPlainBackgroundFacing)).toBeOnTheScreen();
  expect(screen.getByText(t.itIsSentToThe)).toBeOnTheScreen();
  expect(screen.getByText(t.withoutItOutfitsAreShown)).toBeOnTheScreen();
  for (const name of [t.takeAPhoto, t.chooseAPhoto, t.skipForNow]) {
    expect(screen.getByRole('button', { name })).toBeEnabled();
  }
});

it.each([
  [t.takeAPhoto, 'camera'],
  [t.chooseAPhoto, 'library'],
] as const)('%s asks the %s for it, and leaves once it is kept', async (name, from) => {
  asking.mockResolvedValue('kept');
  const user = await open();
  await user.press(screen.getByRole('button', { name }));
  expect(asking).toHaveBeenCalledWith(from);
  expect(onTop()).toBe('Tabs');
});

it('stays, and says nothing, when the person backs out of the picker', async () => {
  asking.mockResolvedValue('cancelled');
  const user = await open();
  await user.press(screen.getByRole('button', { name: t.takeAPhoto }));
  expect(onTop()).toBe('FirstRun');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('cannot be asked twice while the picker is open', async () => {
  asking.mockReturnValue(new Promise(() => {}));
  const user = await open();
  await user.press(screen.getByRole('button', { name: t.takeAPhoto }));
  expect(screen.getByRole('button', { name: t.takeAPhoto })).toBeDisabled();
  expect(screen.getByRole('button', { name: t.chooseAPhoto })).toBeDisabled();
  expect(screen.getByRole('button', { name: t.skipForNow })).toBeEnabled();
});

it('says the camera is not allowed, and opens Settings to allow it', async () => {
  asking.mockResolvedValue('refused');
  const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const user = await open();
  await user.press(screen.getByRole('button', { name: t.takeAPhoto }));
  expect(screen.getByRole('alert')).toHaveTextContent(frame.cameraRefused);
  await user.press(screen.getByRole('button', { name: frame.openSettings }));
  expect(settings).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: t.chooseAPhoto })).toBeEnabled();
});

it('says the photo could not be kept, and tries the same way again', async () => {
  asking.mockResolvedValueOnce('failed').mockResolvedValueOnce('kept');
  const user = await open();
  await user.press(screen.getByRole('button', { name: t.chooseAPhoto }));
  expect(screen.getByRole('alert')).toHaveTextContent(frame.photoNotKept);
  await user.press(screen.getByRole('button', { name: drawn.fig11.tryAgain }));
  expect(asking.mock.calls).toEqual([['library'], ['library']]);
  expect(onTop()).toBe('Tabs');
});

it('skips without a photo, and leaves the closet open to use', async () => {
  const user = await open();
  await user.press(screen.getByRole('button', { name: t.skipForNow }));
  expect(asking).not.toHaveBeenCalled();
  expect(onTop()).toBe('Tabs');
});

/* #4: a full-screen modal's SafeAreaView pads the top on Android and not on
   iOS, so First run adds the inset itself and nothing else may add it again. */
it('makes room for the status bar exactly once', async () => {
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 62, bottom: 34, left: 0, right: 0 });
  await open();
  const above = [];
  for (let el = screen.getByRole('header', { name: t.aPhotoOfYou }).parent; el; el = el.parent) above.push(el);
  const padded = above.filter((el) => [el.props.style].flat(3).some((s) => s && s.paddingTop === 62));
  expect(padded).toHaveLength(1);
  expect(above.some((el) => el.type === 'RNCSafeAreaView')).toBe(false);
});
