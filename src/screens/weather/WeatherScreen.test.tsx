import { render, screen, userEvent, within } from '@testing-library/react-native';

import { drawn } from '../../strings/drawn';
import { WeatherScreen } from './WeatherScreen';

const words = drawn.fig14D;
const now = new Date(2026, 10, 11, 12);

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
}));
const mockGoBack = jest.fn();

beforeEach(() => mockGoBack.mockClear());

it('announces the failed forecast and explains why there is no pick', async () => {
  await render(<WeatherScreen now={now} />);
  expect(screen.getByRole('alert')).toHaveTextContent(words.couldNotReachTheForecast);
  expect(screen.getByText(words.noPickWithoutAForecast)).toBeOnTheScreen();
});

it('uses the phone clock and omits an unknown place', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
  try {
    await render(<WeatherScreen />);
    expect(screen.getByText('Wednesday 11 November')).toBeOnTheScreen();
    expect(screen.queryByText(words.torontoCa)).toBeNull();
    expect(screen.queryByText(words.thursday8January)).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it('accepts a pinned date and a known place', async () => {
  await render(<WeatherScreen now={now} place="Ottawa, CA" />);
  expect(screen.getByText('Ottawa, CA')).toHaveStyle({ textTransform: 'uppercase' });
  expect(screen.getByText('Wednesday 11 November')).toBeOnTheScreen();
});

it('retries through the supplied callback and goes back through navigation', async () => {
  const onRetry = jest.fn();
  const user = userEvent.setup();
  await render(<WeatherScreen now={now} onRetry={onRetry} />);
  await user.press(screen.getByRole('button', { name: words.tryAgain }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  await user.press(screen.getByRole('button', { name: words.back }));
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

it('shows a dash for each unavailable measurement and lets the body scroll', async () => {
  await render(<WeatherScreen now={now} />);
  const scrolls = (el: { type: unknown; parent: unknown } | null): boolean =>
    el !== null && (el.type === 'RCTScrollView' || scrolls(el.parent as typeof el));
  for (const label of [words.hoursCovered, words.uvIndex, words.wind, words.humidity]) {
    const key = screen.getByText(label);
    expect(within(key.parent!).getByText(words.s)).toBeOnTheScreen();
    expect(scrolls(key)).toBe(true);
  }
  expect(scrolls(screen.getByText('Wednesday 11 November'))).toBe(true);
});

it('returns to the stub on retry until forecast fetching is wired in', async () => {
  const user = userEvent.setup();
  await render(<WeatherScreen now={now} />);
  await user.press(screen.getByRole('button', { name: words.tryAgain }));
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});
