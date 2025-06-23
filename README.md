# YouTube Music Player

A modern, TypeScript-based YouTube music player with playlist management, localStorage persistence, and a beautiful user interface. Play YouTube videos as audio-only with full music player controls.

## ✨ Features

- 🎵 **Audio-Only YouTube Playbook** - Plays YouTube videos without video display (hidden iframe)
- 🎪 **Complete Music Player Controls** - Play, pause, next, previous, seek, volume control
- 📱 **Responsive Design** - Modern UI with Tailwind CSS that works on desktop and mobile
- 💾 **localStorage Persistence** - Remembers playlist and playback position between sessions
- 🔀 **Shuffle & Repeat** - Multiple playback modes (none, all, one)
- 🎯 **Playlist Management** - Add, remove, and navigate through tracks
- ⚡ **Real-time Updates** - Live progress tracking and status updates
- 🎨 **Beautiful Modern UI** - Clean design with gradients and smooth animations
- 🔧 **TypeScript Support** - Full type safety and comprehensive type definitions
- 📦 **Vite Build System** - Fast development and optimized production builds

## 🚀 Quick Start

### Development

```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

The player is designed as a single-page application with a demo interface. Open the built `index.html` in a browser or run the development server to use the player.

Key components:

- Modern card-based UI with album art display
- Full music player controls (play/pause, next/previous, seek)
- Progress bar with click-to-seek functionality
- Volume controls and time display
- Playlist management with visual feedback

## 📖 API Reference

### Core Classes

#### `YouTubeMusicPlayer`

The main player class that handles YouTube video playback as audio.

```typescript
import { YouTubeMusicPlayer, RepeatMode } from './src/index';

const player = new YouTubeMusicPlayer({
  containerId: 'player-container',
  autoplay: false,
  volume: 80,
  repeat: RepeatMode.ALL,
  shuffle: false,
  saveState: true,
});
```

#### Configuration Options

```typescript
interface PlayerConfig {
  containerId: string; // ID of container element
  autoplay?: boolean; // Auto-start playing (default: false)
  volume?: number; // Initial volume 0-100 (default: 80)
  repeat?: RepeatMode; // Repeat mode (default: ALL)
  shuffle?: boolean; // Enable shuffle (default: false)
  saveState?: boolean; // localStorage persistence (default: true)
  storageKey?: string; // Custom storage key (default: auto-generated)
}
```

### Core Methods

```typescript
// Playlist Management
await player.addTrack(url: string, title?: string): Promise<Track | null>
player.removeTrack(index: number): boolean
player.clearPlaylist(): void
player.jumpToTrack(index: number): void

// Playback Controls
player.play(): void
player.pause(): void
player.togglePlay(): void
player.next(): void
player.previous(): void
player.seekTo(seconds: number): void

// Settings
player.setVolume(volume: number): void
player.toggleMute(): void
player.toggleShuffle(): void
player.toggleRepeat(): void

// State Getters
player.getCurrentTrack(): Track | null
player.getPlaylist(): Playlist
player.getCurrentTime(): number
player.getDuration(): number
player.getVolume(): number
player.isPlaying(): boolean
```

## 🎯 Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- Direct video ID: `VIDEO_ID`

## 🔧 Development Structure

```
src/
├── player/              # Main player class
│   └── YouTubeMusicPlayer.ts
├── types/               # TypeScript definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── youtube.ts       # YouTube API & URL handling
│   └── storage.ts       # localStorage management
├── styles.css           # Tailwind CSS styles
└── index.ts             # Main exports

public/                  # Static assets and sample data
├── playlist-bangers.json
├── playlist-mash.json
└── tracklist.json

dist/                    # Built files (after npm run build)
├── index.html
└── assets/
    ├── main-[hash].js   # Built JavaScript
    └── main-[hash].css  # Built styles
```

### Build System

- **Vite** - Fast build tool with HMR for development
- **TypeScript** - Full type checking and compilation
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint & Prettier** - Code linting and formatting
- **Terser** - JavaScript minification for production

### Available Scripts

```bash
npm run dev          # Development server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint code checking
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run test         # Run tests (if configured)
npm run clean        # Clean dist directory
```

## 🌐 Browser Compatibility

### Minimum Requirements

- **Chrome 70+**
- **Firefox 65+**
- **Safari 12+**
- **Edge 79+**
- **iOS Safari 12+**
- **Android Chrome 70+**

### Technical Requirements

- HTML5 and modern JavaScript (ES2020+)
- localStorage support
- Fetch API support
- **HTTPS required** (YouTube API requirement)
- postMessage support for iframe communication

## 🎨 UI Features

The current implementation includes:

- **Modern Card Design** - Clean, rounded corners with shadows
- **Album Art Display** - Shows YouTube video thumbnails or fallback icons
- **Gradient Backgrounds** - Beautiful gradient overlays
- **Responsive Layout** - Mobile-friendly design
- **Interactive Controls** - Hover effects and smooth transitions
- **Progress Visualization** - Clickable progress bar with real-time updates
- **Status Indicators** - Visual feedback for player state

## 🔒 Privacy & Legal

- Uses official YouTube IFrame Player API
- No audio extraction or downloading
- Respects YouTube's Terms of Service
- All licensing handled by YouTube automatically
- No server-side processing required
- Player runs entirely in browser
- HTTPS required for production use

## 📝 Current Implementation Status

### ✅ Completed Features

- YouTube IFrame API integration
- Audio-only playback (hidden iframe)
- Basic playback controls (play/pause, next/previous)
- Volume and seek controls
- Playlist management (add/remove tracks)
- localStorage persistence
- Modern UI with Tailwind CSS
- TypeScript implementation with full types
- URL parsing for multiple YouTube formats
- Error handling for invalid videos
- Responsive design

### 🚧 In Development

- Advanced playlist features (drag & drop reordering)
- Keyboard shortcuts support
- Enhanced error messaging
- Improved mobile experience
- Additional player customization options

### 🔮 Planned Features

- Crossfade between tracks
- Equalizer controls
- Export/import playlists
- Advanced search functionality
- PWA (Progressive Web App) support
- Additional streaming service integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- YouTube IFrame Player API
- TypeScript community
- Vite build system
- Tailwind CSS framework
- All contributors and users

---

Made with ❤️ for music lovers who want to enjoy YouTube content as audio-only playlists.
