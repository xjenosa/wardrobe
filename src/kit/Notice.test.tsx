import { render, screen, userEvent } from '@testing-library/react-native';

import { drawn } from '../strings/drawn';
import { Notice } from './Notice';

const t = drawn.fig11;

it('says what went wrong as an alert', async () => {
  await render(<Notice text={t.couldNotReachTheForecast} action={t.tryAgain} onPress={() => {}} />);
  expect(screen.getByRole('alert')).toHaveTextContent(t.couldNotReachTheForecast);
});

it('offers the one thing to do about it, and does it', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<Notice text={t.couldNotReachTheForecast} action={t.tryAgain} onPress={onPress} />);
  expect(screen.getAllByRole('button')).toHaveLength(1);
  await user.press(screen.getByRole('button', { name: t.tryAgain }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
