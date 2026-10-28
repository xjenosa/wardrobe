import { useFonts } from 'expo-font';

import { RootNavigator } from './src/nav/RootNavigator';
import { faces } from './src/theme/font';

/* NOTHING IS DRAWN UNTIL THE TYPEFACE HAS LOADED. Expo Go cannot build a font
   into the app, so it loads at start, and drawing before then would show every
   screen in the phone's own font and then jump. A face that fails to load
   still lets the app open, in the phone's font, rather than never. */
export default function App() {
  const [loaded, failed] = useFonts(faces);
  if (!loaded && !failed) return null;
  return <RootNavigator />;
}
