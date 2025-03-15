import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { theme } from '../theme/theme';
import { saveDiaryEntry, getDiaryEntryByDate, DiaryEntry, getDiaryEntries } from '../utils/storage';
import { Star } from 'lucide-react-native';
import { RootStackParamList } from '../types/navigation';

type DiaryEntryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DiaryEntryScreenRouteProp = RouteProp<RootStackParamList, 'DiaryEntry'>;

export const DiaryEntryScreen = () => {
  const route = useRoute<DiaryEntryScreenRouteProp>();
  const navigation = useNavigation<DiaryEntryScreenNavigationProp>();
  const { date } = route.params;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  useEffect(() => {
    loadExistingEntry();
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
      } else {
        const defaultTitle = await generateDefaultTitle();
        setTitle(defaultTitle);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
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
    try {
      if (!text && !audioUri) {
        Alert.alert('Error', 'Please add some text or record audio before saving');
        return;
      }

      // If title is empty or just whitespace, generate new default title
      let finalTitle = title.trim();
      if (!finalTitle) {
        finalTitle = await generateDefaultTitle();
      }

      const entry: DiaryEntry = {
        id: await Crypto.randomUUID(),
        date,
        text,
        audioPath: audioUri || '',
        title: finalTitle,
        isImportant: false,
        createdAt: new Date().toISOString(),
      };

      await saveDiaryEntry(entry);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const toggleImportant = () => {
    setIsImportant(!isImportant);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{date}</Text>
          <TouchableOpacity 
            onPress={toggleImportant} 
            style={[
              styles.importantButton,
              isImportant && styles.importantButtonActive
            ]}
          >
            <Star
              size={24}
              color={isImportant ? '#f59e0b' : theme.colors.muted.foreground}
              fill={isImportant ? '#f59e0b' : 'none'}
              strokeWidth={isImportant ? 2.5 : 2}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Entry Title"
            placeholderTextColor={theme.colors.muted.foreground}
          />

          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Write your thoughts here..."
            value={text}
            onChangeText={setText}
            placeholderTextColor={theme.colors.muted.foreground}
          />

          <View style={styles.recordingContainer}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>

            {audioUri && !isRecording && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={isPlaying ? stopSound : playSound}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying ? 'Stop Playing' : 'Play Recording'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? theme.spacing[6] : 0,
  },
  header: {
    padding: theme.spacing[4],
    paddingTop: theme.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  importantButton: {
    marginLeft: theme.spacing[3],
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
  },
  importantButtonActive: {
    backgroundColor: 'rgba(254, 243, 199, 0.2)',
  },
  content: {
    flex: 1,
    padding: theme.spacing[4],
  },
  titleInput: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.muted.DEFAULT,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.lg,
    marginBottom: theme.spacing[4],
  },
  textInput: {
    flex: 1,
    padding: theme.spacing[4],
    backgroundColor: theme.colors.muted.DEFAULT,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.base,
    textAlignVertical: 'top',
  },
  recordingContainer: {
    marginVertical: theme.spacing[4],
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: theme.colors.destructive.DEFAULT,
  },
  recordButtonText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: theme.colors.secondary.DEFAULT,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
    marginTop: theme.spacing[4],
  },
  playButtonText: {
    color: theme.colors.secondary.foreground,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
  },
}); 