import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Notice, PhotoMark, ScreenHeader } from '../../kit';
import { loadGarmentPhoto } from '../../lib/garmentPhoto';
import type { RootStackParamList } from '../../nav/routes';
import { loadCloset, updateCloset, type Garment, type LoadFailure } from '../../lib/store';
import { loadWears, wornOf, type Worn } from '../../lib/wears';
import { capture, wornLine } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';
import { font } from '../../theme/font';
import { Check, Refresh } from '../../theme/icons';
import { light } from '../../theme/tokens';
import {
  FormFrame,
  FormSkeleton,
  formStyles,
  garmentOf,
  GarmentForm,
  sameValues,
  valuesOf,
  type FormValues,
} from '../add/GarmentForm';

const t = drawn.fig19;

type Loaded =
  | { state: 'loading' }
  | { state: 'failed'; failure: LoadFailure }
  | { state: 'ready'; garment: Garment | undefined };

/* Fig 19 and Fig 19b. One picture: the photograph with its Photo mark, or an
   empty frame like GarmentTile when there is none. Nothing makes cut-outs yet,
   so there is no second page to swipe to. "Worn n
   times · last on …" comes from the wear log (ADR 0023).

   CLOSE DISCARDS AN UNSAVED EDIT, AND NOTHING ASKS (docs/States.md). Save is
   the only way to keep a change. Every other way out, Close, the back gesture
   or the back button, leaves the garment as saved, so the editor never opens
   on fields the closet does not hold. */
export function ItemEditorScreen() {
  const navigation = useNavigation();
  const { id } = useRoute<RouteProp<RootStackParamList, 'ItemEditor'>>().params;
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' });
  const [values, setValues] = useState<FormValues | undefined>();
  const [worn, setWorn] = useState<Worn | undefined>();
  const [wearsFailed, setWearsFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<FormValues | undefined>();
  const pressed = useRef(false);

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof loadCloset>>) => {
      if (!result.ok) return setLoaded({ state: 'failed', failure: result.failure });
      const garment = result.garments.find((g) => g.id === id);
      const now = garment && valuesOf(garment);
      setOriginal(now);
      setValues(now);
      setLoaded({ state: 'ready', garment });
    },
    [id],
  );

  const applyWears = useCallback(() => {
    loadWears().then((result) => {
      if (result.ok) {
        setWorn(wornOf(result.log, id));
        setWearsFailed(false);
      } else {
        setWorn(undefined);
        setWearsFailed(true);
      }
    });
  }, [id]);

  useEffect(() => {
    let live = true;
    loadCloset().then((result) => live && apply(result));
    loadWears().then((result) => {
      if (!live) return;
      if (result.ok) {
        setWorn(wornOf(result.log, id));
        setWearsFailed(false);
      } else {
        setWorn(undefined);
        setWearsFailed(true);
      }
    });
    return () => {
      live = false;
    };
  }, [apply, id]);

  const retry = () => {
    setLoaded({ state: 'loading' });
    loadCloset().then(apply);
  };

  const garment = loaded.state === 'ready' ? loaded.garment : undefined;
  const dirty = !!values && !!original && !sameValues(values, original);
  const edited = values && garmentOf(id, values);
  const wornText = worn && worn.times > 0 && worn.lastDay ? wornLine(worn.times, worn.lastDay) : undefined;
  const photoUri = garment ? (() => {
    const found = loadGarmentPhoto(id);
    return found.ok ? found.uri : null;
  })() : null;
  const hasPhoto = Boolean(garment?.photo && photoUri);

  async function save() {
    if (!edited || pressed.current) return;
    pressed.current = true;
    setSaving(true);
    setFailed(false);
    /* Start from the saved garment inside updateCloset, so a field added later
       survives every save, and lay the form's fields over it. A style or warmth
       the form cleared is dropped (store.ts). */
    const result = await updateCloset((garments) =>
      garments.map((g) => {
        if (g.id !== id) return g;
        const next: Garment = { ...g, ...edited };
        if (!edited.style) delete next.style;
        if (!edited.warmth) delete next.warmth;
        return next;
      }),
    );
    if (result.ok) {
      navigation.goBack();
    } else {
      pressed.current = false;
      setSaving(false);
      setFailed(true);
    }
  }

  return (
    <FormFrame>
      <View style={styles.head}>
        <ScreenHeader eyebrow={t.yourWardrobe} title={garment ? garment.name : screens.itemEditor} />
      </View>
      <ScrollView contentContainerStyle={formStyles.body} keyboardShouldPersistTaps="handled">
        {loaded.state === 'loading' && <FormSkeleton />}
        {loaded.state === 'failed' && <Notice text={capture.closetUnreadable} action={capture.tryAgain} onPress={retry} />}
        {loaded.state === 'ready' && !garment && <Text style={formStyles.note}>{capture.notInCloset}</Text>}
        {garment ? (
          <View style={[styles.pic, hasPhoto && styles.picPhoto]} testID="editor-pics">
            {hasPhoto ? (
              <>
                <Image
                  source={{ uri: photoUri! }}
                  style={styles.photo}
                  accessibilityLabel={t.yourPhotograph}
                  accessibilityIgnoresInvertColors
                />
                <PhotoMark style={styles.markPad} />
              </>
            ) : (
              <View style={styles.picEmpty} testID="editor-pic-empty" />
            )}
          </View>
        ) : null}
        {garment && values && <GarmentForm values={values} onChange={setValues} />}
        {garment && wearsFailed ? (
          <Notice text={capture.wearsUnreadable} action={capture.tryAgain} onPress={applyWears} style={styles.wearNotice} />
        ) : null}
        {garment && wornText ? <WornLine text={wornText} times={worn!.times} /> : null}
        {failed && (
          <Text accessibilityRole="alert" style={formStyles.problem}>
            {capture.saveFailed}
          </Text>
        )}
      </ScrollView>
      <View style={formStyles.foot}>
        <Button size="small" kind="outline" label={t.close} onPress={() => navigation.goBack()} />
        {garment && <Button size="small" label={t.save} icon={Check} disabled={!dirty || !edited || saving} onPress={save} />}
      </View>
    </FormFrame>
  );
}

function WornLine({ text, times }: { text: string; times: number }) {
  const count = String(times);
  const at = text.indexOf(count);
  const before = text.slice(0, at);
  const after = text.slice(at + count.length);
  return (
    <View style={styles.worn}>
      <Refresh color={light.muted} size={14} />
      <Text style={styles.wornText}>
        {before}
        <Text style={styles.wornCount}>{count}</Text>
        {after}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 8 },
  pic: {
    height: 220,
    marginHorizontal: -24,
    marginTop: -20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: light.renderA,
  },
  picPhoto: {
    experimental_backgroundImage: `linear-gradient(155deg, ${light.photoGround} 0%, ${light.photoShade} 100%)`,
  },
  photo: { width: '72%', height: '100%', resizeMode: 'contain' },
  picEmpty: { width: '72%', height: '100%', backgroundColor: light.field },
  markPad: { bottom: 16, left: 16 },
  worn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 16, marginHorizontal: 4 },
  wornText: { flexShrink: 1, fontFamily: font.regular, fontSize: 12, lineHeight: 12, color: light.muted },
  wornCount: { fontFamily: font.medium, color: light.ink, fontVariant: ['tabular-nums'] },
  wearNotice: { marginBottom: 16 },
});
