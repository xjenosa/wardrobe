import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { drawn } from '../strings/drawn';
import { GarmentTile } from './GarmentTile';
import { TOUCH } from './reach';

const f = drawn.fig15;

it('is one button named by the garment, with the word for what it is under the name', async () => {
  await render(<GarmentTile name={f.navyOvercoat} category={f.outerwear} onPress={() => {}} />);
  expect(screen.getByRole('button', { name: f.navyOvercoat })).toBeOnTheScreen();
  expect(screen.getByText(f.outerwear)).toBeOnTheScreen();
});

it('opens the garment when pressed', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<GarmentTile name={f.navyOvercoat} category={f.outerwear} onPress={onPress} />);
  await user.press(screen.getByRole('button', { name: f.navyOvercoat }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('draws no heart unless the screen keeps favourites', async () => {
  await render(<GarmentTile name={f.navyOvercoat} category={f.outerwear} onPress={() => {}} />);
  expect(screen.getAllByRole('button')).toHaveLength(1);
});

it("names its heart the plate's way and says whether it is on", async () => {
  await render(<GarmentTile name={f.navyOvercoat} category={f.outerwear} onPress={() => {}} onFavourite={() => {}} />);
  expect(screen.getByRole('button', { name: f.favouriteNavyOvercoat })).not.toBeSelected();
  await render(<GarmentTile name={f.navyOvercoat} category={f.outerwear} onPress={() => {}} onFavourite={() => {}} favourite />);
  expect(screen.getByRole('button', { name: f.favouriteNavyOvercoat })).toBeSelected();
});

it('turns the heart on and off without opening the garment', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  const onFavourite = jest.fn();
  await render(<GarmentTile name={f.camelScarf} category={f.accessory} onPress={onPress} onFavourite={onFavourite} />);
  await user.press(screen.getByRole('button', { name: f.favouriteCamelScarf }));
  expect(onFavourite).toHaveBeenCalledTimes(1);
  expect(onPress).not.toHaveBeenCalled();
});

it('reaches the heart at 44 however small it is drawn', async () => {
  await render(<GarmentTile name={f.camelScarf} category={f.accessory} onPress={() => {}} onFavourite={() => {}} />);
  const heart = screen.getByRole('button', { name: f.favouriteCamelScarf });
  const { width, height } = StyleSheet.flatten(heart.props.style);
  const slop = heart.props.hitSlop;
  expect(Number(height) + slop.top + slop.bottom).toBeGreaterThanOrEqual(TOUCH);
  expect(Number(width) + slop.left + slop.right).toBeGreaterThanOrEqual(TOUCH);
});

it('marks a photograph not cut out yet', async () => {
  await render(<GarmentTile name={f.harbourTee} category={f.top} onPress={() => {}} photo />);
  expect(screen.getByText(f.photo)).toBeOnTheScreen();
  await render(<GarmentTile name={f.harbourTee} category={f.top} onPress={() => {}} />);
  expect(screen.queryByText(f.photo)).toBeNull();
});
