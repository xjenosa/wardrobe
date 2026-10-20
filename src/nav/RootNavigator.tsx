import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AddGarmentScreen } from '../screens/add/AddGarmentScreen';
import { ClosetScreen } from '../screens/closet/ClosetScreen';
import { ItemEditorScreen } from '../screens/editor/ItemEditorScreen';
import { FirstRunScreen } from '../screens/firstrun/FirstRunScreen';
import { TodayScreen } from '../screens/today/TodayScreen';
import { WeatherScreen } from '../screens/weather/WeatherScreen';
import { YouScreen } from '../screens/you/YouScreen';
import { screens } from '../strings/screens';
import { light } from '../theme/tokens';
import type { RootStackParamList, TabParamList, TodayParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Today = createNativeStackNavigator<TodayParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/* No navigator draws a header: every plate draws its own top bar, or none. */
const bare = { headerShown: false } as const;

/* Light only (ADR 0008), so one theme, built from the drawn palette. */
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
};

function TodayTab() {
  return (
    <Today.Navigator screenOptions={bare}>
      <Today.Screen name="Today" component={TodayScreen} />
      <Today.Screen name="Weather" component={WeatherScreen} />
    </Today.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ ...bare, tabBarActiveTintColor: light.ink, tabBarInactiveTintColor: light.muted }}
    >
      <Tab.Screen name="TodayTab" component={TodayTab} options={{ title: screens.today }} />
      <Tab.Screen name="Closet" component={ClosetScreen} options={{ title: screens.closet }} />
    </Tab.Navigator>
  );
}

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
