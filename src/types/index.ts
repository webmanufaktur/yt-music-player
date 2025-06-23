// YouTube Player API Types
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): PlayerState;
  getVolume(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  getVideoUrl(): string;
  getVideoEmbedCode(): string;
  addEventListener(event: string, listener: string): void;
  removeEventListener(event: string, listener: string): void;
  destroy(): void;
}

// Player State Enum
export enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

// Repeat Mode Enum
export enum RepeatMode {
  NONE = 'none',
  ONE = 'one',
  ALL = 'all',
}

// Track Interface
export interface Track {
  id: string;
  title: string;
  artist?: string;
  tags?: string[];
  duration: number;
  thumbnail?: string;
  url: string;
  addedAt: Date;
}

// Playlist Interface
export interface Playlist {
  tracks: Track[];
  currentIndex: number;
  shuffled: boolean;
  shuffleOrder?: number[];
}

// Player Settings Interface
export interface PlayerSettings {
  volume: number;
  repeatMode: RepeatMode;
  shuffled: boolean;
  autoplay: boolean;
}

// Player State Interface
export interface PlayerStateData {
  playlist: Playlist;
  currentTime: number;
  settings: PlayerSettings;
  lastUpdated: Date;
}

// Event Types
export type PlayerEventType =
  | 'ready'
  | 'stateChange'
  | 'trackChange'
  | 'playlistChange'
  | 'error'
  | 'timeUpdate'
  | 'volumeChange'
  | 'settingsChange';

// Event Handler Type
export type EventHandler<T = any> = (data: T) => void;

// Player Configuration
export interface PlayerConfig {
  containerId: string;
  autoplay?: boolean;
  volume?: number;
  repeat?: RepeatMode;
  shuffle?: boolean;
  enableKeyboardShortcuts?: boolean;
  saveState?: boolean;
  storageKey?: string;
}

// YouTube Video Info
export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channelTitle?: string;
}

// Error Types
export enum ErrorType {
  INVALID_VIDEO_ID = 'INVALID_VIDEO_ID',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  VIDEO_NOT_EMBEDDABLE = 'VIDEO_NOT_EMBEDDABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
}

// Player Error Interface
export interface PlayerError {
  type: ErrorType;
  message: string;
  videoId?: string;
  originalError?: any;
}

// URL Validation Result
export interface URLValidationResult {
  isValid: boolean;
  videoId?: string;
  error?: string;
}

// Storage Interface
export interface StorageManager {
  save(key: string, data: any): void;
  load<T>(key: string): T | null;
  remove(key: string): void;
  clear(): void;
}

// YouTube API Load State
export interface YouTubeAPIState {
  loaded: boolean;
  loading: boolean;
  error?: string;
}

// Player Options for YouTube IFrame API
export interface YouTubePlayerOptions {
  height: string | number;
  width: string | number;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: 'playlist' | 'user_uploads';
    loop?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playlist?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    start?: number;
    widget_referrer?: string;
  };
  events?: {
    onReady?: (event: any) => void;
    onStateChange?: (event: any) => void;
    onPlaybackQualityChange?: (event: any) => void;
    onPlaybackRateChange?: (event: any) => void;
    onError?: (event: any) => void;
    onApiChange?: (event: any) => void;
  };
}

// Global YouTube API types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YouTubePlayerOptions) => YTPlayer;
      PlayerState: typeof PlayerState;
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
} 