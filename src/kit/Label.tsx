import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { font } from '../theme/font';
import { light } from '../theme/tokens';

/* THE SMALL CAPITALS OVER A FIELD (.f-label), as in Name, Category and Warmth
   on the garment form (Figs 18 and 19), Vibe over Today's choice (.vibe-lab, Figs 08
   to 12), and You's section names (.set-legend, Fig 23). The three are drawn a
   hundredth of an em apart in letter spacing, a fraction of a point, so the
   kit draws the field's. It sits 8 above what it names; a screen moves it with
   `style`. It is words to read, not a control, and a field it names takes the
   same words as its own label. */
export function Label({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 1.65,
    textTransform: 'uppercase',
    color: light.muted,
  },
});
