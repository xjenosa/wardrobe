import { useNavigation } from '@react-navigation/native';

import { chooseFixture, hasService } from '../../lib/pick';
import { sampleCloset } from '../../lib/sample';
import { resetCloset } from '../../lib/store';
import { Stub } from '../../nav/Stub';
import { screens, stub } from '../../strings/screens';

/* Until You is built, this is how a phone gets the closet the fixtures were
   made for, and chooses which day they answer, so every state of Today can be
   seen end to end with no service. ONLY WITH NO SERVICE: the sample closet
   replaces whatever is saved, so on a phone with a service it would wipe a real
   closet, and the fixture's days mean nothing once a service answers. */
export function YouScreen() {
  const navigation = useNavigation();
  const loadSample = async () => {
    if ((await resetCloset(sampleCloset)).ok) navigation.navigate('Tabs', { screen: 'Closet' });
  };
  const building = hasService()
    ? []
    : [
        { label: stub.sampleCloset, onPress: loadSample },
        { label: stub.fixtureFits, onPress: () => chooseFixture('fits') },
        { label: stub.fixtureNothingFits, onPress: () => chooseFixture('nothingFits') },
      ];
  return (
    <Stub
      title={screens.you}
      links={[{ label: screens.firstRun, onPress: () => navigation.navigate('FirstRun') }, ...building]}
    />
  );
}
