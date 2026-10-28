import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vibes, type Vibe } from '../../lib/words';
import { drawn } from '../../strings/drawn';
import { light } from '../../theme/tokens';

/* THE PARTS EVERY TODAY PLATE SHARES (Figs 08 to 12): the head, the hero, the
   vibe, the actions and "Why this", in that order and in the same places, so a
   state changes what is in the boxes and never where the boxes are. */

const t = drawn.fig08;

/* The plate's date line is "Thu 8 Jan" over "Thursday". Built from parts so
   the order is the plate's whatever order the locale would choose. */
const part = (now: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-CA', o).format(now);
export const weekdayOf = (now: Date) => part(now, { weekday: 'long' });
const dateOf = (now: Date) =>
  [part(now, { weekday: 'short' }), part(now, { day: 'numeric' }), part(now, { month: 'short' })].join(' ');

/* The page scrolls, as the plate's does: on a small phone or at a large text
   size the boxes outgrow the space above the tab bar. flexGrow lets the hero
   still take what a tall phone has spare. */
export function TodayPage({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
    </SafeAreaView>
  );
}

/* The place is the forecast's, so with no place known the line is the date
   alone rather than a place that might be wrong. */
export function TodayHead({ now, place, children }: { now: Date; place?: string; children: ReactNode }) {
  const date = dateOf(now);
  return (
    <View>
      <Text style={styles.eyebrow}>{place ? [place, date].join(' · ') : date}</Text>
      <Text accessibilityRole="header" style={styles.display}>
        {weekdayOf(now)}
      </Text>
      <View style={styles.rule} />
      <View style={styles.wx}>{children}</View>
      <View style={styles.whisper} />
    </View>
  );
}

/* A line in the weather's box that says something went wrong, with the one
   thing to do about it. */
export function Notice({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.notice}>
      <Text accessibilityRole="alert" style={styles.noticeText}>
        {text}
      </Text>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.noticeAction}>
        <Text style={styles.noticeActionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

/* Square, as tall as the page leaves it and never under 190pt, which is the
   plate's rule for a phone of any height. */
export function Hero({ children }: { children: ReactNode }) {
  return <View style={styles.hero}>{children}</View>;
}

export function HeroSay({ text }: { text: string }) {
  return <Text style={styles.heroSay}>{text}</Text>;
}

export function VibeRow({ vibe, disabled }: { vibe: Vibe; disabled: boolean }) {
  return (
    <View style={styles.vibeRow}>
      <Text style={styles.label}>{t.vibe}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={t.vibe} style={styles.vibe}>
        {vibes.map((v) => {
          const on = v === vibe;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled }}
              disabled={disabled}
              style={[styles.seg, on && (disabled ? styles.ringed : styles.segOn)]}
            >
              <Text style={[styles.segText, on && !disabled && styles.segTextOn, disabled && styles.off]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Actions({ disabled }: { disabled: boolean }) {
  return (
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} style={[styles.primary, disabled ? styles.ringed : styles.primaryOn]}>
        <Text style={[styles.primaryText, disabled && styles.off]}>{t.wearThis}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} style={styles.quiet}>
        <Text style={[styles.quietText, disabled && styles.off]}>{t.shuffle}</Text>
      </Pressable>
    </View>
  );
}

export function WhyRow({ disabled }: { disabled: boolean }) {
  return (
    <View style={styles.why}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} style={styles.whyTrigger}>
        <Text style={[styles.label, styles.whyText, disabled && styles.off]}>{t.whyThis}</Text>
      </Pressable>
      <View style={styles.adjust}>
        {[t.tooWarm, t.tooCold].map((label) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: false }}
            disabled={disabled}
            style={styles.chip}
          >
            <Text style={[styles.chipText, disabled && styles.off]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const caps = { textTransform: 'uppercase', fontSize: 11, lineHeight: 11 } as const;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper },
  body: { flexGrow: 1, paddingTop: 12, paddingHorizontal: 24 },
  eyebrow: { ...caps, fontWeight: '500', lineHeight: 15.4, letterSpacing: 1.65, color: light.muted },
  display: { marginTop: 4, fontSize: 28, lineHeight: 33.6, fontWeight: '600', letterSpacing: -0.62, color: light.ink },
  rule: { height: 1, marginTop: 16, backgroundColor: light.hairline },
  wx: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingVertical: 12, paddingHorizontal: 4, height: 93 },
  whisper: { minHeight: 60, marginTop: 8, marginHorizontal: 4 },
  notice: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 4,
    columnGap: 12,
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: light.hairline,
    backgroundColor: light.field,
  },
  noticeText: { flexGrow: 1, flexShrink: 1, flexBasis: 140, fontSize: 13, lineHeight: 18.2, color: light.ink },
  noticeAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginVertical: -12, marginRight: -4, marginLeft: 'auto' },
  noticeActionText: { ...caps, fontWeight: '600', letterSpacing: 1.32, color: light.ink },
  hero: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 190,
    aspectRatio: 1,
    maxWidth: '100%',
    alignSelf: 'center',
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: `linear-gradient(178deg, ${light.renderA}, ${light.renderB})`,
  },
  heroSay: { maxWidth: 190, textAlign: 'center', fontSize: 13, lineHeight: 19.5, color: light.muted },
  vibeRow: { marginTop: 12 },
  label: { ...caps, fontWeight: '600', letterSpacing: 1.76, color: light.muted, marginBottom: 8 },
  vibe: { flexDirection: 'row', backgroundColor: light.field, borderWidth: 1, borderColor: light.edge, padding: 4, gap: 4 },
  seg: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  segOn: { backgroundColor: light.ink },
  segText: { fontSize: 11, lineHeight: 11, fontWeight: '600', letterSpacing: 0.22, color: light.muted },
  segTextOn: { color: light.paper },
  ringed: { borderWidth: 1, borderColor: light.edge },
  off: { color: light.disabled },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  primary: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  primaryOn: { backgroundColor: light.ink },
  primaryText: { fontSize: 15, lineHeight: 15, fontWeight: '500', letterSpacing: 0.15, color: light.paper },
  quiet: { height: 48, paddingHorizontal: 16, justifyContent: 'center' },
  quietText: { fontSize: 13, lineHeight: 13, fontWeight: '500', letterSpacing: 0.13, color: light.muted },
  why: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  whyTrigger: { flex: 1, paddingVertical: 12, paddingHorizontal: 4 },
  whyText: { letterSpacing: 1.65, marginBottom: 0 },
  adjust: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  chip: { height: parseFloat(light.pillM), justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: light.edge },
  chipText: { fontSize: 11, lineHeight: 11, fontWeight: '500', letterSpacing: 0.11, color: light.muted },
});
