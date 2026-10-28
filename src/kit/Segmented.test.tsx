import { render, screen, userEvent } from '@testing-library/react-native';

import { vibes } from '../lib/words';
import { drawn } from '../strings/drawn';
import { light } from '../theme/tokens';
import { Segmented } from './Segmented';

const t = drawn.fig08;

/* A group is a container, not something a screen reader stops on, so it is
   found by its label rather than by its role. */
const group = (label: string) => screen.getByLabelText(label);

it('is a radio group named for what it chooses, with the chosen one checked', async () => {
  await render(<Segmented label={t.vibe} options={vibes} value={t.everyday} onChange={() => {}} wide />);
  expect(group(t.vibe)).toHaveProp('accessibilityRole', 'radiogroup');
  expect(screen.getAllByRole('radio')).toHaveLength(vibes.length);
  expect(screen.getByRole('radio', { name: t.everyday })).toBeChecked();
  expect(screen.getByRole('radio', { name: t.smart })).not.toBeChecked();
});

it('chooses another when it is pressed', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  await render(<Segmented label={t.vibe} options={vibes} value={t.everyday} onChange={onChange} />);
  await user.press(screen.getByRole('radio', { name: t.smart }));
  expect(onChange).toHaveBeenCalledWith(t.smart);
});

/* Fig 11 */
it('when disabled says so, keeps the choice ruled and changes nothing', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  await render(<Segmented label={t.vibe} options={vibes} value={t.everyday} onChange={onChange} wide disabled />);
  for (const name of vibes) expect(screen.getByRole('radio', { name })).toBeDisabled();
  expect(screen.getByRole('radio', { name: t.everyday })).toBeChecked();
  expect(screen.getByRole('radio', { name: t.everyday })).toHaveStyle({ borderColor: light.edge });
  await user.press(screen.getByRole('radio', { name: t.smart }));
  expect(onChange).not.toHaveBeenCalled();
});

it('sits at its own width, as You draws Units, unless it is wide', async () => {
  const u = drawn.fig23;
  await render(<Segmented label={u.units} options={[u.c, u.f]} value={u.c} onChange={() => {}} />);
  expect(group(u.units)).toHaveStyle({ alignSelf: 'flex-start' });
});
