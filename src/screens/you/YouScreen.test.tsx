import { render, screen, userEvent } from '@testing-library/react-native';

import { RootNavigator } from '../../nav/RootNavigator';
import { screens, stub } from '../../strings/screens';

/* The sample closet replaces whatever is saved, so it is offered only while
   there is no service to keep a real closet for. */
afterEach(() => {
  delete process.env.EXPO_PUBLIC_PICK_URL;
});

async function openYou() {
  const user = userEvent.setup();
  await render(<RootNavigator />);
  await user.press(screen.getByRole('button', { name: screens.you }));
  await screen.findByRole('header', { name: screens.you });
}

it('offers the sample closet and the fixture days with no service', async () => {
  await openYou();
  for (const name of [stub.sampleCloset, stub.fixtureFits, stub.fixtureNothingFits]) {
    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  }
});

it('offers none of them with a service address set', async () => {
  process.env.EXPO_PUBLIC_PICK_URL = 'https://pick.example';
  await openYou();
  for (const name of [stub.sampleCloset, stub.fixtureFits, stub.fixtureNothingFits]) {
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
});
