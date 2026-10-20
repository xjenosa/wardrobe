import { useNavigation } from '@react-navigation/native';

import { Stub } from '../../nav/Stub';
import { screens } from '../../strings/screens';

export function ClosetScreen() {
  const navigation = useNavigation();
  return (
    <Stub
      title={screens.closet}
      links={[
        { label: screens.addGarment, onPress: () => navigation.navigate('AddGarment') },
        /* the first garment of the sample closet, fixtures/closet.json */
        { label: screens.itemEditor, onPress: () => navigation.navigate('ItemEditor', { id: 'g1' }) },
      ]}
    />
  );
}
