import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '../theme/font';
import { light } from '../theme/tokens';
import { reach } from './reach';

/* ONE CHOICE FROM A FEW, side by side in a ruled field (.vibe, .seg): a radio
   group, so a screen reader says which is chosen and how many there are.
   Today's Vibe fills the row (Figs 08 to 12), which is `wide`; You's Units
   sits at its own width beside its label (Fig 23).

   Disabled is drawn, not dimmed: every word turns grey and the chosen one
   loses its ink and keeps a ruled edge (Fig 11). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  wide = false,
  disabled = false,
}: {
  /* what a screen reader calls the group; the plate may draw it beside or above */
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  wide?: boolean;
  disabled?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, wide ? styles.wide : styles.inline]}>
      {options.map((option) => {
        const chosen = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: chosen, disabled }}
            disabled={disabled}
            onPress={() => onChange(option)}
            hitSlop={reach(wide ? tall.wide : tall.inline)}
            style={[wide ? styles.segWide : styles.seg, chosen && (disabled ? styles.ringed : styles.on)]}
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.words,
                  { color: disabled ? light.disabled : chosen ? light.paper : pressed ? light.ink : light.muted },
                ]}
              >
                {option}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* Vibe's segments are drawn 27 tall; Units' fill the 32 field less its padding
   and rule. */
const tall = { wide: 27, inline: parseFloat(light.pillM) - 2 * 4 - 2 * 1 };

const styles = StyleSheet.create({
  group: { flexDirection: 'row', gap: 4, padding: 4, borderWidth: 1, borderColor: light.edge, backgroundColor: light.field },
  wide: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start', height: parseFloat(light.pillM) },
  segWide: { flex: 1, height: tall.wide, alignItems: 'center', justifyContent: 'center' },
  seg: { height: tall.inline, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: light.ink },
  ringed: { borderWidth: 1, borderColor: light.edge },
  words: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 0.66,
    fontVariant: ['tabular-nums'],
  },
});
