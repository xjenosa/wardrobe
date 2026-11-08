/// <reference types="node" />
import { render, screen, userEvent } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processColor, StyleSheet } from 'react-native';

import { drawn } from '../strings/drawn';
import { light } from '../theme/tokens';
import { ProfilePicture } from './ProfilePicture';
import { TOUCH } from './reach';

const you = drawn.fig08.you;
const photo = 'file:///documents/reference/photo-1.jpg';

type Drawn = { type: string; props: Record<string, unknown>; children: Drawn[] | null };
const all = (n: Drawn): Drawn[] => [n, ...(n.children ?? []).flatMap(all)];
const drawing = () => all(screen.toJSON() as unknown as Drawn);

it('is a button the plate names You', async () => {
  await render(<ProfilePicture onPress={() => {}} />);
  expect(screen.getByRole('button', { name: you })).toBeEnabled();
});

it('opens You when pressed', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();
  await render(<ProfilePicture onPress={onPress} />);
  await user.press(screen.getByRole('button', { name: you }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('shows the bust until there is a photo, and then the photo alone', async () => {
  await render(<ProfilePicture onPress={() => {}} />);
  expect(drawing().some((el) => el.type === 'RNSVGPath')).toBe(true);
  expect(drawing().some((el) => el.type === 'Image')).toBe(false);

  await render(<ProfilePicture photo={photo} onPress={() => {}} />);
  expect(drawing().find((el) => el.type === 'Image')?.props.source).toEqual({ uri: photo });
  expect(drawing().some((el) => el.type === 'RNSVGPath')).toBe(false);
  expect(screen.getByRole('button', { name: you })).toBeOnTheScreen();
});

it('reaches 44 to the touch, though it is drawn 38 square', async () => {
  await render(<ProfilePicture onPress={() => {}} />);
  const button = screen.getByRole('button', { name: you });
  const { width, height } = StyleSheet.flatten(button.props.style);
  const slop = button.props.hitSlop;
  expect(Number(width) + 2 * slop).toBeGreaterThanOrEqual(TOUCH);
  expect(Number(height) + 2 * slop).toBeGreaterThanOrEqual(TOUCH);
});

/* THE MOCKUP IS THE SPECIFICATION, so this reads it. A redraw that moves the
   box or redraws the bust fails here, rather than leaving the kit drawing the
   last design. */
describe('as the mockup draws it', () => {
  const html = readFileSync(join(__dirname, '../../docs/design/mobile.html'), 'utf8');

  it('is the size and offset of .avatar, under the card shadow', async () => {
    const rule = html.match(/[.]avatar[{]([^}]*)[}]/)?.[1] ?? '';
    const px = (prop: string) => Number(rule.match(new RegExp('(?:^|;)' + prop + ':(-?[0-9.]+)px'))?.[1]);
    await render(<ProfilePicture onPress={() => {}} />);
    expect(screen.getByRole('button', { name: you })).toHaveStyle({
      width: px('width'),
      height: px('height'),
      marginTop: px('margin'),
      boxShadow: light.cardShadow,
    });
    expect(rule).toContain('box-shadow:var(--card-shadow)');
  });

  it("draws the plate's bust, shape for shape, in the figure colour", async () => {
    const bust = html.match(/<g id="fig-bust">([^]*?)<[/]g>/)?.[1] ?? '';
    const d = bust.match(/<path d="([^"]+)" fill="var[(]--figure[)]"/)?.[1];
    const circle = bust.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="var[(]--figure[)]"/);
    await render(<ProfilePicture onPress={() => {}} />);
    const path = drawing().find((el) => el.type === 'RNSVGPath')?.props;
    const round = drawing().find((el) => el.type === 'RNSVGCircle')?.props;
    expect(path?.d).toBe(d);
    expect([round?.cx, round?.cy, round?.r].map(String)).toEqual(circle?.slice(1));
    for (const shape of [path, round]) expect(shape?.fill).toMatchObject({ payload: processColor(light.figure) });
  });
});
