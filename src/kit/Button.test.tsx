import { render, screen, userEvent } from '@testing-library/react-native';

import { drawn } from '../strings/drawn';
import { Check, Shuffle } from '../theme/icons';
import { light } from '../theme/tokens';
import { Button } from './Button';

const t = drawn.fig08;

it('is a button named by its words', async () => {
  await render(<Button label={t.wearThis} onPress={() => {}} icon={Check} iconAfter />);
  expect(screen.getByRole('button', { name: t.wearThis })).toBeEnabled();
});

it('does what it is for when pressed', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<Button label={t.shuffle} kind="quiet" icon={Shuffle} onPress={onPress} />);
  await user.press(screen.getByRole('button', { name: t.shuffle }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it.each(['primary', 'outline', 'quiet'] as const)('a disabled %s button says so and does nothing', async (kind) => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<Button label={t.wearThis} kind={kind} onPress={onPress} disabled />);
  const button = screen.getByRole('button', { name: t.wearThis });
  expect(button).toBeDisabled();
  await user.press(button);
  expect(onPress).not.toHaveBeenCalled();
  expect(screen.getByText(t.wearThis)).toHaveStyle({ color: light.disabled });
});

/* Fig 11: a disabled primary loses its ink and keeps a ruled edge. */
it('draws a disabled primary as a ruled box, not a dimmed one', async () => {
  await render(<Button label={t.wearThis} onPress={() => {}} disabled />);
  const button = screen.getByRole('button', { name: t.wearThis });
  expect(button).toHaveStyle({ borderColor: light.edge });
  expect(button).not.toHaveStyle({ backgroundColor: light.ink });
});

it.each([
  ['large', 48],
  ['small', 44],
] as const)('is %s at the height the plates draw, %i', async (size, height) => {
  await render(<Button label={drawn.fig18.cancel} kind="outline" size={size} onPress={() => {}} />);
  expect(screen.getByRole('button', { name: drawn.fig18.cancel })).toHaveStyle({ height });
});
