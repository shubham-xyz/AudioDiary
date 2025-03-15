import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  DiaryEntry: {
    date: string;
  };
};

export type TabParamList = {
  Home: undefined;
  Entries: undefined;
  Stats: undefined;
}; 