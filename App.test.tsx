import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import App from './App';
import { screens } from './src/strings/screens';
import { faces, font } from './src/theme/font';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
const loading = jest.mocked(useFonts);

it('draws nothing until the typeface has loaded', async () => {
  loading.mockReturnValue([false, null]);
  await render(<App />);
  expect(screen.toJSON()).toBeNull();
});

it('draws the app once it has', async () => {
  loading.mockReturnValue([true, null]);
  await render(<App />);
  expect(await screen.findByRole('header', { name: screens.today })).toBeOnTheScreen();
});

it("still opens, in the phone's font, when a face fails to load", async () => {
  loading.mockReturnValue([false, new Error('no face')]);
  await render(<App />);
  expect(await screen.findByRole('header', { name: screens.today })).toBeOnTheScreen();
});

/* A family a style can name but the app never loads draws in the phone's font
   on one platform and warns on the other. */
it('loads every face a style can name, and only those', async () => {
  loading.mockReturnValue([true, null]);
  await render(<App />);
  expect(loading).toHaveBeenCalledWith(faces);
  expect(Object.keys(faces).sort()).toEqual(Object.values(font).sort());
});
