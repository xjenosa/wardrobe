import { render, screen, userEvent } from '@testing-library/react-native';

import { drawn } from '../strings/drawn';
import { TopBar } from './TopBar';

it('titles the screen as a header', async () => {
  await render(<TopBar title={drawn.fig14.weather} onBack={() => {}} />);
  expect(screen.getByRole('header', { name: drawn.fig14.weather })).toBeOnTheScreen();
});

it('goes back from a control the plate names Back', async () => {
  const user = userEvent.setup();
  const onBack = jest.fn();
  await render(<TopBar title={drawn.fig14.weather} onBack={onBack} />);
  await user.press(screen.getByRole('button', { name: drawn.fig14.back }));
  expect(onBack).toHaveBeenCalledTimes(1);
});

it('closes instead, as the camera does', async () => {
  const user = userEvent.setup();
  const onBack = jest.fn();
  await render(<TopBar title={drawn.fig17.newGarment} onBack={onBack} way="close" />);
  expect(screen.queryByRole('button', { name: drawn.fig14.back })).toBeNull();
  await user.press(screen.getByRole('button', { name: drawn.fig17.close }));
  expect(onBack).toHaveBeenCalledTimes(1);
});
