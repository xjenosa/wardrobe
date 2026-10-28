import { StyleSheet, Text, View } from 'react-native';

import { drawn } from '../strings/drawn';
import { font } from '../theme/font';
import { Back, Close } from '../theme/icons';
import { light } from '../theme/tokens';
import { TopButton } from './TopButton';

/* THE BAR OF A SCREEN PUSHED OVER ANOTHER (.topbar): a way back, then the
   title, over a hairline. Weather draws Back (Figs 14 and 14d), and so does
   Add garment once it has a photograph (Fig 18); the camera draws Close
   (Figs 17 and 17b). It sits inside the screen's safe area and adds none. */
export function TopBar({ title, onBack, way = 'back' }: { title: string; onBack: () => void; way?: 'back' | 'close' }) {
  return (
    <View style={styles.bar}>
      <TopButton
        icon={way === 'back' ? Back : Close}
        label={way === 'back' ? drawn.fig14.back : drawn.fig17.close}
        onPress={onBack}
        style={styles.button}
      />
      <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 59,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: light.hairline,
  },
  button: { marginLeft: -12 },
  title: { flexShrink: 1, fontFamily: font.semibold, fontSize: 15, letterSpacing: -0.075, color: light.ink },
});
