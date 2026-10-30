import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Field, Label } from '../../kit';
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
      <Field label={t.name} value={values.name} onChangeText={(name) => set({ name })} />
      <View style={styles.field}>
        <Label>{t.category}</Label>
        <Chips options={categories} chosen={values.category} label={t.category} onChoose={(category) => set({ category })} />
      </View>
      <View style={styles.field}>
        <Label>{t.warmth}</Label>
        <Chips
          kind="preset"
          options={warmths}
          chosen={values.warmth}
          label={t.warmth}
          onChoose={(warmth) => set({ warmth: warmth === values.warmth ? undefined : warmth })}
        />
      </View>
      <View style={styles.field}>
        <Label>{t.style}</Label>
        <Chips
          options={vibes}
          chosen={values.style}
          label={t.style}
          onChoose={(style) => set({ style: style === values.style ? undefined : style })}
        />
      </View>
    </View>
  );
}

/* The form's own shape with nothing in it, drawn while the garment is read. */
export function FormSkeleton() {
  return (
    <View>
      {[t.name, t.category, t.warmth, t.style].map((label) => (
        <View key={label} style={styles.field}>
          <Label>{label}</Label>
          <View style={styles.empty} />
        </View>
      ))}
    </View>
  );
}

function Chips<T extends string>({
  options,
  chosen,
  label,
  onChoose,
  kind = 'option',
}: {
  options: readonly T[];
  chosen: T | undefined;
  label: string;
  onChoose: (option: T) => void;
  kind?: 'option' | 'preset';
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => (
        <Chip
          key={option}
          kind={kind}
          role="radio"
          label={option}
          on={option === chosen}
          onPress={() => onChoose(option)}
        />
      ))}
    </View>
  );
}

/* The page both screens sit on. The footer is lifted with the keyboard, so
   Save is not covered once the name has been typed. */
export function FormFrame({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={formStyles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={formStyles.page}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const formStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper },
  body: { padding: 24, paddingTop: 20 },
  note: { fontSize: 13, color: light.muted, marginBottom: 16 },
  problem: { fontSize: 13, color: light.grave, marginTop: 4 },
  foot: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: light.hairline },
});

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  empty: { height: 44, borderWidth: 1, borderColor: light.hairline, backgroundColor: light.field },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
