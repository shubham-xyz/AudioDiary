import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  DiaryEntry: {
    date: string;
  };
};

export type TabParamList = {
  Home: undefined;
  Entries: undefined;
  Search: undefined;
  Stats: undefined;
  Settings: undefined;
}; 