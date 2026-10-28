import { render, screen } from '@testing-library/react-native';
import { processColor } from 'react-native';

import { Heart, icons } from './icons';
import { light } from './tokens';

type Drawn = { type: string; props: Record<string, unknown>; children: Drawn[] | null };
const drawing = () => screen.toJSON() as unknown as Drawn;
const all = (n: Drawn): Drawn[] => [n, ...(n.children ?? []).flatMap(all)];

/* react-native-svg hands a colour to the phone as a brush, {type, payload}. */
const brushes = (n: Drawn, paint: 'fill' | 'stroke') =>
  all(n).flatMap((el) => {
    const b = el.props[paint] as { payload?: unknown } | null | undefined;
    return b && typeof b === 'object' && 'payload' in b ? [b.payload] : [];
  });
const painted = (n: Drawn) => [...brushes(n, 'fill'), ...brushes(n, 'stroke')];

const named = Object.entries(icons);
const given = '#123456';

/* THE MOCKUP'S currentColor IS THE color PROP (tools/extract.mjs), so an icon
   on a dark button can be drawn light. One left at a fixed colour would be
   right on one plate and invisible on another. */
it.each(named)('%s is drawn in the colour it is given', async (_name, Icon) => {
  await render(<Icon color={given} />);
  expect(painted(drawing())).toContain(processColor(given));
  expect(painted(drawing())).not.toContain(processColor(light.ink));
});

it.each(named)('%s is drawn in ink when given none', async (_name, Icon) => {
  await render(<Icon />);
  expect(painted(drawing())).toContain(processColor(light.ink));
});

it.each(named)('%s is drawn at the size it is given', async (_name, Icon) => {
  await render(<Icon size={31} />);
  expect(drawing().props).toMatchObject({ width: 31, height: 31 });
});

it('draws the heart as a line when off and solid when on', async () => {
  await render(<Heart color={given} />);
  let paths = all(drawing()).filter((el) => el.type === 'RNSVGPath');
  expect(paths).toHaveLength(1);
  expect(brushes(paths[0], 'stroke')).toEqual([processColor(given)]);

  await render(<Heart color={given} filled />);
  paths = all(drawing()).filter((el) => el.type === 'RNSVGPath');
  expect(paths).toHaveLength(1);
  expect(brushes(paths[0], 'fill')).toEqual([processColor(given)]);
  expect(brushes(paths[0], 'stroke')).toEqual([]);
});
