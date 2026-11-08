import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { drawn } from '../strings/drawn';
import { font } from '../theme/font';
import { Camera } from '../theme/icons';
import { light } from '../theme/tokens';

/* THE "PHOTO" MARK on an uncut photograph (Fig 15's .uncut-mark, Fig 19b).
   Closet tiles and the editor share it (ADR 0024). */
export function PhotoMark({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.mark, style]} accessible={false}>
      <Camera color={light.muted} />
      <Text style={styles.markText}>{drawn.fig15.photo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: light.hairline,
    backgroundColor: light.surface,
  },
  markText: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.66, color: light.muted },
});
