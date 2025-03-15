import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { DiaryEntryScreen } from './src/screens/DiaryEntryScreen';
import { EntriesScreen } from './src/screens/EntriesScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { Home, ListTodo, BarChart3 } from 'lucide-react-native';
import { theme } from './src/theme/theme';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList, TabParamList } from './src/types/navigation';
import { MotivationProvider } from './src/context/MotivationContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[2],
        },
        tabBarActiveTintColor: theme.colors.primary.DEFAULT,
        tabBarInactiveTintColor: theme.colors.muted.foreground,
        tabBarItemStyle: {
          paddingVertical: theme.spacing[1],
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Entries"
        component={EntriesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ListTodo size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <MotivationProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="DiaryEntry"
            component={DiaryEntryScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'New Entry',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </MotivationProvider>
  );
} 