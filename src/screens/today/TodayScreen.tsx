import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

import { Stub } from '../../nav/Stub';
import type { TodayNavigation } from '../../nav/routes';
import { screens } from '../../strings/screens';
import { NoForecastScreen } from './NoForecastScreen';

/* No forecast is Today's own state (Fig 11): it replaces Today in place and the
   tab bar stays. Until there is a forecast to fail, a link shows it. */
export function TodayScreen() {
  const navigation = useNavigation<TodayNavigation>();
  const [failed, setFailed] = useState(false);
  if (failed) return <NoForecastScreen onRetry={() => setFailed(false)} />;
  return (
    <Stub
      title={screens.today}
      links={[
        { label: screens.noForecast, onPress: () => setFailed(true) },
        { label: screens.weather, onPress: () => navigation.navigate('Weather') },
        { label: screens.you, onPress: () => navigation.navigate('You') },
      ]}
    />
  );
}
