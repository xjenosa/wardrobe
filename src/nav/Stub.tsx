import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { stub } from '../strings/screens';
import { font } from '../theme/font';
import { light } from '../theme/tokens';

type Link = { label: string; onPress: () => void };

/* A route's placeholder until its track builds the screen: its own name, the
   screens it leads to, and a way back, since no navigator draws a header. Each
   track replaces its stubs; nothing else should import this. */
export function Stub({ title, links = [] }: { title: string; links?: Link[] }) {
  const navigation = useNavigation();
  const all = navigation.canGoBack() ? [...links, { label: stub.back, onPress: () => navigation.goBack() }] : links;
  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {all.map((link) => (
        <Pressable
          key={link.label}
          accessibilityRole="button"
          onPress={link.onPress}
          style={styles.link}
        >
          <Text style={styles.linkText}>{link.label}</Text>
        </Pressable>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: light.paper, padding: 24, gap: 12 },
  title: { fontFamily: font.semibold, fontSize: 28, color: light.ink, marginBottom: 12 },
  link: { borderWidth: 1, borderColor: light.edge, paddingVertical: 12, paddingHorizontal: 16 },
  linkText: { fontFamily: font.regular, fontSize: 15, color: light.ink },
});
