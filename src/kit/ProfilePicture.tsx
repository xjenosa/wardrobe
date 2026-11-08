import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { drawn } from '../strings/drawn';
import { light } from '../theme/tokens';

/* THE PROFILE PICTURE AT THE END OF A TITLE ROW (.avatar): every Today plate
   (Figs 08 to 12) and the closet's (Figs 06 and 15). It opens You, so it is a
   button the plate names You.

   38 square with square corners, 4 above the row's top, under the card's
   shadow. A clear edge of 1 runs round it, then a hairline drawn over the
   picture, then the render's ground. With no photo it shows the plate's bust
   in the figure colour; `photo` fills the square instead, which photo being
   the screen's to say. Pressed lifts it 1, the stylesheet's hover.

   Drawn at 38 it reaches 44 with the slop round it, as the header's square
   buttons do. */
export function ProfilePicture({ photo, onPress }: { photo?: string | null; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={drawn.fig08.you}
      onPress={onPress}
      hitSlop={3}
      style={({ pressed }) => [styles.frame, pressed && styles.lifted]}
    >
      <View style={styles.ground}>
        {photo ? <Image source={{ uri: photo }} resizeMode="cover" accessible={false} style={StyleSheet.absoluteFill} /> : <Bust />}
        <View pointerEvents="none" style={styles.rule} />
      </View>
    </Pressable>
  );
}

/* the plate's #fig-bust, which ProfilePicture.test.tsx holds to the mockup */
function Bust() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 60 72">
      <Path d="M6 72 C6 50 22 42 30 42 C38 42 54 50 54 72 Z" fill={light.figure} />
      <Circle cx="30" cy="27" r="14" fill={light.figure} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: { width: 38, height: 38, marginTop: -4, padding: 1, boxShadow: light.cardShadow },
  lifted: { transform: [{ translateY: -1 }] },
  ground: {
    flex: 1,
    overflow: 'hidden',
    experimental_backgroundImage: `linear-gradient(176deg, ${light.renderA}, ${light.renderB})`,
  },
  rule: { ...StyleSheet.absoluteFill, borderWidth: 1, borderColor: light.hairline },
});
