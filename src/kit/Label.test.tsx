import { render, screen } from '@testing-library/react-native';

import { drawn } from '../strings/drawn';
import { light } from '../theme/tokens';
import { Label } from './Label';

const f = drawn.fig18;

it('shows its words in small muted capitals', async () => {
  await render(<Label>{f.category}</Label>);
  expect(screen.getByText(f.category)).toHaveStyle({ textTransform: 'uppercase', fontSize: 11, color: light.muted });
});

/* It names a field; the field carries the name. A label a screen reader
   stopped on as a header or a button would be a second, wrong control. */
it('is words to read, not a header or a control', async () => {
  await render(<Label>{f.category}</Label>);
  expect(screen.queryByRole('header')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

it('sits 8 above what it names unless the screen moves it', async () => {
  await render(<Label>{f.warmth}</Label>);
  expect(screen.getByText(f.warmth)).toHaveStyle({ marginBottom: 8 });
  await render(<Label style={{ marginBottom: 0 }}>{f.warmth}</Label>);
  expect(screen.getByText(f.warmth)).toHaveStyle({ marginBottom: 0 });
});
