import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { DiaryEntryScreen } from './src/screens/DiaryEntryScreen';
import { EntriesScreen } from './src/screens/EntriesScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { Home, ListTodo, BarChart3, BookText, Settings, Search } from 'lucide-react-native';
import { StatusBar } from 'react-native';
import { RootStackParamList, TabParamList } from './src/types/navigation';
import { MotivationProvider } from './src/context/MotivationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home':
              return <Home size={size} color={color} />;
            case 'Entries':
              return <BookText size={size} color={color} />;
            case 'Search':
              return <Search size={size} color={color} />;
            case 'Stats':
              return <BarChart3 size={size} color={color} />;
            case 'Settings':
              return <Settings size={size} color={color} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: theme.colors.primary.DEFAULT,
        tabBarInactiveTintColor: theme.colors.muted.foreground,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Entries" component={EntriesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useTheme();
  
  const navigationTheme = {
    dark: theme.colors.background === '#000000',
    colors: {
      primary: theme.colors.primary.DEFAULT,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.foreground,
      border: theme.colors.border,
      notification: theme.colors.primary.DEFAULT,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="DiaryEntry"
          component={DiaryEntryScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MotivationProvider>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </MotivationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
} 