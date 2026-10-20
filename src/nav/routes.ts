import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/* EACH SCREEN SITS WHERE ITS PLATE PUTS IT (docs/design/mobile.html). Weather
   opens inside the Today tab, so the tab bar stays (Figs 14 and 14d). No
   forecast is Today's own state (Fig 11) and has no route. First run, Add
   garment, the item editor and You cover the tabs. Adding a route is a pull
   request here, to Max (ADR 0017). */
export type TodayParamList = {
  Today: undefined;
  Weather: undefined;
};

export type TabParamList = {
  TodayTab: NavigatorScreenParams<TodayParamList>;
  Closet: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  FirstRun: undefined;
  AddGarment: undefined;
  ItemEditor: { id: string };
  You: undefined;
};

/* What Today's screens navigate with: their own tab's stack, and anything that
   covers the tabs. */
export type TodayNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<TodayParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
