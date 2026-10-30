import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Button, Notice, TopBar } from '../../kit';
import { reach } from '../../kit/reach';
import { keepGarmentPhoto } from '../../lib/garmentPhoto';
import { updateCloset } from '../../lib/store';
import { tag, type TagResponse } from '../../lib/tag';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { font } from '../../theme/font';
import { Check, Flash, Picture, Sparkle } from '../../theme/icons';
import { light } from '../../theme/tokens';
import { emptyValues, FormFrame, formStyles, garmentOf, GarmentForm, type FormValues } from './GarmentForm';

const cam = drawn.fig17;
const reading = drawn.fig17B;
const t = drawn.fig18;

const newId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

type Step =
  | { kind: 'capture' }
  | { kind: 'reading'; photo: string }
  | { kind: 'failed'; photo: string }
  | { kind: 'confirm'; photo?: string; tagged?: boolean };

/* FIGS 17, 17b AND 18. Capture opens first. The shutter (or Upload) keeps the
   photograph and starts tagging in the same moment (Acceptance.md). Reading
   shows that photograph until the tag answers; failure keeps it and offers
   retry or by hand. Confirm is Fig 18, with or without a photo (ADR 0028). */
export function AddGarmentScreen() {
  const navigation = useNavigation();
  const [id] = useState(newId);
  const [step, setStep] = useState<Step>({ kind: 'capture' });
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [flash, setFlash] = useState(false);
  const [askProblem, setAskProblem] = useState<'refused' | 'failed' | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const pressed = useRef(false);
  const tagGen = useRef(0);
  const garment = garmentOf(id, values);
  const photo = step.kind === 'capture' ? undefined : step.photo;

  useEffect(() => {
    if (step.kind !== 'reading') return;
    const gen = ++tagGen.current;
    let live = true;
    tag(step.photo).then((result) => {
      if (!live || gen !== tagGen.current) return;
      if (result.ok) {
        setValues(valuesFromTag(result.response));
        setStep({ kind: 'confirm', photo: step.photo, tagged: true });
      } else {
        setStep({ kind: 'failed', photo: step.photo });
      }
    });
    return () => {
      live = false;
    };
  }, [step]);

  async function take(from: 'camera' | 'library') {
    setAskProblem(null);
    try {
      if (from === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        setAskProblem('refused');
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
      const result =
        from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;
      const kept = await keepGarmentPhoto(id, asset.uri);
      if (!kept.ok) {
        setAskProblem('failed');
        return;
      }
      /* Tagging starts when the shutter fires, not when confirm opens. */
      setStep({ kind: 'reading', photo: kept.uri });
    } catch {
      setAskProblem('failed');
    }
  }

  function fillByHand(keptPhoto?: string) {
    setValues(emptyValues);
    setStep({ kind: 'confirm', photo: keptPhoto, tagged: false });
  }

  async function save() {
    if (!garment || pressed.current) return;
    pressed.current = true;
    setSaving(true);
    setSaveFailed(false);
    const withPhoto = photo ? { ...garment, photo } : garment;
    const result = await updateCloset((garments) => (garments.some((g) => g.id === withPhoto.id) ? garments : [...garments, withPhoto]));
    if (result.ok) {
      navigation.goBack();
    } else {
      pressed.current = false;
      setSaving(false);
      setSaveFailed(true);
    }
  }

  if (step.kind === 'capture') {
    return (
      <FormFrame fullScreen>
        <TopBar title={cam.newGarment} onBack={() => navigation.goBack()} way="close" />
        <View style={styles.stage}>
          <View style={styles.viewfinder} accessibilityLabel={cam.capture}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          {askProblem === 'refused' ? (
            <Notice
              text={capture.cameraRefused}
              action={capture.openSettings}
              onPress={() => Linking.openSettings()}
              style={styles.notice}
            />
          ) : askProblem === 'failed' ? (
            <Notice text={capture.photoFailed} action={capture.tryAgain} onPress={() => take('camera')} style={styles.notice} />
          ) : null}
          <View style={styles.controls}>
            <Pressable accessibilityRole="button" accessibilityLabel={cam.upload} onPress={() => take('library')} style={styles.side}>
              <Picture color={light.muted} size={22} />
              <Text style={styles.sideLabel}>{cam.upload}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cam.capture}
              onPress={() => take('camera')}
              style={styles.shutter}
              hitSlop={reach(66)}
            >
              <View style={styles.shutterRing}>
                <View style={styles.shutterInner} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cam.flash}
              accessibilityState={{ selected: flash }}
              onPress={() => setFlash((on) => !on)}
              style={styles.side}
            >
              <Flash color={flash ? light.ink : light.muted} size={19} />
              <Text style={[styles.sideLabel, flash && styles.sideOn]}>{cam.flash}</Text>
            </Pressable>
          </View>
        </View>
      </FormFrame>
    );
  }

  if (step.kind === 'reading') {
    return (
      <FormFrame fullScreen>
        <TopBar title={reading.newGarment} onBack={() => navigation.goBack()} way="close" />
        <View style={styles.stage}>
          <View style={[styles.viewfinder, styles.shot]} accessibilityState={{ busy: true }}>
            <Image source={{ uri: step.photo }} style={styles.photo} accessibilityLabel={reading.readingTheGarment} />
          </View>
          <Text style={styles.hint}>{reading.readingTheGarment}</Text>
        </View>
      </FormFrame>
    );
  }

  if (step.kind === 'failed') {
    return (
      <FormFrame fullScreen>
        <TopBar title={cam.newGarment} onBack={() => navigation.goBack()} way="close" />
        <View style={styles.stage}>
          <View style={[styles.viewfinder, styles.shot]}>
            <Image source={{ uri: step.photo }} style={styles.photo} accessibilityLabel={capture.taggingFailed} />
          </View>
          <Notice
            text={capture.taggingFailed}
            action={capture.tryAgain}
            onPress={() => setStep({ kind: 'reading', photo: step.photo })}
            style={styles.notice}
          />
          <Pressable accessibilityRole="button" onPress={() => fillByHand(step.photo)} hitSlop={reach(44)} style={styles.byHand}>
            <Text style={styles.byHandText}>{capture.fillByHand}</Text>
          </Pressable>
        </View>
      </FormFrame>
    );
  }

  return (
    <FormFrame fullScreen>
      <TopBar title={t.newGarment} onBack={() => setStep({ kind: 'capture' })} />
      <ScrollView contentContainerStyle={styles.confirmBody} keyboardShouldPersistTaps="handled">
        {step.photo ? (
          <View style={styles.cut}>
            {step.tagged ? (
              <View style={styles.donePill} accessibilityLabel={t.cutOut}>
                <Check color={light.muted} size={12} strokeWidth={2} />
                <Text style={styles.donePillText}>{t.cutOut}</Text>
              </View>
            ) : null}
            <Image source={{ uri: step.photo }} style={styles.cutPhoto} />
          </View>
        ) : null}
        {step.tagged ? (
          <View style={styles.aiNote}>
            <Sparkle color={light.muted} size={14} />
            <Text style={styles.aiNoteText}>{t.taggedByAiFromYour}</Text>
          </View>
        ) : (
          <Text style={styles.byHandNote}>{capture.byHand}</Text>
        )}
        <GarmentForm values={values} onChange={setValues} />
        {saveFailed && (
          <Text accessibilityRole="alert" style={formStyles.problem}>
            {capture.saveFailed}
          </Text>
        )}
      </ScrollView>
      <View style={formStyles.foot}>
        <Button size="small" kind="outline" label={t.cancel} onPress={() => navigation.goBack()} />
        <Button size="small" label={t.saveToCloset} icon={Check} wide disabled={!garment || saving} onPress={save} />
      </View>
    </FormFrame>
  );
}

function valuesFromTag(response: TagResponse): FormValues {
  return {
    name: response.name,
    category: response.category,
    warmth: response.warmth,
    style: response.style,
  };
}

const styles = StyleSheet.create({
  /* Fig 17 / 17b .capture-stage: 20 top, 24 sides, 126 foot for controls or the reading hint. */
  stage: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  viewfinder: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: `linear-gradient(176deg, ${light.renderA}, ${light.renderB})`,
  },
  shot: {
    experimental_backgroundImage: `linear-gradient(155deg, ${light.photoGround} 0%, ${light.photoShade} 100%)`,
  },
  photo: { width: '100%', height: '100%', resizeMode: 'contain' },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: light.ink, opacity: 0.5 },
  tl: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
  controls: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  side: { width: 78, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
  sideLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 1.21,
    textTransform: 'uppercase',
    color: light.muted,
  },
  sideOn: { color: light.ink },
  /* .cap-shutter: 66 hit, 58 ink disc, paper then ink ring outside (shutter-ring). */
  shutter: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  shutterRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: light.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.paper,
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: light.ink },
  hint: {
    height: 126,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18.2,
    color: light.muted,
    margin: 0,
    paddingHorizontal: 8,
    paddingTop: 54,
  },
  notice: { marginTop: 16 },
  byHand: { alignSelf: 'center', padding: 12 },
  byHandText: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16.8,
    color: light.ink,
    textDecorationLine: 'underline',
    textDecorationColor: light.edge,
  },
  /* Fig 18 .body under the top bar: 12/24/24, confirm-cut first child sits 8 down. */
  confirmBody: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  cut: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
    height: 300,
    aspectRatio: 0.8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: `linear-gradient(176deg, ${light.renderA}, ${light.renderB})`,
  },
  cutPhoto: { width: '100%', height: '84%', resizeMode: 'contain' },
  donePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.hairline,
  },
  donePillText: {
    fontFamily: font.semibold,
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 0.66,
    color: light.ink,
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 16,
  },
  aiNoteText: { flexShrink: 1, fontFamily: font.regular, fontSize: 12, lineHeight: 16.8, color: light.muted },
  byHandNote: {
    marginHorizontal: 4,
    marginTop: -8,
    marginBottom: 16,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16.8,
    color: light.ink,
    textDecorationLine: 'underline',
    textDecorationColor: light.edge,
  },
});
