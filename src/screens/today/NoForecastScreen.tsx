import { Stub } from '../../nav/Stub';
import { screens } from '../../strings/screens';

export function NoForecastScreen({ onRetry }: { onRetry: () => void }) {
  return <Stub title={screens.noForecast} links={[{ label: screens.today, onPress: onRetry }]} />;
}
