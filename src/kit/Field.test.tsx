import { render, screen, userEvent } from '@testing-library/react-native';

import { capture } from '../strings/capture';
import { drawn } from '../strings/drawn';
import { light } from '../theme/tokens';
import { Field } from './Field';

const f = drawn.fig18;
const typed = drawn.fig15.camelTopcoat;

it('is a box to type in, named by its label', async () => {
  await render(<Field label={f.name} value="" onChangeText={() => {}} />);
  expect(screen.getByLabelText(f.name)).toBeEnabled();
  expect(screen.getByText(f.name)).toBeOnTheScreen();
});

it('hands on what is typed', async () => {
  const user = userEvent.setup();
  const onChangeText = jest.fn();
  await render(<Field label={f.name} value="" onChangeText={onChangeText} />);
  await user.type(screen.getByLabelText(f.name), typed);
  expect(onChangeText.mock.calls.map(([t]) => t).join('')).toBe(typed);
});

it('says what is wrong as an alert, under a box ruled in the grave colour', async () => {
  await render(<Field label={f.name} value="" onChangeText={() => {}} error={capture.saveFailed} />);
  expect(screen.getByRole('alert')).toHaveTextContent(capture.saveFailed);
  expect(screen.getByLabelText(f.name)).toHaveStyle({ borderColor: light.grave });
});

it('shows a hint until something is wrong', async () => {
  await render(<Field label={f.name} value="" onChangeText={() => {}} hint={capture.byHand} />);
  expect(screen.getByText(capture.byHand)).toBeOnTheScreen();
  expect(screen.queryByRole('alert')).toBeNull();
  await render(<Field label={f.name} value="" onChangeText={() => {}} hint={capture.byHand} error={capture.saveFailed} />);
  expect(screen.queryByText(capture.byHand)).toBeNull();
});

it('when disabled says so and takes nothing typed', async () => {
  const user = userEvent.setup();
  const onChangeText = jest.fn();
  await render(<Field label={f.name} value="" onChangeText={onChangeText} disabled />);
  const box = screen.getByLabelText(f.name);
  expect(box).toBeDisabled();
  await user.type(box, typed);
  expect(onChangeText).not.toHaveBeenCalled();
});
