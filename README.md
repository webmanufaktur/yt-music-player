# YouTube Music Player

A powerful, TypeScript-based YouTube music player with playlist management, localStorage persistence, and a beautiful user interface. Play YouTube videos as audio-only with full music player controls.

## ✨ Features

- 🎵 **Audio-Only YouTube Playback** - Plays YouTube videos without video display (0x0 pixels)
- 🎪 **Full Music Player Controls** - Play, pause, next, previous, seek, volume control
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **localStorage Persistence** - Remembers playlist and position between sessions
- 🔀 **Shuffle & Repeat** - Multiple playback modes (none, all, one)
- 🎯 **Playlist Management** - Add, remove, reorder tracks
- ⚡ **Real-time Updates** - Live progress tracking and status updates
- 🎨 **Beautiful UI** - Modern, gradient-based design with smooth animations
- 🔧 **TypeScript Support** - Full type safety and IntelliSense
- 📦 **Multiple Build Formats** - ES modules, UMD, and IIFE builds

## 🚀 Quick Start

### Installation

```bash
npm install
npm run build
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Music Player</title>
</head>
<body>
    <div id="player-container"></div>
    
    <script type="module">
        import { YouTubeMusicPlayer } from './dist/youtube-music-player.es.js';
        
        const player = new YouTubeMusicPlayer({
            containerId: 'player-container',
            autoplay: false,
            volume: 80
        });
        
        // Add tracks
        await player.addTrack('https://youtu.be/dQw4w9WgXcQ', 'Rick Astley - Never Gonna Give You Up');
        
        // Control playback
        player.play();
    </script>
</body>
</html>
```

### JavaScript (UMD)

```html
<script src="./dist/youtube-music-player.umd.js"></script>
<script>
    const player = new YouTubeMusicPlayer.default({
        containerId: 'player-container'
    });
</script>
```

## 📖 API Reference

### Constructor

```typescript
const player = new YouTubeMusicPlayer(config: PlayerConfig);
```

#### PlayerConfig

```typescript
interface PlayerConfig {
    containerId: string;           // ID of container element
    autoplay?: boolean;           // Auto-start playing (default: false)
    volume?: number;              // Initial volume 0-100 (default: 80)
    repeat?: RepeatMode;          // Repeat mode (default: RepeatMode.ALL)
    shuffle?: boolean;            // Enable shuffle (default: false)
    enableKeyboardShortcuts?: boolean; // Keyboard controls (default: false)
    saveState?: boolean;          // localStorage persistence (default: true)
    storageKey?: string;          // Custom storage key (default: 'ytMusicPlayer')
}
```

### Methods

#### Playlist Management

```typescript
// Add a track to the playlist
await player.addTrack(url: string, title?: string): Promise<Track | null>

// Remove track by index
player.removeTrack(index: number): boolean

// Clear entire playlist
player.clearPlaylist(): void

// Jump to specific track
player.jumpToTrack(index: number): void
```

#### Playback Controls

```typescript
// Basic controls
player.play(): void
player.pause(): void
player.stop(): void
player.togglePlay(): void

// Navigation
player.next(): void
player.previous(): void

// Seeking
player.seekTo(seconds: number): void

// Volume (0-100)
player.setVolume(volume: number): void
player.toggleMute(): void
```

#### Settings

```typescript
// Shuffle
player.toggleShuffle(): void

// Repeat modes: none, all, one
player.toggleRepeat(): void
```

#### Getters

```typescript
// Current state
player.getCurrentTrack(): Track | null
player.getPlaylist(): Playlist
player.getSettings(): PlayerSettings
player.getCurrentTime(): number
player.getDuration(): number
player.getProgress(): number // 0-100%
player.getVolume(): number

// Status checks
player.isPlaying(): boolean
player.isPaused(): boolean
player.isMuted(): boolean
```

### Events

Listen to player events:

```typescript
// Player ready
player.on('ready', (data) => {
    console.log('Player ready!', data.player);
});

// Track changes
player.on('trackChange', (data) => {
    console.log('Now playing:', data.track.title);
});

// Playback state changes
player.on('stateChange', (data) => {
    console.log('Playing:', data.isPlaying);
});

// Time updates (every 500ms while playing)
player.on('timeUpdate', (data) => {
    console.log(`${data.currentTime}s / ${data.duration}s`);
});

// Playlist changes
player.on('playlistChange', (data) => {
    console.log('Playlist updated:', data.action);
});

// Settings changes
player.on('settingsChange', (data) => {
    console.log('Settings updated:', data.settings);
});

// Volume changes
player.on('volumeChange', (data) => {
    console.log('Volume:', data.volume);
});

// Errors
player.on('error', (error) => {
    console.error('Player error:', error.message);
});
```

### Remove Event Listeners

```typescript
player.off(event: PlayerEventType, handler: EventHandler): void
```

## 🎯 URL Formats Supported

The player supports various YouTube URL formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- Direct video ID: `VIDEO_ID`

## 🔧 Development

### Project Structure

```
src/
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   ├── youtube.ts   # YouTube API and URL handling
│   └── storage.ts   # localStorage management
├── player/          # Main player class
│   └── YouTubeMusicPlayer.ts
└── index.ts         # Main exports

dist/                # Built files
├── youtube-music-player.es.js    # ES module
├── youtube-music-player.umd.js   # UMD build
└── youtube-music-player.iife.js  # IIFE build
```

### Build Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run build:types

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm run test
npm run test:ui

# Clean build files
npm run clean
```

### Development Server

```bash
npm run dev
```

Opens development server at `http://localhost:3000` with the demo page.

## 🌐 Browser Compatibility

### Minimum Requirements

- **Chrome 70+**
- **Firefox 65+**
- **Safari 12+**
- **Edge 79+**
- **iOS Safari 12+**
- **Android Chrome 70+**

### Requirements

- HTML5 support
- JavaScript ES2020+ features
- localStorage support
- Fetch API support
- HTTPS (required by YouTube API)

## 📚 Examples

### Basic Music Player

```typescript
import { YouTubeMusicPlayer, RepeatMode } from 'youtube-music-player';

const player = new YouTubeMusicPlayer({
    containerId: 'my-player',
    autoplay: true,
    volume: 90,
    repeat: RepeatMode.ALL
});

// Add some tracks
const tracks = [
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtu.be/oHg5SJYRHA0',
    'https://youtu.be/SQoA_wjmE9w'
];

for (const url of tracks) {
    await player.addTrack(url);
}

// Set up UI updates
player.on('trackChange', (data) => {
    document.title = data.track.title;
});

player.on('timeUpdate', (data) => {
    updateProgressBar(data.progress);
});
```

### Playlist from Array

```typescript
const playlist = [
    { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Never Gonna Give You Up' },
    { url: 'https://youtu.be/oHg5SJYRHA0', title: 'RickRoll\'d' },
];

const player = new YouTubeMusicPlayer({
    containerId: 'player'
});

// Load playlist
for (const track of playlist) {
    await player.addTrack(track.url, track.title);
}

// Start playing
player.play();
```

### Custom Storage

```typescript
import { YouTubeMusicPlayer, LocalStorageManager } from 'youtube-music-player';

const customStorage = new LocalStorageManager('myapp-music');

const player = new YouTubeMusicPlayer({
    containerId: 'player',
    storageKey: 'custom-playlist'
});
```

## 🔒 Privacy & Legal

- Uses official YouTube IFrame Player API
- No audio extraction or downloading
- Respects YouTube's Terms of Service
- All licensing handled by YouTube
- No server-side processing required
- HTTPS required for production use

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- YouTube IFrame Player API
- TypeScript community
- Vite build system
- All contributors and users

## 📋 Roadmap

- [ ] Keyboard shortcuts support
- [ ] Visualizer integration
- [ ] Crossfade between tracks
- [ ] Equalizer controls
- [ ] Export/import playlists
- [ ] Integration with music services
- [ ] PWA support
- [ ] Advanced search functionality

---

Made with ❤️ for music lovers who want to enjoy YouTube content as audio-only playlists. 