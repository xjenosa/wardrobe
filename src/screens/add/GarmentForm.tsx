import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Garment } from '../../lib/store';
import { categories, vibes, warmths, type Category, type Vibe, type Warmth } from '../../lib/words';
import { drawn } from '../../strings/drawn';
import { light } from '../../theme/tokens';

const t = drawn.fig18;

/* What the form holds while it is being filled in. A choice not yet made is
   absent, so nothing is saved that the person did not choose. */
export type FormValues = { name: string; category?: Category; warmth?: Warmth; style?: Vibe };

export const emptyValues: FormValues = { name: '' };

export const valuesOf = (g: Garment): FormValues => ({
  name: g.name,
  category: g.category,
  warmth: g.warmth,
  style: g.style,
});

export const sameValues = (a: FormValues, b: FormValues) =>
  a.name === b.name && a.category === b.category && a.warmth === b.warmth && a.style === b.style;

/* A garment needs a name and a category, and a warmth unless it is an
   accessory (README.md). Anything less is not a garment yet. */
export function garmentOf(id: string, v: FormValues): Garment | null {
  const name = v.name.trim();
  if (!name || !v.category) return null;
  const style = v.style ? { style: v.style } : {};
  if (v.category === 'Accessories') return { id, name, category: v.category, ...(v.warmth ? { warmth: v.warmth } : {}), ...style };
  if (!v.warmth) return null;
  return { id, name, category: v.category, warmth: v.warmth, ...style };
}

type Props = { values: FormValues; onChange: (next: FormValues) => void };

/* Fig 18's fields, which Fig 19 repeats. Warmth is the five words under "Not
   sure?" and nothing else: the temperature range behind a word is the
   service's, so no slider is drawn here that would have to compute one. */
export function GarmentForm({ values, onChange }: Props) {
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  return (
    <View>
      <Field label={t.name}>
        <TextInput
          accessibilityLabel={t.name}
          value={values.name}
          onChangeText={(name) => set({ name })}
          style={styles.input}
        />
      </Field>
      <Field label={t.category}>
        <Chips options={categories} chosen={values.category} label={t.category} onChoose={(category) => set({ category })} />
      </Field>
      <Field label={t.warmth}>
        <Chips options={warmths} chosen={values.warmth} label={t.warmth} onChoose={(warmth) => set({ warmth: warmth === values.warmth ? undefined : warmth })} />
      </Field>
      <Field label={t.style}>
        <Chips
          options={vibes}
          chosen={values.style}
          label={t.style}
          onChoose={(style) => set({ style: style === values.style ? undefined : style })}
        />
      </Field>
    </View>
  );
}

/* The form's own shape with nothing in it, drawn while the garment is read. */
export function FormSkeleton() {
  return (
    <View>
      {[t.name, t.category, t.warmth, t.style].map((label) => (
        <Field key={label} label={label}>
          <View style={styles.empty} />
        </Field>
      ))}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chips<T extends string>({
  options,
  chosen,
  label,
  onChoose,
}: {
  options: readonly T[];
  chosen: T | undefined;
  label: string;
  onChoose: (option: T) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => {
        const on = option === chosen;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChoose(option)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* The page both screens sit on. The footer is lifted with the keyboard, so
   Save is not covered once the name has been typed.

   A screen that covers the whole phone says `fullScreen`. The native
   SafeAreaView drew Add garment's top bar under the status bar when it opened
   as a full-screen modal, though the insets it was given were right, so the
   top is made room for by hand there. In a sheet, which already starts below
   the status bar, the same insets would push the bar down twice. */
export function FormFrame({ children, fullScreen = false }: { children: React.ReactNode; fullScreen?: boolean }) {
  const { top } = useSafeAreaInsets();
  return (
    <SafeAreaView style={formStyles.page}>
      {fullScreen && <View style={{ height: top }} />}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={formStyles.page}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* Fig 18's footer buttons. */
export function FormButton({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, primary && !disabled && styles.buttonPrimary]}
    >
      <Text style={[styles.buttonText, primary && !disabled && styles.buttonTextPrimary, disabled && styles.buttonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

export const formStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper },
  topbar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: light.hairline },
  title: { fontSize: 15, fontWeight: '600', color: light.ink },
  body: { padding: 24, paddingTop: 20 },
  note: { fontSize: 13, color: light.muted, marginBottom: 16 },
  problem: { fontSize: 13, color: light.grave, marginTop: 4 },
  foot: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: light.hairline },
});

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { marginBottom: 8, fontSize: 11, fontWeight: '600', letterSpacing: 1.65, textTransform: 'uppercase', color: light.muted },
  input: { height: 44, borderWidth: 1, borderColor: light.edge, backgroundColor: light.field, paddingHorizontal: 12, fontSize: 15, color: light.ink },
  empty: { height: 44, borderWidth: 1, borderColor: light.hairline, backgroundColor: light.field },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: light.edge, backgroundColor: light.field },
  chipOn: { backgroundColor: light.ink, borderColor: light.ink },
  chipText: { fontSize: 13, fontWeight: '500', color: light.muted },
  chipTextOn: { color: light.paper },
  button: { height: 44, justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1, borderColor: light.edge },
  buttonPrimary: { backgroundColor: light.ink, borderColor: light.ink, paddingHorizontal: 24 },
  buttonText: { fontSize: 13, fontWeight: '500', color: light.ink },
  buttonTextPrimary: { color: light.paper },
  buttonTextDisabled: { color: light.disabled },
});
