import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Notice, TopBar } from '../../kit';
import { reach } from '../../kit/reach';
import { keepGarmentPhoto, loadGarmentPhoto, removeGarmentPhoto } from '../../lib/garmentPhoto';
import { updateCloset } from '../../lib/store';
import { hasTagService, tag, type TagResponse } from '../../lib/tag';
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

/* FIGS 17, 17b AND 18. Capture opens first with a live CameraView (ADR 0028).
   The shutter keeps the photograph; with a tagging address it starts the tag
   in the same moment, otherwise confirm opens by hand with the photo kept.
   Failure keeps the photograph. Confirm is Fig 18. Every way out but Save
   removes an unsaved photograph from the documents folder. */
export function AddGarmentScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [id] = useState(newId);
  const [step, setStep] = useState<Step>({ kind: 'capture' });
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [flash, setFlash] = useState(false);
  const [askProblem, setAskProblem] = useState<'refused' | 'failed' | null>(null);
  const [lastAsk, setLastAsk] = useState<'camera' | 'library'>('camera');
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const pressed = useRef(false);
  const tagGen = useRef(0);
  const garment = garmentOf(id, values);
  const photo = step.kind === 'capture' ? undefined : step.photo;
  const loaded = photo ? loadGarmentPhoto(id) : null;
  const photoUri = loaded && loaded.ok ? loaded.uri : null;

  useEffect(() => {
    return () => {
      if (!saved) removeGarmentPhoto(id);
    };
  }, [id, saved]);

  useEffect(() => {
    if (step.kind !== 'confirm') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      leaveConfirm();
      return true;
    });
    return () => sub.remove();
  });

  function discardPhoto() {
    removeGarmentPhoto(id);
  }

  function leaveAdd() {
    discardPhoto();
    navigation.goBack();
  }

  function leaveConfirm() {
    setValues(emptyValues);
    setSaveFailed(false);
    setStep({ kind: 'capture' });
  }

  function startTag(name: string) {
    const gen = ++tagGen.current;
    const found = loadGarmentPhoto(id);
    const uri = found.ok ? found.uri : null;
    if (!uri) {
      setStep({ kind: 'failed', photo: name });
      return;
    }
    setStep({ kind: 'reading', photo: name });
    tag(uri).then((result) => {
      if (gen !== tagGen.current) return;
      if (result.ok) {
        setValues(valuesFromTag(result.response));
        setStep({ kind: 'confirm', photo: name, tagged: true });
      } else {
        setStep({ kind: 'failed', photo: name });
      }
    });
  }

  async function keepFrom(uri: string) {
    const kept = await keepGarmentPhoto(id, uri);
    if (!kept.ok) {
      setAskProblem('failed');
      return;
    }
    if (!hasTagService()) {
      setValues(emptyValues);
      setStep({ kind: 'confirm', photo: kept.name, tagged: false });
      return;
    }
    startTag(kept.name);
  }

  async function take(from: 'camera' | 'library') {
    setAskProblem(null);
    setLastAsk(from);
    try {
      if (from === 'library') {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
        const asset = result.canceled ? undefined : result.assets[0];
        if (!asset) return;
        await keepFrom(asset.uri);
        return;
      }
      if (!permission?.granted) {
        const next = await requestPermission();
        if (!next.granted) {
          setAskProblem('refused');
          return;
        }
      }
      const shot = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (!shot?.uri) return;
      await keepFrom(shot.uri);
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
      setSaved(true);
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
        <TopBar title={cam.newGarment} onBack={leaveAdd} way="close" />
        <View style={styles.stage}>
          <View style={styles.viewfinder} accessibilityLabel={capture.viewfinder}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash ? 'on' : 'off'} />
            ) : (
              <>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </>
            )}
          </View>
          {askProblem === 'refused' ? (
            <Notice
              text={capture.cameraRefused}
              action={capture.openSettings}
              onPress={() => Linking.openSettings()}
              style={styles.notice}
            />
          ) : askProblem === 'failed' ? (
            <>
              <Notice text={capture.photoFailed} action={capture.tryAgain} onPress={() => take(lastAsk)} style={styles.notice} />
              <Pressable accessibilityRole="button" onPress={() => fillByHand()} hitSlop={reach(44)} style={styles.byHand}>
                <Text style={styles.byHandText}>{capture.fillByHand}</Text>
              </Pressable>
            </>
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
              <Text style={[styles.sideLabel, flash ? null : styles.sideOff]}>{cam.flash}</Text>
            </Pressable>
          </View>
        </View>
      </FormFrame>
    );
  }

  if (step.kind === 'reading') {
    return (
      <FormFrame fullScreen>
        <TopBar title={reading.newGarment} onBack={leaveAdd} way="close" />
        <View style={styles.stage}>
          <View style={[styles.viewfinder, styles.shot]} accessibilityState={{ busy: true }}>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={capture.photographReading} /> : null}
          </View>
          <Text style={styles.hint}>{reading.readingTheGarment}</Text>
        </View>
      </FormFrame>
    );
  }

  if (step.kind === 'failed') {
    return (
      <FormFrame fullScreen>
        <TopBar title={cam.newGarment} onBack={leaveAdd} way="close" />
        <View style={styles.stage}>
          <View style={[styles.viewfinder, styles.shot]}>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={capture.photographFailed} /> : null}
          </View>
          <Notice
            text={capture.taggingFailed}
            action={capture.tryAgain}
            onPress={() => startTag(step.photo)}
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
      <TopBar title={t.newGarment} onBack={leaveConfirm} />
      <ScrollView contentContainerStyle={styles.confirmBody} keyboardShouldPersistTaps="handled">
        {step.photo && photoUri ? (
          <View style={[styles.cut, styles.cutPhotoGround]}>
            <Image source={{ uri: photoUri }} style={styles.cutPhoto} accessibilityLabel={capture.photographConfirm} />
          </View>
        ) : null}
        {step.tagged ? (
          <Text style={styles.aiNote}>{t.taggedByAiFromYour}</Text>
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
        <Button
          size="small"
          kind="outline"
          label={t.cancel}
          onPress={() => {
            discardPhoto();
            navigation.goBack();
          }}
        />
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
  sideOff: { color: light.muted },
  shutter: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: light.ink,
    borderWidth: 6,
    borderColor: light.paper,
  },
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
  /* Fig 18 .body under the top bar: 12/24/24. Confirm cut sits on the photograph's ground, no Cut out badge. */
  confirmBody: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  cut: {
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 8,
    height: 300,
    aspectRatio: 0.8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutPhotoGround: {
    experimental_backgroundImage: `linear-gradient(155deg, ${light.photoGround} 0%, ${light.photoShade} 100%)`,
  },
  cutPhoto: { width: '100%', height: '84%', resizeMode: 'contain' },
  aiNote: {
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 16,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16.8,
    color: light.muted,
  },
  byHandNote: {
    marginHorizontal: 4,
    marginBottom: 16,
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18.2,
    color: light.muted,
  },
});
