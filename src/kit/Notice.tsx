import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { font } from '../theme/font';
import { Alert } from '../theme/icons';
import { light } from '../theme/tokens';

/* A LINE SAYING SOMETHING WENT WRONG, AND THE ONE THING TO DO ABOUT IT
   (.notice): Today's forecast box (Fig 11) and the top of Weather (Fig 14d).
   The action wraps under the words where they would get narrower than 140,
   and its touch area reaches past the notice's padding to stay 44 tall. */
export function Notice({
  text,
  action,
  onPress,
  style,
}: {
  text: string;
  action: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.notice, style]}>
      <View style={styles.mark}>
        <Alert color={light.muted} />
      </View>
      <Text accessibilityRole="alert" style={styles.text}>
        {text}
      </Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
        <Text style={styles.actionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
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
  mark: { marginTop: 1 },
  text: { flexGrow: 1, flexShrink: 1, flexBasis: 140, fontFamily: font.regular, fontSize: 13, lineHeight: 18.2, color: light.ink },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginVertical: -12, marginRight: -4, marginLeft: 'auto' },
  actionText: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
    color: light.ink,
  },
});
