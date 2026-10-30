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
import { Check, Flash, Picture } from '../../theme/icons';
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
              <Picture color={light.ink} size={22} />
              <Text style={styles.sideLabel}>{cam.upload}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cam.capture}
              onPress={() => take('camera')}
              style={styles.shutter}
              hitSlop={reach(72)}
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cam.flash}
              accessibilityState={{ selected: flash }}
              onPress={() => setFlash((on) => !on)}
              style={styles.side}
            >
              <Flash color={flash ? light.ink : light.muted} size={19} />
              <Text style={[styles.sideLabel, !flash && styles.sideOff]}>{cam.flash}</Text>
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
      <ScrollView contentContainerStyle={formStyles.body} keyboardShouldPersistTaps="handled">
        {step.photo ? (
          <View style={styles.cut}>
            <Image source={{ uri: step.photo }} style={styles.cutPhoto} />
            {step.tagged ? (
              <Text style={styles.aiNote}>{t.taggedByAiFromYour}</Text>
            ) : (
              <Text style={formStyles.note}>{capture.byHand}</Text>
            )}
          </View>
        ) : (
          <Text style={formStyles.note}>{capture.byHand}</Text>
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
  stage: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  viewfinder: {
    flex: 1,
    backgroundColor: light.renderA,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shot: { backgroundColor: light.renderB },
  photo: { width: '100%', height: '100%', resizeMode: 'contain' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: light.ink },
  tl: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
  controls: { height: 126, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 72, alignItems: 'center', gap: 6 },
  sideLabel: { fontFamily: font.medium, fontSize: 11, color: light.ink },
  sideOff: { color: light.muted },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: light.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.paper,
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: light.ink },
  hint: {
    height: 126,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18.2,
    color: light.muted,
    paddingTop: 48,
  },
  notice: { marginTop: 16 },
  byHand: { alignSelf: 'center', padding: 12 },
  byHandText: { fontFamily: font.medium, fontSize: 13, color: light.muted, textDecorationLine: 'underline' },
  cut: { alignItems: 'center', marginBottom: 8 },
  cutPhoto: { width: 180, height: 225, resizeMode: 'contain', backgroundColor: light.renderA },
  aiNote: { marginTop: 8, marginBottom: 16, fontFamily: font.regular, fontSize: 12, color: light.muted },
});
