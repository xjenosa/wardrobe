import { render, screen, userEvent } from '@testing-library/react-native';

import { RootNavigator } from '../../nav/RootNavigator';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';

it.each([drawn.fig14D.tryAgain, drawn.fig14D.back])('returns from Weather to Today with %s', async (action) => {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: screens.weather }));
  expect(await screen.findByRole('alert')).toHaveTextContent(drawn.fig14D.couldNotReachTheForecast);
  await user.press(screen.getByRole('button', { name: action }));
  expect(await screen.findByRole('header', { name: screens.today })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^Closet, tab,/ })).toBeOnTheScreen();
});
