import { Pressable, StyleSheet, Text } from 'react-native';

import { font } from '../theme/font';
import type { Icon } from '../theme/icons';
import { light } from '../theme/tokens';

/* THE CHIPS THE PLATES DRAW: a ruled pill that fills with ink when it is on.
   Four looks, one for each place they sit.

   option    Season and Style on the garment form (Figs 18 and 19), 38 tall
   feedback  Too warm and Too cold under Today (Figs 08 to 12), 32, with an icon
   filter    the category row over the closet (Fig 15), 32, in capitals
   preset    the five warmth words under "Not sure?" (Figs 18 and 19), 32, in
             capitals on the field colour

   A chip that turns on and off by itself is a button that is selected or not.
   One of a set where only one can be on is a radio, so pass role="radio" and
   group the set with accessibilityRole="radiogroup".

   Disabled keeps the rule and turns the words grey (Fig 11); one that is also
   on loses its ink, as the segmented control does. Pressed shows the
   stylesheet's hover. */
export type ChipKind = 'option' | 'feedback' | 'filter' | 'preset';

export function Chip({
  label,
  onPress,
  on = false,
  kind = 'option',
  role = 'toggle',
  icon: Glyph,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  on?: boolean;
  kind?: ChipKind;
  role?: 'toggle' | 'radio';
  icon?: Icon;
  disabled?: boolean;
}) {
  const inked = on && !disabled;
  const colourOf = (pressed: boolean) =>
    disabled ? light.disabled : inked ? light.paper : pressed || kind === 'preset' ? light.ink : light.muted;
  return (
    <Pressable
      accessibilityRole={role === 'radio' ? 'radio' : 'button'}
      accessibilityState={role === 'radio' ? { checked: on, disabled } : { selected: on, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, look[kind], pressed && !inked && touched[kind], inked && styles.on]}
    >
      {({ pressed }) => (
        <>
          {Glyph ? <Glyph color={colourOf(pressed)} size={kind === 'filter' ? 11 : 13} /> : null}
          <Text style={[words[kind], { color: colourOf(pressed) }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const pill = (token: string) => parseFloat(token);

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: light.edge },
  on: { backgroundColor: light.ink, borderColor: light.ink },
});

const look = StyleSheet.create({
  option: { height: pill(light.pillL), paddingHorizontal: 16, backgroundColor: light.field },
  feedback: { height: pill(light.pillM), paddingHorizontal: 12 },
  filter: { height: pill(light.pillM), paddingHorizontal: 16 },
  preset: { height: pill(light.pillM), paddingHorizontal: 12, backgroundColor: light.field },
});

const touched = StyleSheet.create({
  option: { borderColor: light.muted },
  feedback: { borderColor: light.muted },
  filter: { borderColor: light.muted },
  preset: { backgroundColor: light.track },
});

const caps = { fontFamily: font.semibold, fontSize: 11, textTransform: 'uppercase' } as const;

const words = StyleSheet.create({
  option: { fontFamily: font.medium, fontSize: 13, letterSpacing: 0.065 },
  feedback: { fontFamily: font.medium, fontSize: 11, letterSpacing: 0.11 },
  filter: { ...caps, letterSpacing: 1.43 },
  preset: { ...caps, letterSpacing: 1.32 },
});
