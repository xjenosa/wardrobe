import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { AddGarmentScreen } from '../screens/add/AddGarmentScreen';
import { ClosetScreen } from '../screens/closet/ClosetScreen';
import { ItemEditorScreen } from '../screens/editor/ItemEditorScreen';
import { FirstRunScreen } from '../screens/firstrun/FirstRunScreen';
import { TodayScreen } from '../screens/today/TodayScreen';
import { WeatherScreen } from '../screens/weather/WeatherScreen';
import { YouScreen } from '../screens/you/YouScreen';
import { screens } from '../strings/screens';
import { font } from '../theme/font';
import { Hanger, Sunrise } from '../theme/icons';
import { light } from '../theme/tokens';
import type { RootStackParamList, TabParamList, TodayParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Today = createNativeStackNavigator<TodayParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/* No navigator draws a header: every plate draws its own top bar, or none. */
const bare = { headerShown: false } as const;

/* Light only (ADR 0008), so one theme, built from the drawn palette and the
   drawn typeface. A face carries its own weight (src/theme/font.ts), and the
   heaviest is 600 because that is the heaviest the mockup loads. */
const theme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: light.ink,
    background: light.paper,
    card: light.paper,
    text: light.ink,
    border: light.hairline,
  },
  fonts: {
    regular: { fontFamily: font.regular, fontWeight: 'normal' },
    medium: { fontFamily: font.medium, fontWeight: 'normal' },
    bold: { fontFamily: font.semibold, fontWeight: 'normal' },
    heavy: { fontFamily: font.semibold, fontWeight: 'normal' },
  },
};

function TodayTab() {
  return (
    <Today.Navigator screenOptions={bare}>
      <Today.Screen name="Today" component={TodayScreen} />
      <Today.Screen name="Weather" component={WeatherScreen} />
    </Today.Navigator>
  );
}

/* THE TAB BAR AS FIGS 06 TO 15 DRAW IT (.tabbar). Each tab has its icon at
   22 over its name in small capitals, ink when open and muted when not. The two
   sit together in the middle, 74 wide and 36 apart, so each tab is given 110
   and the bar is padded to hold them there instead of spreading them to its
   ends. */
const TAB = 74 + 36;
const todayIcon = ({ color }: { color: string }) => <Sunrise color={color} size={22} />;
const closetIcon = ({ color }: { color: string }) => <Hanger color={color} size={22} />;

function Tabs() {
  const { width } = useWindowDimensions();
  return (
    <Tab.Navigator
      screenOptions={{
        ...bare,
        tabBarActiveTintColor: light.ink,
        tabBarInactiveTintColor: light.muted,
        tabBarLabelStyle: tabStyles.label,
        tabBarStyle: { paddingHorizontal: Math.max(0, (width - 2 * TAB) / 2) },
      }}
    >
      <Tab.Screen name="TodayTab" component={TodayTab} options={{ title: screens.today, tabBarIcon: todayIcon }} />
      <Tab.Screen name="Closet" component={ClosetScreen} options={{ title: screens.closet, tabBarIcon: closetIcon }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  label: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.21, textTransform: 'uppercase' },
});

/* First run has no way back on its plate (Fig 05), so it cannot be swiped away;
   the editor and You are drawn over what opened them (Figs 19 and 23). */
export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={theme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={bare}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="FirstRun"
          component={FirstRunScreen}
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="AddGarment" component={AddGarmentScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="ItemEditor" component={ItemEditorScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="You" component={YouScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
