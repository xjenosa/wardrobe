import { render, screen, userEvent } from '@testing-library/react-native';

import { drawn } from '../strings/drawn';
import { screens } from '../strings/screens';
import { ScreenHeader } from './ScreenHeader';

it('titles the screen as a header, under its eyebrow', async () => {
  await render(<ScreenHeader eyebrow={drawn.fig06.yourWardrobe} title={screens.closet} />);
  expect(screen.getByRole('header', { name: screens.closet })).toBeOnTheScreen();
  expect(screen.getByText(drawn.fig06.yourWardrobe)).toBeOnTheScreen();
});

it('draws no way out unless the screen closes', async () => {
  await render(<ScreenHeader title={screens.closet} />);
  expect(screen.queryByRole('button')).toBeNull();
});

it('closes from the title row, as You does', async () => {
  const user = userEvent.setup();
  const onClose = jest.fn();
  await render(<ScreenHeader title={screens.you} onClose={onClose} />);
  await user.press(screen.getByRole('button', { name: drawn.fig23.close }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
