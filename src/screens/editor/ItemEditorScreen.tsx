import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Notice, ScreenHeader } from '../../kit';
import type { RootStackParamList } from '../../nav/routes';
import { loadCloset, updateCloset, type Garment, type LoadFailure } from '../../lib/store';
import { loadWears, wornOf, type Worn } from '../../lib/wears';
import { capture, wornLine } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';
import { font } from '../../theme/font';
import { Camera, Check, Refresh } from '../../theme/icons';
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

/* Fig 19 and Fig 19b: two swiped pages for the cut-out and the photograph
   when the garment carries one (ADR 0028), then the fields. "Worn n times ·
   last on …" comes from the wear log (ADR 0023).

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
  const [page, setPage] = useState(0);
  const [trackW, setTrackW] = useState(0);
  const track = useRef<React.ElementRef<typeof ScrollView>>(null);
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
  /* garmentOf rebuilds the four form fields only. The photograph and the
     favourite stay on the garment that was loaded, so a save cannot drop them
     (ADR 0028, ADR 0027). */
  const toSave =
    edited && garment
      ? {
          ...edited,
          ...(garment.photo ? { photo: garment.photo } : {}),
          ...(garment.favourite ? { favourite: garment.favourite } : {}),
        }
      : null;
  const wornText = worn && worn.times > 0 && worn.lastDay ? wornLine(worn.times, worn.lastDay) : undefined;

  async function save() {
    if (!toSave || pressed.current) return;
    pressed.current = true;
    setSaving(true);
    setFailed(false);
    const result = await updateCloset((garments) => garments.map((g) => (g.id === id ? toSave : g)));
    if (result.ok) {
      navigation.goBack();
    } else {
      pressed.current = false;
      setSaving(false);
      setFailed(true);
    }
  }

  function onPagesScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!trackW) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / trackW);
    if (next !== page) setPage(next);
  }

  function goPage(next: number) {
    if (trackW) track.current?.scrollTo({ x: next * trackW, animated: true });
    setPage(next);
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
          <View style={styles.pics}>
            <ScrollView
              ref={track}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
              onMomentumScrollEnd={onPagesScroll}
              style={styles.track}
              accessibilityLabel={t.photo}
            >
              <View
                style={[styles.page, trackW ? { width: trackW } : null]}
                accessibilityElementsHidden={page !== 0}
                importantForAccessibility={page === 0 ? 'yes' : 'no-hide-descendants'}
              >
                {garment.photo ? (
                  <Image
                    source={{ uri: garment.photo }}
                    style={styles.pic}
                    accessibilityLabel={t.theCutOut}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={styles.picEmpty} accessibilityLabel={t.theCutOut} />
                )}
              </View>
              <View
                style={[styles.page, styles.pagePhoto, trackW ? { width: trackW } : null]}
                accessibilityElementsHidden={page !== 1}
                importantForAccessibility={page === 1 ? 'yes' : 'no-hide-descendants'}
              >
                {garment.photo ? (
                  <Image
                    source={{ uri: garment.photo }}
                    style={styles.pic}
                    accessibilityLabel={t.yourPhotograph}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={styles.picEmpty} accessibilityLabel={t.yourPhotograph} />
                )}
                <View style={styles.mark} accessibilityElementsHidden>
                  <Camera color={light.muted} />
                  <Text style={styles.markText}>{t.photo}</Text>
                </View>
              </View>
            </ScrollView>
            <View style={styles.dots} accessibilityRole="tablist" accessibilityLabel={t.photo}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: page === 0 }}
                accessibilityLabel={t.theCutOut}
                onPress={() => goPage(0)}
                style={styles.dotHit}
              >
                <View style={[styles.dot, page === 0 && styles.dotOn]} />
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: page === 1 }}
                accessibilityLabel={t.yourPhotograph}
                onPress={() => goPage(1)}
                style={styles.dotHit}
              >
                <View style={[styles.dot, page === 1 && styles.dotOn]} />
              </Pressable>
            </View>
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
  pics: { marginHorizontal: -24, marginTop: -20, marginBottom: 20, backgroundColor: light.renderA },
  track: { height: 220 },
  page: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: light.renderA,
  },
  pagePhoto: {
    experimental_backgroundImage: `linear-gradient(155deg, ${light.photoGround} 0%, ${light.photoShade} 100%)`,
  },
  pic: { width: '72%', height: '100%', resizeMode: 'contain' },
  picEmpty: { width: '72%', height: '100%', backgroundColor: light.field },
  mark: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: light.hairline,
    backgroundColor: light.surface,
  },
  markText: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.66, color: light.muted },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
  },
  dotHit: { width: 16, height: 24, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: light.ink, opacity: 0.2 },
  dotOn: { opacity: 0.7 },
  worn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 16, marginHorizontal: 4 },
  wornText: { flexShrink: 1, fontFamily: font.regular, fontSize: 12, lineHeight: 12, color: light.muted },
  wornCount: { fontFamily: font.medium, color: light.ink, fontVariant: ['tabular-nums'] },
  wearNotice: { marginBottom: 16 },
});
