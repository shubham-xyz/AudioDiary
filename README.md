# AudioDiary

A React Native mobile application for recording and managing daily audio and text diary entries.

## Features

- Create daily diary entries with text and audio recordings
- Mark important entries with a star
- View entries by month with an intuitive calendar interface
- Record and playback audio notes
- Clean and modern user interface
- Monthly view navigation
- Automatic entry numbering

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- Expo AV for audio recording/playback
- AsyncStorage for local data persistence
- date-fns for date manipulation
- Lucide React Native for icons

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shubham-xyz/AudioDiary.git
cd AudioDiary
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on iOS or Android:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React Context providers
├── screens/        # Screen components
├── theme/          # Theme configuration
├── types/          # TypeScript type definitions
└── utils/         # Utility functions and storage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 