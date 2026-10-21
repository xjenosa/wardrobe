import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../nav/routes';
import { loadCloset, updateCloset, type Garment, type LoadFailure } from '../../lib/store';
import { capture } from '../../strings/capture';
import { drawn } from '../../strings/drawn';
import { screens } from '../../strings/screens';
import {
  FormButton,
  FormSkeleton,
  formStyles,
  garmentOf,
  GarmentForm,
  sameValues,
  valuesOf,
  type FormValues,
} from '../add/GarmentForm';

const t = drawn.fig19;

/* AN EDIT IS HELD, NOT GUARDED (docs/States.md). Leaving with unsaved changes
   keeps them for the next time this garment is opened, until it is saved. They
   live as long as the app does. */
const held = new Map<string, FormValues>();

type Loaded =
  | { state: 'loading' }
  | { state: 'failed'; failure: LoadFailure }
  | { state: 'ready'; garment: Garment | undefined };

/* Fig 19, page one's fields. The cut-out and the photograph (Fig 19b) wait
   for the garment to carry a picture. */
export function ItemEditorScreen() {
  const navigation = useNavigation();
  const { id } = useRoute<RouteProp<RootStackParamList, 'ItemEditor'>>().params;
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' });
  const [values, setValues] = useState<FormValues | undefined>();
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<FormValues | undefined>();
  const latest = useRef<{ values?: FormValues; original?: FormValues; saved: boolean }>({ saved: false });

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof loadCloset>>) => {
      if (!result.ok) return setLoaded({ state: 'failed', failure: result.failure });
      const garment = result.garments.find((g) => g.id === id);
      const now = garment && valuesOf(garment);
      latest.current.original = now;
      setOriginal(now);
      setValues(garment && (held.get(id) ?? now));
      setLoaded({ state: 'ready', garment });
    },
    [id],
  );

  useEffect(() => {
    let live = true;
    loadCloset().then((result) => live && apply(result));
    return () => {
      live = false;
    };
  }, [apply]);

  useEffect(() => {
    latest.current.values = values;
  }, [values]);

  /* Whatever way the editor goes away, an unsaved change is kept. */
  useEffect(() => {
    const ref = latest.current;
    return () => {
      const { values: v, original, saved } = ref;
      if (!saved && v && original && !sameValues(v, original)) held.set(id, v);
    };
  }, [id]);

  const retry = () => {
    setLoaded({ state: 'loading' });
    loadCloset().then(apply);
  };

  const garment = loaded.state === 'ready' ? loaded.garment : undefined;
  const dirty = !!values && !!original && !sameValues(values, original);
  const edited = values && garmentOf(id, values);

  async function save() {
    if (!edited || saving) return;
    setSaving(true);
    setFailed(false);
    const result = await updateCloset((garments) => garments.map((g) => (g.id === id ? edited : g)));
    if (result.ok) {
      latest.current.saved = true;
      held.delete(id);
      navigation.goBack();
    } else {
      setSaving(false);
      setFailed(true);
    }
  }

  return (
    <SafeAreaView style={formStyles.page}>
      <View style={formStyles.topbar}>
        <Text accessibilityRole="header" style={formStyles.title}>
          {garment ? garment.name : screens.itemEditor}
        </Text>
      </View>
      <ScrollView contentContainerStyle={formStyles.body} keyboardShouldPersistTaps="handled">
        {loaded.state === 'loading' && <FormSkeleton />}
        {loaded.state === 'failed' && (
          <>
            <Text accessibilityRole="alert" style={formStyles.note}>
              {capture.closetUnreadable}
            </Text>
            <FormButton label={capture.tryAgain} onPress={retry} />
          </>
        )}
        {loaded.state === 'ready' && !garment && <Text style={formStyles.note}>{capture.notInCloset}</Text>}
        {garment && values && <GarmentForm values={values} onChange={setValues} />}
        {failed && (
          <Text accessibilityRole="alert" style={formStyles.problem}>
            {capture.saveFailed}
          </Text>
        )}
      </ScrollView>
      <View style={formStyles.foot}>
        <FormButton label={t.close} onPress={() => navigation.goBack()} />
        {garment && <FormButton label={t.save} primary disabled={!dirty || !edited || saving} onPress={save} />}
      </View>
    </SafeAreaView>
  );
}
