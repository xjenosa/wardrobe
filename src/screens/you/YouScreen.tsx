import { useNavigation } from '@react-navigation/native';

import { Stub } from '../../nav/Stub';
import { screens } from '../../strings/screens';

export function YouScreen() {
  const navigation = useNavigation();
  return (
    <Stub
      title={screens.you}
      links={[{ label: screens.firstRun, onPress: () => navigation.navigate('FirstRun') }]}
    />
  );
}
