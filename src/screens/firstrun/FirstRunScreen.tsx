import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Notice } from '../../kit';
import { reach } from '../../kit/reach';
import { pickReference, type Asked } from '../../lib/reference';
import { drawn } from '../../strings/drawn';
import { frame } from '../../strings/frame';
import { font } from '../../theme/font';
import { light } from '../../theme/tokens';

const t = drawn.fig05;

/* FIG 05, ONE PHOTOGRAPH OF YOU, so a render has somebody to dress. It asks
   once, says what the photo is for, and can be skipped; skipping blocks
   nothing, and with no screen behind it, it leads to the closet.

   IT COVERS THE WHOLE PHONE, so it makes room for the status bar itself, from
   the insets, in exactly one place. A full-screen modal's SafeAreaView left
   the top unpadded on iOS and pads it on Android, where the modal opens as an
   ordinary screen, so the two together would pad Android twice (#4). */
export function FirstRunScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [asking, setAsking] = useState(false);
  const [problem, setProblem] = useState<Exclude<Asked, 'kept' | 'cancelled'> | null>(null);
  const last = useRef<'camera' | 'library'>('camera');

  const leave = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs', { screen: 'Closet' }));

  async function ask(from: 'camera' | 'library') {
    last.current = from;
    setAsking(true);
    setProblem(null);
    const asked = await pickReference(from);
    setAsking(false);
    if (asked === 'kept') leave();
    else if (asked !== 'cancelled') setProblem(asked);
  }

  return (
    <View
      style={[
        styles.page,
        { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.entry}>
          <View style={styles.mark} />
          <View style={styles.fill}>
            <Text accessibilityRole="header" style={styles.title}>
              {t.aPhotoOfYou}
            </Text>
            <Text style={styles.lede}>{t.fullLengthPlainBackgroundFacing}</Text>
            <View style={styles.disclose}>
              <Text style={styles.discloseText}>{t.itIsSentToThe}</Text>
            </View>
            {problem === 'refused' ? (
              <Notice text={frame.cameraRefused} action={frame.openSettings} onPress={() => Linking.openSettings()} style={styles.notice} />
            ) : problem === 'failed' ? (
              <Notice text={frame.photoNotKept} action={drawn.fig11.tryAgain} onPress={() => ask(last.current)} style={styles.notice} />
            ) : null}
            <View style={styles.actions}>
              <Button label={t.takeAPhoto} onPress={() => ask('camera')} disabled={asking} />
              <Button kind="outline" label={t.chooseAPhoto} onPress={() => ask('library')} disabled={asking} />
            </View>
            <Pressable accessibilityRole="button" onPress={leave} hitSlop={reach(SKIP)} style={styles.skip}>
              {({ pressed }) => <Text style={[styles.skipText, pressed && styles.pressed]}>{t.skipForNow}</Text>}
            </Pressable>
            <Text style={styles.fine}>{t.withoutItOutfitsAreShown}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* A ch is the width of the typeface's zero, which in Inter is 0.631 of an em,
   so the plate's 26ch at 16 and 30ch at 12 are these. */
const ch = (n: number, size: number) => n * size * 0.631;
/* .restore is 13 tall with 8 above and below */
const SKIP = 13 + 2 * 8;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper },
  body: { flexGrow: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 24 },
  entry: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 8, paddingBottom: 20 },
  mark: { width: 52, height: 52, marginTop: 72 },
  fill: { flexGrow: 1, width: '100%', maxWidth: 340, alignItems: 'center', paddingTop: 52 },
  title: { fontFamily: font.semibold, fontSize: 28, lineHeight: 33.6, letterSpacing: -0.616, textAlign: 'center', color: light.ink },
  lede: {
    marginTop: 12,
    maxWidth: ch(26, 16),
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22.4,
    textAlign: 'center',
    color: light.muted,
  },
  disclose: {
    alignSelf: 'stretch',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: light.edge,
    backgroundColor: light.field,
  },
  discloseText: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, color: light.ink },
  notice: { alignSelf: 'stretch', marginTop: 20 },
  actions: { alignSelf: 'stretch', marginTop: 32, gap: 12 },
  skip: { marginTop: 12, padding: 8 },
  skipText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: light.muted,
    textDecorationLine: 'underline',
    textDecorationColor: light.hairline,
  },
  pressed: { color: light.ink },
  fine: {
    marginTop: 16,
    maxWidth: ch(30, 12),
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16.8,
    textAlign: 'center',
    color: light.muted,
  },
});
