import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { font } from '../theme/font';
import { light } from '../theme/tokens';
import { Label } from './Label';

/* A FIELD TO TYPE IN, UNDER ITS LABEL (.field, .input), as Name and Material
   are on the garment form (Figs 18 and 19). The label is also the box's own
   name, so a screen reader says it on the way in.

   No plate draws a field gone wrong, but the stylesheet does (.is-wrong,
   .f-wrong). The box is ruled in the grave colour and the reason sits under it,
   said aloud as it appears. A hint sits in the same place, muted (.form-hint),
   and gives way to the reason. Nothing draws a disabled field, so one keeps
   its box and greys its words, as the kit's other pieces do. */
export function Field({
  label,
  error,
  hint,
  disabled = false,
  ...input
}: Omit<TextInputProps, 'style' | 'editable' | 'accessibilityLabel' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        {...input}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        editable={!disabled}
        placeholderTextColor={light.muted}
        style={[styles.input, error ? styles.wrong : null, disabled && styles.off]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[styles.under, styles.reason]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.under, styles.hint]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: light.edge,
    backgroundColor: light.field,
    fontFamily: font.medium,
    fontSize: 15,
    letterSpacing: -0.075,
    color: light.ink,
  },
  wrong: { borderColor: light.grave },
  off: { color: light.disabled },
  under: { marginTop: 8, marginHorizontal: 4, fontFamily: font.regular, fontSize: 12, lineHeight: 16.8 },
  reason: { color: light.grave },
  hint: { color: light.muted },
});
