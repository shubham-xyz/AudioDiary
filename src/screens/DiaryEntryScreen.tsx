import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { theme } from '../theme/theme';
import { saveDiaryEntry, getDiaryEntryByDate, DiaryEntry, getDiaryEntries } from '../utils/storage';
import { Star, Mic, Play, Square, Save, Smile, Meh, Frown, MapPin, Cloud } from 'lucide-react-native';
import { RootStackParamList } from '../types/navigation';
import { format, parseISO } from 'date-fns';
import { Header } from '../components/Header';
import { ThemeContext } from '../context/ThemeContext';
import * as Location from 'expo-location';

type DiaryEntryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DiaryEntryScreenRouteProp = RouteProp<RootStackParamList, 'DiaryEntry'>;

type MoodType = 'happy' | 'neutral' | 'sad';

export const DiaryEntryScreen = () => {
  const route = useRoute<DiaryEntryScreenRouteProp>();
  const navigation = useNavigation<DiaryEntryScreenNavigationProp>();
  const { date } = route.params;
  const { theme } = useContext(ThemeContext);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [location, setLocation] = useState<DiaryEntry['location']>();
  const [weather, setWeather] = useState<DiaryEntry['weather']>();

  useEffect(() => {
    loadExistingEntry();
    requestLocationPermission();
    return () => {
      if (recording) recording.stopAndUnloadAsync();
      if (sound) sound.unloadAsync();
    };
  }, []);

  const generateDefaultTitle = async () => {
    try {
      const entries = await getDiaryEntries();
      // Filter out the entry for the current date if it exists
      const otherEntries = entries.filter(entry => entry.date !== date);
      const entryNumber = otherEntries.length + 1;
      return `Entry #${entryNumber}`;
    } catch (error) {
      console.error('Error generating default title:', error);
      return 'New Entry';
    }
  };

  const loadExistingEntry = async () => {
    try {
      const entry = await getDiaryEntryByDate(date);
      if (entry) {
        setText(entry.text || '');
        setAudioUri(entry.audioPath || null);
        setTitle(entry.title || '');
        setIsImportant(entry.isImportant || false);
        setMood(entry.mood || 'neutral');
        setLocation(entry.location);
        setWeather(entry.weather);
      } else {
        const defaultTitle = await generateDefaultTitle();
        setTitle(defaultTitle);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get location name using reverse geocoding
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        setLocation({
          latitude,
          longitude,
          name: `${address.city || ''}, ${address.region || ''}`
        });
      }

      // Fetch weather data
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=YOUR_API_KEY`
        );
        const data = await response.json();
        setWeather({
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: data.weather[0].icon
        });
      } catch (error) {
        console.log('Error fetching weather:', error);
      }
    }
  };

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Failed to start recording', err.message);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setAudioUri(uri);
    } catch (err) {
      Alert.alert('Failed to stop recording', err.message);
    }
  }

  async function playSound() {
    if (!audioUri) return;

    try {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      Alert.alert('Failed to play sound', err.message);
    }
  }

  async function stopSound() {
    if (!sound) return;

    try {
      await sound.stopAsync();
      setIsPlaying(false);
    } catch (err) {
      Alert.alert('Failed to stop sound', err.message);
    }
  }

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text for your diary entry');
      return;
    }

    const entry: DiaryEntry = {
      id: Crypto.randomUUID(),
      date,
      title: title.trim() || format(parseISO(date), 'MMMM d, yyyy'),
      text: text.trim(),
      audioPath: audioUri,
      isImportant,
      createdAt: new Date().toISOString(),
      mood,
      location,
      weather,
    };

    try {
      await saveDiaryEntry(entry);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save diary entry');
      console.error('Error saving entry:', error);
    }
  };

  const toggleImportant = () => {
    setIsImportant(!isImportant);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <Header 
        title={format(parseISO(date), 'MMMM d, yyyy')}
        rightContent={
          <TouchableOpacity 
            onPress={handleSave}
            style={styles.saveButton}
          >
            <Save size={24} color={theme.colors.primary.DEFAULT} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TextInput
          style={[
            styles.titleInput, 
            { 
              color: theme.colors.foreground,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            }
          ]}
          placeholder="Title (optional)"
          placeholderTextColor={theme.colors.muted.foreground}
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.moodContainer}>
          <TouchableOpacity
            style={[styles.moodButton, mood === 'happy' && styles.selectedMood]}
            onPress={() => setMood('happy')}
          >
            <Smile size={24} color={mood === 'happy' ? theme.colors.primary : theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.moodButton, mood === 'neutral' && styles.selectedMood]}
            onPress={() => setMood('neutral')}
          >
            <Meh size={24} color={mood === 'neutral' ? theme.colors.primary : theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.moodButton, mood === 'sad' && styles.selectedMood]}
            onPress={() => setMood('sad')}
          >
            <Frown size={24} color={mood === 'sad' ? theme.colors.primary : theme.colors.text} />
          </TouchableOpacity>
        </View>
        {location && (
          <View style={styles.infoContainer}>
            <MapPin size={16} color={theme.colors.text} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>{location.name}</Text>
          </View>
        )}
        {weather && (
          <View style={styles.infoContainer}>
            <Cloud size={16} color={theme.colors.text} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {weather.temperature}°C, {weather.condition}
            </Text>
          </View>
        )}
        <TextInput
          style={[
            styles.textInput,
            {
              color: theme.colors.foreground,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            }
          ]}
          placeholder="Write about your day..."
          placeholderTextColor={theme.colors.muted.foreground}
          multiline
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  moodButton: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  selectedMood: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    minHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  saveButton: {
    padding: 8,
  },
}); 