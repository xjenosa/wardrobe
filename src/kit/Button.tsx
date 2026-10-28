import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { font } from '../theme/font';
import type { Icon } from '../theme/icons';
import { light } from '../theme/tokens';

/* THE THREE BUTTONS THE PLATES DRAW, at the two heights they draw them.

   primary  ink, the one thing a screen asks for: Wear this (Figs 08 to 12),
            Take a photo (Fig 05), Save (Figs 18 and 19)
   outline  a ruled box: Choose a photo (Fig 05), Add your first garment
            (Fig 06), Cancel and Close (Figs 18 and 19)
   quiet    words and an icon, nothing round them: Shuffle (Figs 08 to 12)

   large is 48 tall, a page's own buttons; small is 44, a form's foot.

   DISABLED IS DRAWN, NOT DIMMED: a primary loses its ink and keeps a ruled
   edge, and every kind's words turn the disabled grey (Fig 11). Pressed shows
   the stylesheet's hover, the only feedback the mockup draws for a touch. */
export type ButtonKind = 'primary' | 'outline' | 'quiet';
export type ButtonSize = 'large' | 'small';

export function Button({
  label,
  onPress,
  kind = 'primary',
  size = 'large',
  icon: Glyph,
  iconAfter = false,
  wide = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: Icon;
  /* Wear this draws its check after the words; Save and Shuffle before */
  iconAfter?: boolean;
  /* takes the row's spare width, as Wear this and Fig 18's Save to closet do */
  wide?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colourOf = (pressed: boolean) =>
    disabled ? light.disabled : kind === 'primary' ? light.paper : kind === 'quiet' && !pressed ? light.muted : light.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        box[kind],
        size === 'small' && small[kind],
        kind === 'primary' && (disabled ? styles.primaryOff : styles.primaryOn),
        pressed && touched[kind],
        wide && styles.wide,
        style,
      ]}
    >
      {({ pressed }) => {
        const glyph = Glyph ? <Glyph color={colourOf(pressed)} size={ICON[kind][size]} /> : null;
        return (
          <>
            {iconAfter ? null : glyph}
            <Text style={[styles.words, wordsOf(kind, size, wide), { color: colourOf(pressed) }]}>{label}</Text>
            {iconAfter ? glyph : null}
          </>
        );
      }}
    </Pressable>
  );
}

/* the size each plate draws its button's icon at */
const ICON: Record<ButtonKind, Record<ButtonSize, number>> = {
  primary: { large: 17, small: 14 },
  outline: { large: 15, small: 14 },
  quiet: { large: 15, small: 14 },
};

/* .btn-primary is 15 with a little tracking; .btn-save is 13, or 15 when it
   is wide (Fig 18); the rest are 13. */
function wordsOf(kind: ButtonKind, size: ButtonSize, wide: boolean) {
  if (kind === 'primary') return size === 'large' ? words.primary : wide ? words.save : words.plain;
  return kind === 'quiet' ? words.quiet : words.plain;
}

const styles = StyleSheet.create({
  button: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  wide: { flexGrow: 1, flexShrink: 1 },
  primaryOn: { borderColor: light.ink, backgroundColor: light.ink },
  primaryOff: { borderColor: light.edge },
  words: { fontFamily: font.medium },
});

const box = StyleSheet.create({
  primary: { paddingHorizontal: 24, borderWidth: 1 },
  outline: { paddingHorizontal: 24, borderWidth: 1, borderColor: light.edge },
  quiet: { paddingHorizontal: 16 },
});

const small = StyleSheet.create({
  primary: { height: 44 },
  outline: { height: 44, paddingHorizontal: 20 },
  quiet: { height: 44 },
});

const touched = StyleSheet.create({
  primary: { opacity: 0.9, transform: [{ translateY: 1 }] },
  outline: { borderColor: light.muted },
  quiet: {},
});

const words = StyleSheet.create({
  primary: { fontSize: 15, letterSpacing: 0.15 },
  save: { fontSize: 15 },
  plain: { fontSize: 13 },
  quiet: { fontSize: 13, letterSpacing: 0.13 },
});
