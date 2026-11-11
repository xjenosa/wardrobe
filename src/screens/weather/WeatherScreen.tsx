import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Notice } from '../../kit/Notice';
import { TopBar } from '../../kit/TopBar';
import { drawn } from '../../strings/drawn';
import { weather } from '../../strings/weather';
import { font } from '../../theme/font';
import { light } from '../../theme/tokens';

const words = drawn.fig14D;
const details = [words.hoursCovered, words.uvIndex, words.wind, words.humidity];
const part = (now: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-CA', options).format(now);

type Props = { now?: Date; place?: string; onRetry?: () => void };

/* Fig 14d is built first so a missing forecast remains a usable screen.
   Until forecast fetching exists, retry returns to the Today stub. */
export function WeatherScreen({ now = new Date(), place, onRetry }: Props = {}) {
  const navigation = useNavigation();
  const goBack = () => navigation.goBack();
  const date = [part(now, { weekday: 'long' }), part(now, { day: 'numeric' }), part(now, { month: 'long' })].join(' ');

  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      <TopBar title={words.weather} onBack={goBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Notice text={words.couldNotReachTheForecast} action={words.tryAgain} onPress={onRetry ?? goBack} style={styles.notice} />
        <View style={styles.head}>
          {place ? <Text style={styles.place}>{place}</Text> : null}
          <Text style={styles.day}>{date}</Text>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.temperature}>{weather.emptyLine}</Text>
            <Text style={styles.feels}>{weather.emptyLine}</Text>
            <Text style={styles.ends}>{weather.emptyLine}</Text>
          </View>
        </View>
        <View style={styles.blank}>
          <Text style={styles.emptyText}>{words.noPickWithoutAForecast}</Text>
        </View>
        <View style={styles.rows}>
          {details.map((label, index) => (
            <View key={label} style={[styles.row, index === details.length - 1 && styles.lastRow]}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{words.s}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper },
  body: { flexGrow: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 24 },
  notice: { marginBottom: 20 },
  head: { alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
  place: { fontFamily: font.semibold, fontSize: 11, lineHeight: 11, letterSpacing: 1.98, textTransform: 'uppercase', color: light.muted },
  day: { fontFamily: font.medium, fontSize: 15, lineHeight: 15, color: light.ink },
  temperature: { fontFamily: font.regular, fontSize: 72, lineHeight: 72 },
  feels: { fontFamily: font.regular, fontSize: 13, lineHeight: 13 },
  ends: { fontFamily: font.regular, fontSize: 13, lineHeight: 13, marginTop: 8 },
  blank: { minHeight: 114, marginTop: 12, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: light.field, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, textAlign: 'center', color: light.muted },
  rows: { marginTop: 24 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: light.hairline },
  lastRow: { borderBottomWidth: 0 },
  label: { flexShrink: 1, fontFamily: font.regular, fontSize: 13, lineHeight: 13, color: light.muted },
  value: { fontFamily: font.medium, fontSize: 15, lineHeight: 15, color: light.ink, fontVariant: ['tabular-nums'] },
});
