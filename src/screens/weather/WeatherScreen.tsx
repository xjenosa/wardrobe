
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { light } from '../../theme/tokens';
import { font } from '../../theme/font';
import { drawn } from '../../strings/drawn';

const words = drawn.fig14D;

export function WeatherScreen() {
  const navigation = useNavigation();

  const details = [
    words.hoursCovered,
    words.uvIndex,
    words.wind,
    words.humidity,
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={words.back}
        >
          <Text style={styles.back}>
            {words.back}
          </Text>
        </Pressable>

        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
        >
          {words.weather}
        </Text>
      </View>

      {/* Forecast unavailable */}
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>
          {words.couldNotReachTheForecast}
        </Text>

        <Pressable
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel={words.tryAgain}
        >
          <Text style={styles.retry}>
            {words.tryAgain.toUpperCase()}
          </Text>
        </Pressable>
      </View>

      {/* Location and date */}
      <View style={styles.location}>
        <Text style={styles.city}>
          {words.torontoCa.toUpperCase()}
        </Text>

        <Text style={styles.date}>
          {words.thursday8January}
        </Text>
      </View>

      {/* Empty forecast */}
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          {words.noPickWithoutAForecast}
        </Text>
      </View>

      {/* Weather details */}
      {details.map((item) => (
        <View key={item} style={styles.row}>
          <Text style={styles.label}>
            {item}
          </Text>

          <Text style={styles.value}>
            {words.s}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.paper,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: light.hairline,
    marginBottom: 16,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },

  back: {
    fontFamily: font.regular,
    fontSize: 24,
    color: light.ink,
  },

  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: light.ink,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: light.field,
    padding: 12,
  },

  errorText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: light.ink,
    flex: 1,
  },

  retry: {
    fontFamily: font.semibold,
    fontSize: 10,
    color: light.ink,
    letterSpacing: 1,
    marginLeft: 12,
  },

  location: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 125,
  },

  city: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 2,
    color: light.muted,
  },

  date: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: light.ink,
  },

  emptyBox: {
    height: 85,
    backgroundColor: light.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: light.muted,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: light.hairline,
  },

  label: {
    fontFamily: font.regular,
    fontSize: 11,
    color: light.muted,
  },

  value: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: light.ink,
  },
});
