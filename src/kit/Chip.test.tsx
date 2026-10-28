import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';

import { drawn } from '../strings/drawn';
import { Sun } from '../theme/icons';
import { light } from '../theme/tokens';
import { Chip } from './Chip';
import { TOUCH } from './reach';

const t = drawn.fig08;
const f = drawn.fig18;

/* How tall a finger finds it: its drawn height and the slop above and below. */
const reachOf = (el: ReturnType<typeof screen.getByRole>) => {
  const slop = el.props.hitSlop ?? {};
  return Number(StyleSheet.flatten(el.props.style).height) + (slop.top ?? 0) + (slop.bottom ?? 0);
};

it('is a button that says whether it is on', async () => {
  await render(<Chip label={t.tooWarm} kind="feedback" icon={Sun} onPress={() => {}} />);
  expect(screen.getByRole('button', { name: t.tooWarm })).not.toBeSelected();
  await render(<Chip label={t.tooWarm} kind="feedback" icon={Sun} onPress={() => {}} on />);
  expect(screen.getByRole('button', { name: t.tooWarm })).toBeSelected();
});

it('is a radio when only one of its set can be on', async () => {
  await render(
    <View accessibilityRole="radiogroup" accessibilityLabel={f.season}>
      <Chip label={f.spring} role="radio" onPress={() => {}} />
      <Chip label={f.winter} role="radio" onPress={() => {}} on />
    </View>,
  );
  expect(screen.getByRole('radio', { name: f.spring })).not.toBeChecked();
  expect(screen.getByRole('radio', { name: f.winter })).toBeChecked();
});

it('asks to be turned on or off when pressed', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<Chip label={f.autumn} onPress={onPress} />);
  await user.press(screen.getByRole('button', { name: f.autumn }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('fills with ink when on', async () => {
  await render(<Chip label={f.autumn} onPress={() => {}} on />);
  expect(screen.getByRole('button', { name: f.autumn })).toHaveStyle({ backgroundColor: light.ink });
  expect(screen.getByText(f.autumn)).toHaveStyle({ color: light.paper });
});

it('when disabled says so, greys its words and does nothing', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<Chip label={t.tooCold} kind="feedback" onPress={onPress} disabled />);
  const chip = screen.getByRole('button', { name: t.tooCold });
  expect(chip).toBeDisabled();
  await user.press(chip);
  expect(onPress).not.toHaveBeenCalled();
  expect(screen.getByText(t.tooCold)).toHaveStyle({ color: light.disabled });
});

it.each([
  ['option', light.pillL],
  ['feedback', light.pillM],
  ['filter', light.pillM],
  ['preset', light.pillM],
] as const)('draws a %s chip at the height its plate does, %s', async (kind, height) => {
  await render(<Chip label={f.warm} kind={kind} onPress={() => {}} />);
  expect(screen.getByRole('button', { name: f.warm })).toHaveStyle({ height: parseFloat(height) });
});

it.each(['option', 'feedback', 'filter', 'preset'] as const)('the %s chip reaches 44 to the touch, however tall it is drawn', async (kind) => {
  await render(<Chip label={f.warm} kind={kind} onPress={() => {}} />);
  expect(reachOf(screen.getByRole('button', { name: f.warm }))).toBeGreaterThanOrEqual(TOUCH);
});
