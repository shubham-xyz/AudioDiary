import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { theme } from '../theme/theme';
import { Header } from '../components/Header';
import { ChevronRight, Sun, Moon, Smartphone, Camera } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

export const SettingsScreen = () => {
  const { themeMode, setThemeMode, theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // TODO: Implement notifications logic
  };

  const handleSelectProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  const ThemeOption = ({ 
    mode, 
    label, 
    icon: Icon 
  }: { 
    mode: 'system' | 'light' | 'dark', 
    label: string, 
    icon: React.ElementType 
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: themeMode === mode ? theme.colors.primary.DEFAULT : theme.colors.card,
          borderColor: themeMode === mode ? theme.colors.primary.DEFAULT : theme.colors.border,
        },
      ]}
      onPress={() => setThemeMode(mode)}
    >
      <Icon
        size={24}
        color={themeMode === mode ? theme.colors.primary.foreground : theme.colors.foreground}
      />
      <Text
        style={[
          styles.themeOptionText,
          {
            color: themeMode === mode ? theme.colors.primary.foreground : theme.colors.foreground,
            fontWeight: themeMode === mode ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSettingItem = (
    title: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.settingTitle, { color: theme.colors.foreground }]}>{title}</Text>
      <View style={styles.settingRight}>
        {rightElement || <ChevronRight size={20} color={theme.colors.muted.foreground} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Settings" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted.foreground }]}>Profile</Text>
            <View style={[styles.profileSection, { backgroundColor: theme.colors.card }]}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={handleSelectProfileImage}
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.muted.DEFAULT }]}>
                    <Camera size={24} color={theme.colors.muted.foreground} />
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Camera size={16} color={theme.colors.primary.foreground} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.profileText, { color: theme.colors.foreground }]}>
                Tap to change profile picture
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted.foreground }]}>
              Appearance
            </Text>
            <View style={styles.themeOptions}>
              <ThemeOption mode="system" label="System" icon={Smartphone} />
              <ThemeOption mode="light" label="Light" icon={Sun} />
              <ThemeOption mode="dark" label="Dark" icon={Moon} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted.foreground }]}>
              Notifications
            </Text>
            {renderSettingItem(
              'Enable Notifications',
              undefined,
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{
                  false: theme.colors.muted.DEFAULT,
                  true: theme.colors.primary.DEFAULT,
                }}
                thumbColor={theme.colors.background}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted.foreground }]}>
              Data Management
            </Text>
            {renderSettingItem('Export Data', () => {})}
            {renderSettingItem('Import Data', () => {})}
            {renderSettingItem('Clear All Data', () => {})}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted.foreground }]}>
              Help & Support
            </Text>
            {renderSettingItem('FAQ', () => {})}
            {renderSettingItem('Contact Support', () => {})}
            {renderSettingItem('Privacy Policy', () => {})}
            {renderSettingItem('Terms of Service', () => {})}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted.foreground }]}>
              About
            </Text>
            {renderSettingItem('Version', undefined, (
              <Text style={[styles.versionText, { color: theme.colors.muted.foreground }]}>
                1.0.0
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 36,
    paddingBottom: 150,
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.base,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: theme.typography.fontSize.sm,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    marginHorizontal: theme.spacing[1],
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  themeOptionText: {
    marginTop: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    padding: theme.spacing[6],
    marginHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing[4],
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary.DEFAULT,
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  profileText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.muted.foreground,
  },
});