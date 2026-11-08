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

import { Button, Notice, PhotoMark, ScreenHeader } from '../../kit';
import { reach } from '../../kit/reach';
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

/* Fig 19 and Fig 19b. Two swiped pages only when a cut-out exists; a garment
   with a photograph and no cut-out shows the photograph alone (never labelled
   the cut-out), and with neither an empty frame like GarmentTile. "Worn n
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
  const wornText = worn && worn.times > 0 && worn.lastDay ? wornLine(worn.times, worn.lastDay) : undefined;
  const photoUri = garment ? (() => {
    const found = loadGarmentPhoto(id);
    return found.ok ? found.uri : null;
  })() : null;
  /* Two pages only when a cut-out exists. A photograph alone is never labelled
     the cut-out; with neither, one empty frame. */
  const hasCutOut = Boolean(garment?.cutOut);
  const hasPhoto = Boolean(garment?.photo && photoUri);
  const pages: ('cutOut' | 'photo' | 'empty')[] = hasCutOut
    ? hasPhoto
      ? ['cutOut', 'photo']
      : ['cutOut']
    : hasPhoto
      ? ['photo']
      : ['empty'];
  const multi = pages.length > 1;

  async function save() {
    if (!edited || pressed.current) return;
    pressed.current = true;
    setSaving(true);
    setFailed(false);
    /* Start from the saved garment inside updateCloset so phone-only fields
       stay, and a cleared style or warmth still clears (store.ts). */
    const result = await updateCloset((garments) =>
      garments.map((g) => {
        if (g.id !== id) return g;
        /* Form fields from the edit; phone-only fields from what was saved. */
        return {
          ...edited,
          ...(g.photo !== undefined ? { photo: g.photo } : {}),
          ...(g.favourite !== undefined ? { favourite: g.favourite } : {}),
          ...(g.cutOut !== undefined ? { cutOut: g.cutOut } : {}),
        };
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
      {/* Fig 19 .drawer > .render: picture stays at the top, outside the scroll, and can shrink to 96. */}
      {garment ? (
        <View style={styles.pics} testID="editor-pics" onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
          {trackW > 0 ? (
            <ScrollView
              ref={track}
              horizontal={multi}
              pagingEnabled={multi}
              scrollEnabled={multi}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onPagesScroll}
              style={styles.track}
              testID="editor-pics-track"
              accessibilityLabel={multi ? t.photo : undefined}
            >
              {pages.map((kind, index) => (
                <View
                  key={kind}
                  style={[
                    styles.page,
                    kind === 'photo' && styles.pagePhoto,
                    { width: trackW, height: Math.max(96, trackW / 0.8) },
                  ]}
                  accessibilityElementsHidden={multi && page !== index}
                  importantForAccessibility={!multi || page === index ? 'yes' : 'no-hide-descendants'}
                >
                  {kind === 'cutOut' && garment.cutOut ? (
                    <Image
                      source={{ uri: garment.cutOut }}
                      style={styles.pic}
                      accessibilityLabel={t.theCutOut}
                      accessibilityIgnoresInvertColors
                    />
                  ) : null}
                  {kind === 'photo' && photoUri ? (
                    <>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.pic}
                        accessibilityLabel={t.yourPhotograph}
                        accessibilityIgnoresInvertColors
                      />
                      <PhotoMark style={styles.markPad} />
                    </>
                  ) : null}
                  {kind === 'empty' ? <View style={styles.picEmpty} testID="editor-pic-empty" /> : null}
                </View>
              ))}
            </ScrollView>
          ) : null}
          {multi ? (
            <View style={styles.dots} accessibilityRole="tablist" accessibilityLabel={t.photo}>
              {pages.map((kind, index) => (
                <Pressable
                  key={kind}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: page === index }}
                  accessibilityLabel={kind === 'cutOut' ? t.theCutOut : t.yourPhotograph}
                  onPress={() => goPage(index)}
                  hitSlop={reach(24)}
                  style={styles.dotHit}
                >
                  <View style={[styles.dot, page === index && styles.dotOn]} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loaded.state === 'loading' && <FormSkeleton />}
        {loaded.state === 'failed' && <Notice text={capture.closetUnreadable} action={capture.tryAgain} onPress={retry} />}
        {loaded.state === 'ready' && !garment && <Text style={formStyles.note}>{capture.notInCloset}</Text>}
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
  /* Fig 19 .drawer-body: 20 sides and top, 8 bottom under the fields. */
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  /* Fig 19 .drawer > .render: full width, aspect .8, shrinks to 96 so fields stay in view. */
  pics: {
    width: '100%',
    aspectRatio: 0.8,
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 96,
    backgroundColor: light.renderA,
    overflow: 'hidden',
  },
  track: { ...StyleSheet.absoluteFill },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    experimental_backgroundImage: `linear-gradient(178deg, ${light.renderA}, ${light.renderB})`,
  },
  pagePhoto: {
    experimental_backgroundImage: `linear-gradient(155deg, ${light.photoGround} 0%, ${light.photoShade} 100%)`,
  },
  pic: { width: '72%', height: '78%', resizeMode: 'contain' },
  picEmpty: { width: '72%', height: '78%', backgroundColor: light.field },
  markPad: { bottom: 16, left: 16 },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
    zIndex: 3,
  },
  dotHit: { width: 16, height: 24, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: light.ink, opacity: 0.2 },
  dotOn: { opacity: 0.7 },
  worn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 16, marginHorizontal: 4 },
  wornText: { flexShrink: 1, fontFamily: font.regular, fontSize: 12, lineHeight: 12, color: light.muted },
  wornCount: { fontFamily: font.medium, color: light.ink, fontVariant: ['tabular-nums'] },
  wearNotice: { marginBottom: 16 },
});
