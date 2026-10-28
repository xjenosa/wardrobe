import { StyleSheet, Text, View } from 'react-native';

import { drawn } from '../strings/drawn';
import { font } from '../theme/font';
import { Close } from '../theme/icons';
import { light } from '../theme/tokens';
import { TopButton } from './TopButton';

/* THE HEAD OF A SCREEN THAT IS A PLACE OF ITS OWN (.title-row, .head-rule):
   an eyebrow, the title, and a hairline under both. Today, Closet and the
   editor draw the eyebrow (Figs 06 to 12, 15, 19); You draws none and closes
   from the same row (Fig 23), which is what onClose adds.

   You also sets its title row in from the sides (.you-name, Fig 23) while the
   rule under it keeps the full width, which is what `inset` does. No other
   plate does, so it is nothing by default. */
export function ScreenHeader({
  title,
  eyebrow,
  onClose,
  inset = 0,
}: {
  title: string;
  eyebrow?: string;
  onClose?: () => void;
  inset?: number;
}) {
  return (
    <View>
      <View style={[styles.row, inset ? { marginHorizontal: inset } : null]}>
        <View style={styles.words}>
          {eyebrow ? (
            <Text numberOfLines={1} style={styles.eyebrow}>
              {eyebrow}
            </Text>
          ) : null}
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        </View>
        {onClose ? <TopButton icon={Close} label={drawn.fig23.close} onPress={onClose} style={styles.close} /> : null}
      </View>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  words: { flexShrink: 1 },
  eyebrow: {
    fontFamily: font.medium,
    fontSize: 11,
    lineHeight: 15.4,
    letterSpacing: 1.65,
    textTransform: 'uppercase',
    color: light.muted,
  },
  title: { marginTop: 4, fontFamily: font.semibold, fontSize: 28, lineHeight: 33.6, letterSpacing: -0.616, color: light.ink },
  close: { marginRight: -8 },
  rule: { height: 1, marginTop: 16, backgroundColor: light.hairline },
});
