import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { updateCloset } from '../../lib/store';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { emptyValues, FormButton, FormFrame, formStyles, garmentOf, GarmentForm, type FormValues } from './GarmentForm';

const t = drawn.fig18;

const newId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* Fig 18 filled in by hand: where "Reading failed" ends up (docs/States.md),
   and the whole screen until the camera and the tagging exist. A failed save
   keeps every field. */
export function AddGarmentScreen() {
  const navigation = useNavigation();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [id] = useState(newId);
  const pressed = useRef(false);
  const garment = garmentOf(id, values);

  async function save() {
    if (!garment || pressed.current) return;
    pressed.current = true;
    setSaving(true);
    setFailed(false);
    const result = await updateCloset((garments) => (garments.some((g) => g.id === garment.id) ? garments : [...garments, garment]));
    if (result.ok) {
      navigation.goBack();
    } else {
      pressed.current = false;
      setSaving(false);
      setFailed(true);
    }
  }

  return (
    <FormFrame fullScreen>
      <View style={formStyles.topbar}>
        <Text accessibilityRole="header" style={formStyles.title}>
          {t.newGarment}
        </Text>
      </View>
      <ScrollView contentContainerStyle={formStyles.body} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.note}>{capture.byHand}</Text>
        <GarmentForm values={values} onChange={setValues} />
        {failed && (
          <Text accessibilityRole="alert" style={formStyles.problem}>
            {capture.saveFailed}
          </Text>
        )}
      </ScrollView>
      <View style={formStyles.foot}>
        <FormButton label={t.cancel} onPress={() => navigation.goBack()} />
        <FormButton label={t.saveToCloset} primary disabled={!garment || saving} onPress={save} />
      </View>
    </FormFrame>
  );
}
