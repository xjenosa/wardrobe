import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Label, Notice, ScreenHeader, Segmented } from '../../kit';
import { reach } from '../../kit/reach';
import { chooseFixture, hasService } from '../../lib/pick';
import { defaults, loadPrefs, resetPrefs, savePrefs, type Loaded } from '../../lib/prefs';
import { loadReference, removeReference, type Kept } from '../../lib/reference';
import { sampleCloset } from '../../lib/sample';
import { resetCloset } from '../../lib/store';
import type { Units } from '../../lib/words';
import { drawn } from '../../strings/drawn';
import { frame } from '../../strings/frame';
import { screens, stub } from '../../strings/screens';
import { font } from '../../theme/font';
import { ChevronRight } from '../../theme/icons';
import { light } from '../../theme/tokens';

const t = drawn.fig23;
/* the dash the plates draw for a value nobody knows yet (Fig 14d) */
const unknown = drawn.fig14D.s;

type Problem = { text: string; retry: () => void };

/* FIG 23, YOUR SETTINGS, in the plate's two sections and its order. It opens
   as a sheet over what opened it, which starts below the status bar on iOS,
   so it pads with the SafeAreaView as the editor does.

   - Units is kept on the phone (src/lib/prefs.ts), and Reset preferences
     forgets it.
   - Location and the image model's key are drawn as the plate draws them,
     with the dash for a value not known yet. Each opens a chooser no plate
     draws, so they open nothing until one is drawn at the source (ADR 0006),
     and the place is the forecast's to find (track B).
   - Reference photo is the one First run keeps (ADR 0025). Change opens First
     run, and Remove forgets it.
   - With no service set, the sample closet and the fixture's days stay here,
     under a heading of their own, so every track can still build on them.

   Anything that fails says so at the top, under the title, with a way to try
   again, so it is seen without scrolling. */
export function YouScreen() {
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<Loaded | null>(null);
  const [photo, setPhoto] = useState<Kept>({ ok: true, uri: null });
  const [problem, setProblem] = useState<Problem | null>(null);

  const read = useCallback(async () => {
    const loaded = await loadPrefs();
    setPrefs(loaded);
    setProblem(loaded.ok ? null : { text: frame.prefsUnreadable, retry: () => read() });
  }, []);

  useEffect(() => {
    read();
  }, [read]);

  /* First run may have kept a new photo while You sat under it. */
  useFocusEffect(useCallback(() => setPhoto(loadReference()), []));

  const ready = prefs?.ok ? prefs.prefs : null;

  async function choose(units: Units) {
    if (!ready) return;
    setPrefs({ ok: true, prefs: { ...ready, units } });
    const saved = await savePrefs({ ...ready, units });
    if (saved.ok) return setProblem(null);
    setPrefs({ ok: true, prefs: ready });
    setProblem({ text: frame.prefsNotSaved, retry: () => choose(units) });
  }

  async function reset() {
    const done = await resetPrefs();
    if (!done.ok) return setProblem({ text: frame.prefsNotSaved, retry: () => reset() });
    setPrefs({ ok: true, prefs: defaults });
    setProblem(null);
  }

  function remove() {
    if (!removeReference().ok) return setProblem({ text: frame.photoNotRemoved, retry: remove });
    setPhoto({ ok: true, uri: null });
    setProblem(null);
  }

  const loadSample = async () => {
    if ((await resetCloset(sampleCloset)).ok) navigation.navigate('Tabs', { screen: 'Closet' });
  };

  const uri = photo.ok ? photo.uri : null;
  const units = (ready ?? defaults).units;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.name}>
          <ScreenHeader title={screens.you} onClose={() => navigation.goBack()} />
        </View>
        {problem ? <Notice text={problem.text} action={drawn.fig11.tryAgain} onPress={problem.retry} style={styles.notice} /> : null}

        <Label style={styles.legend}>{t.preferences}</Label>
        <Row label={t.location} ruled>
          <Pill text={unknown} />
        </Row>
        <Row label={t.units} ruled>
          <Segmented
            label={t.units}
            options={[t.c, t.f]}
            value={units === 'C' ? t.c : t.f}
            onChange={(word) => choose(word === t.c ? 'C' : 'F')}
            disabled={!ready}
          />
        </Row>
        <Row label={t.resetPreferences}>
          <RowButton label={t.reset} onPress={reset} disabled={!ready} />
        </Row>

        <Label style={styles.legend}>{t.pictures}</Label>
        <Row label={t.openaiKey} sub={t.storedOnThisDeviceOnly} ruled>
          <Pill text={unknown} digits />
        </Row>
        <View style={styles.refRow}>
          <View style={styles.thumb}>
            {uri ? <Image source={{ uri }} resizeMode="cover" accessible={false} style={StyleSheet.absoluteFill} /> : null}
          </View>
          <View style={styles.refMeta}>
            <Text style={styles.key}>{t.referencePhoto}</Text>
            <View style={styles.refActs}>
              <RowButton label={t.change} onPress={() => navigation.navigate('FirstRun')} wide />
              <RowButton label={t.remove} onPress={remove} disabled={!uri} wide />
            </View>
          </View>
        </View>

        {hasService() ? null : (
          <>
            <Label style={styles.legend}>{stub.withoutService}</Label>
            <View style={styles.building}>
              <Button kind="outline" size="small" label={stub.sampleCloset} onPress={loadSample} />
              <Button kind="outline" size="small" label={stub.fixtureFits} onPress={() => chooseFixture('fits')} />
              <Button kind="outline" size="small" label={stub.fixtureNothingFits} onPress={() => chooseFixture('nothingFits')} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* One setting (.set-row), with its name and what sets it at the far end. The
   last row before a section's next heading has no rule under it. */
function Row({ label, sub, ruled = false, children }: { label: string; sub?: string; ruled?: boolean; children: ReactNode }) {
  return (
    <View style={[styles.row, ruled && styles.ruled]}>
      <View style={styles.setLabel}>
        <Text style={styles.key}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/* A value in its field, as .val-pill and .key-pill draw it. It opens nothing
   yet, so it is drawn and not a button. */
function Pill({ text, digits = false }: { text: string; digits?: boolean }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillText, digits && styles.digits]}>{text}</Text>
      <ChevronRight color={light.muted} />
    </View>
  );
}

/* The small ruled capitals You draws for Reset, Change and Remove
   (.set-row .link-btn). Only You draws them, so they live here. */
function RowButton({ label, onPress, disabled = false, wide = false }: { label: string; onPress: () => void; disabled?: boolean; wide?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={reach(ROW_BUTTON)}
      style={({ pressed }) => [styles.rowButton, wide && styles.refAct, pressed && styles.touched]}
    >
      <Text style={[styles.rowButtonText, disabled && styles.off]}>{label}</Text>
    </Pressable>
  );
}

const ROW_BUTTON = parseFloat(light.pillM);

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper },
  body: { paddingTop: 8, paddingHorizontal: 24, paddingBottom: 24 },
  name: { marginTop: 4, marginHorizontal: 4 },
  notice: { marginTop: 16 },
  legend: { marginTop: 24, marginHorizontal: 4, letterSpacing: 1.76 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 16 },
  ruled: { borderBottomWidth: 1, borderBottomColor: light.hairline },
  setLabel: { flexShrink: 1, gap: 4 },
  key: { fontFamily: font.medium, fontSize: 15, lineHeight: 18, letterSpacing: -0.06, color: light.ink },
  sub: { fontFamily: font.regular, fontSize: 11, lineHeight: 15.4, color: light.muted },
  pill: {
    height: parseFloat(light.pillL),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: light.edge,
    backgroundColor: light.field,
  },
  pillText: { fontFamily: font.medium, fontSize: 13, letterSpacing: 0.13, color: light.ink },
  digits: { fontVariant: ['tabular-nums'], letterSpacing: 0.52 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 20 },
  thumb: {
    width: 56,
    height: 70,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: light.hairline,
    experimental_backgroundImage: `linear-gradient(178deg, ${light.renderA}, ${light.renderB})`,
  },
  refMeta: { flex: 1, gap: 4 },
  refActs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  rowButton: {
    height: ROW_BUTTON,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: light.edge,
  },
  refAct: { minWidth: 88 },
  touched: { borderColor: light.muted },
  rowButtonText: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
    color: light.ink,
  },
  off: { color: light.disabled },
  building: { gap: 8 },
});
