import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { Icon } from '../theme/icons';
import { light } from '../theme/tokens';

/* The square button a header draws an icon in (.top-btn): 38 square, so it
   reaches 44 with the slop around it. Named by its label, since it has no
   words of its own. */
export function TopButton({
  icon: Glyph,
  label,
  onPress,
  style,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={3} style={[styles.button, style]}>
      <Glyph color={light.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
