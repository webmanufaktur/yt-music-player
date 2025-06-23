import {
  YTPlayer,
  PlayerState,
  RepeatMode,
  Track,
  Playlist,
  PlayerSettings,
  PlayerStateData,
  PlayerEventType,
  EventHandler,
  PlayerConfig,
  VideoInfo,
  PlayerError,
  ErrorType,
  YouTubePlayerOptions,
} from '../types';
import { 
  extractVideoId, 
  youtubeAPI, 
  getThumbnailUrl, 
  formatTime,
  createPlayerError,
  generateShuffleOrder,
  debounce
} from '../utils/youtube';
import { PlayerStorageManager, defaultStorage } from '../utils/storage';

/**
 * Main YouTube Music Player class
 */
export class YouTubeMusicPlayer {
  private player: YTPlayer | null = null;
  private playlist: Playlist = {
    tracks: [],
    currentIndex: 0,
    shuffled: false,
  };
  private settings: PlayerSettings = {
    volume: 80,
    repeatMode: RepeatMode.ALL,
    shuffled: false,
    autoplay: false,
  };
  private currentTime = 0;
  private isReady = false;
  private containerId: string;
  private storage: PlayerStorageManager;
  private eventListeners: Map<PlayerEventType, EventHandler[]> = new Map();
  
  // Debounced functions
  private debouncedSaveState: () => void;
  private debouncedTimeUpdate: () => void;

  constructor(config: PlayerConfig) {
    this.containerId = config.containerId;
    this.storage = config.saveState !== false ? defaultStorage : new PlayerStorageManager();
    
    // Apply config
    if (config.volume !== undefined) this.settings.volume = config.volume;
    if (config.repeat !== undefined) this.settings.repeatMode = config.repeat;
    if (config.shuffle !== undefined) this.settings.shuffled = config.shuffle;
    if (config.autoplay !== undefined) this.settings.autoplay = config.autoplay;

    // Setup debounced functions
    this.debouncedSaveState = debounce(() => this.saveCurrentState(), 1000);
    this.debouncedTimeUpdate = debounce(() => this.debouncedSaveState(), 2000);

    // Initialize
    this.initialize();
  }

  /**
   * Initialize the player
   */
  private async initialize(): Promise<void> {
    try {
      // Load stored state
      this.loadStoredState();

      // Wait for YouTube API
      await youtubeAPI.waitForReady();

      // Create player container if it doesn't exist
      this.ensureContainer();

      // Create YouTube player
      this.createPlayer();

      this.emit('ready', { player: this });
    } catch (error) {
      this.handleError({
        type: ErrorType.API_ERROR,
        message: 'Failed to initialize player',
        originalError: error,
      });
    }
  }

  /**
   * Ensure player container exists
   */
  private ensureContainer(): void {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.cssText = 'width: 0; height: 0; overflow: hidden; position: absolute;';
      document.body.appendChild(container);
    }
  }

  /**
   * Create YouTube player instance
   */
  private createPlayer(): void {
    const playerOptions: YouTubePlayerOptions = {
      height: 0,
      width: 0,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin, // Fix for localhost CORS issues
      },
      events: {
        onReady: (event) => this.handlePlayerReady(event),
        onStateChange: (event) => this.handlePlayerStateChange(event),
        onError: (event) => this.handlePlayerError(event),
      },
    };

    this.player = new window.YT.Player(this.containerId, playerOptions);
  }

  /**
   * Handle player ready event
   */
  private handlePlayerReady(event: any): void {
    this.isReady = true;
    this.player?.setVolume(this.settings.volume);

    // Start monitoring time updates
    this.startTimeMonitoring();

    // Load current track if available
    if (this.playlist.tracks.length > 0) {
      this.loadCurrentTrack();
    }

    this.emit('ready', { player: this });
  }

  /**
   * Handle player state changes
   */
  private handlePlayerStateChange(event: any): void {
    const state = event.data;
    
    this.emit('stateChange', { 
      state, 
      isPlaying: state === PlayerState.PLAYING,
      isPaused: state === PlayerState.PAUSED,
      isEnded: state === PlayerState.ENDED,
    });

    // Handle track end
    if (state === PlayerState.ENDED) {
      this.handleTrackEnded();
    }

    // Save state when playing starts
    if (state === PlayerState.PLAYING) {
      this.debouncedSaveState();
    }
  }

  /**
   * Handle YouTube API errors
   */
  private handlePlayerError(event: any): void {
    const errorCode = event.data;
    const currentTrack = this.getCurrentTrack();
    const error = createPlayerError(errorCode, currentTrack?.id);
    
    this.handleError(error);

    // Try to skip to next track on certain errors
    if ([100, 101, 150].includes(errorCode) && this.playlist.tracks.length > 1) {
      this.next();
    }
  }

  /**
   * Handle track ended
   */
  private handleTrackEnded(): void {
    if (this.settings.repeatMode === RepeatMode.ONE) {
      // Repeat current track
      this.seekTo(0);
      this.play();
    } else {
      // Move to next track
      this.next();
    }
  }

  /**
   * Start time monitoring
   */
  private startTimeMonitoring(): void {
    const updateTime = () => {
      if (this.player && this.isReady) {
        this.currentTime = this.player.getCurrentTime();
        this.handleTimeUpdate();
      }
      requestAnimationFrame(updateTime);
    };
    updateTime();
  }

  /**
   * Handle time updates
   */
  private handleTimeUpdate(): void {
    this.emit('timeUpdate', {
      currentTime: this.currentTime,
      duration: this.getDuration(),
      progress: this.getProgress(),
    });
    
    // Save position occasionally (debounced)
    this.debouncedTimeUpdate();
  }

  /**
   * Add a track to the playlist
   */
  async addTrack(url: string, title?: string): Promise<Track | null> {
    const validation = extractVideoId(url);
    if (!validation.isValid || !validation.videoId) {
      this.handleError({
        type: ErrorType.INVALID_VIDEO_ID,
        message: 'Invalid YouTube URL',
      });
      return null;
    }

    const track: Track = {
      id: validation.videoId,
      title: title || `Video ${validation.videoId}`,
      duration: 0, // Will be updated when video loads
      thumbnail: getThumbnailUrl(validation.videoId),
      url,
      addedAt: new Date(),
    };

    this.playlist.tracks.push(track);
    
    // If this is the first track, load it
    if (this.playlist.tracks.length === 1) {
      this.playlist.currentIndex = 0;
      this.loadCurrentTrack();
    }

    this.emit('playlistChange', { 
      playlist: this.playlist,
      action: 'add',
      track,
    });

    this.debouncedSaveState();
    return track;
  }

  /**
   * Add a track with enhanced metadata
   */
  async addTrackWithMetadata(trackData: {
    id: string;
    title: string;
    artist?: string;
    tags?: string[];
  }): Promise<Track | null> {
    const track: Track = {
      id: trackData.id,
      title: trackData.title,
      artist: trackData.artist,
      tags: trackData.tags,
      duration: 0, // Will be fetched from YouTube when the video loads
      thumbnail: getThumbnailUrl(trackData.id),
      url: `https://youtu.be/${trackData.id}`,
      addedAt: new Date(),
    };

    this.playlist.tracks.push(track);
    
    // If this is the first track, load it
    if (this.playlist.tracks.length === 1) {
      this.playlist.currentIndex = 0;
      this.loadCurrentTrack();
    }

    this.emit('playlistChange', { 
      playlist: this.playlist,
      action: 'add',
      track,
    });

    this.debouncedSaveState();
    return track;
  }

  /**
   * Remove track from playlist
   */
  removeTrack(index: number): boolean {
    if (index < 0 || index >= this.playlist.tracks.length) {
      return false;
    }

    const removedTrack = this.playlist.tracks[index];
    this.playlist.tracks.splice(index, 1);

    // Adjust current index
    if (index < this.playlist.currentIndex) {
      this.playlist.currentIndex--;
    } else if (index === this.playlist.currentIndex) {
      // Current track was removed
      if (this.playlist.tracks.length === 0) {
        this.playlist.currentIndex = 0;
        this.stop();
      } else {
        // Load next track (or previous if at end)
        if (this.playlist.currentIndex >= this.playlist.tracks.length) {
          this.playlist.currentIndex = 0;
        }
        this.loadCurrentTrack();
      }
    }

    this.emit('playlistChange', { 
      playlist: this.playlist,
      action: 'remove',
      track: removedTrack,
      index,
    });

    this.debouncedSaveState();
    return true;
  }

  /**
   * Load current track into player
   */
  private loadCurrentTrack(): void {
    const track = this.getCurrentTrack();
    if (!track || !this.player || !this.isReady) {
      return;
    }

    this.player.loadVideoById(track.id, this.currentTime);
    
    this.emit('trackChange', {
      track,
      index: this.playlist.currentIndex,
      playlist: this.playlist,
    });
  }

  /**
   * Play current track
   */
  play(): void {
    if (this.player && this.isReady) {
      this.player.playVideo();
    }
  }

  /**
   * Pause current track
   */
  pause(): void {
    if (this.player && this.isReady) {
      this.player.pauseVideo();
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.player && this.isReady) {
      this.player.stopVideo();
      this.currentTime = 0;
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay(): void {
    if (!this.player || !this.isReady) return;

    const state = this.player.getPlayerState();
    if (state === PlayerState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Go to next track
   */
  next(): void {
    if (this.playlist.tracks.length === 0) return;

    let nextIndex: number;

    if (this.settings.shuffled && this.playlist.shuffleOrder) {
      // Find current position in shuffle order
      const currentShufflePos = this.playlist.shuffleOrder.indexOf(this.playlist.currentIndex);
      const nextShufflePos = (currentShufflePos + 1) % this.playlist.shuffleOrder.length;
      nextIndex = this.playlist.shuffleOrder[nextShufflePos];
    } else {
      nextIndex = (this.playlist.currentIndex + 1) % this.playlist.tracks.length;
    }

    this.jumpToTrack(nextIndex);
  }

  /**
   * Go to previous track
   */
  previous(): void {
    if (this.playlist.tracks.length === 0) return;

    let prevIndex: number;

    if (this.settings.shuffled && this.playlist.shuffleOrder) {
      // Find current position in shuffle order
      const currentShufflePos = this.playlist.shuffleOrder.indexOf(this.playlist.currentIndex);
      const prevShufflePos = currentShufflePos === 0 
        ? this.playlist.shuffleOrder.length - 1 
        : currentShufflePos - 1;
      prevIndex = this.playlist.shuffleOrder[prevShufflePos];
    } else {
      prevIndex = this.playlist.currentIndex === 0 
        ? this.playlist.tracks.length - 1 
        : this.playlist.currentIndex - 1;
    }

    this.jumpToTrack(prevIndex);
  }

  /**
   * Jump to specific track
   */
  jumpToTrack(index: number): void {
    if (index < 0 || index >= this.playlist.tracks.length) return;

    this.playlist.currentIndex = index;
    this.currentTime = 0;
    this.loadCurrentTrack();
    
    if (this.settings.autoplay) {
      this.play();
    }
  }

  /**
   * Seek to position in current track
   */
  seekTo(seconds: number): void {
    if (this.player && this.isReady) {
      this.player.seekTo(seconds);
      this.currentTime = seconds;
    }
  }

  /**
   * Set volume (0-100)
   */
  setVolume(volume: number): void {
    volume = Math.max(0, Math.min(100, volume));
    this.settings.volume = volume;
    
    if (this.player && this.isReady) {
      this.player.setVolume(volume);
    }

    this.emit('volumeChange', { volume });
    this.debouncedSaveState();
  }

  /**
   * Mute/unmute
   */
  toggleMute(): void {
    if (!this.player || !this.isReady) return;

    if (this.player.isMuted()) {
      this.player.unMute();
    } else {
      this.player.mute();
    }
  }

  /**
   * Toggle shuffle mode
   */
  toggleShuffle(): void {
    this.settings.shuffled = !this.settings.shuffled;
    
    if (this.settings.shuffled) {
      this.playlist.shuffleOrder = generateShuffleOrder(
        this.playlist.tracks.length,
        this.playlist.currentIndex
      );
    } else {
      this.playlist.shuffleOrder = undefined;
    }

    this.emit('settingsChange', { settings: this.settings });
    this.debouncedSaveState();
  }

  /**
   * Cycle through repeat modes
   */
  toggleRepeat(): void {
    const modes = [RepeatMode.NONE, RepeatMode.ALL, RepeatMode.ONE];
    const currentIndex = modes.indexOf(this.settings.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    this.settings.repeatMode = modes[nextIndex];
    
    this.emit('settingsChange', { settings: this.settings });
    this.debouncedSaveState();
  }

  /**
   * Clear playlist
   */
  clearPlaylist(): void {
    this.playlist.tracks = [];
    this.playlist.currentIndex = 0;
    this.playlist.shuffleOrder = undefined;
    this.stop();

    this.emit('playlistChange', { 
      playlist: this.playlist,
      action: 'clear',
    });

    this.debouncedSaveState();
  }

  // Getters
  getCurrentTrack(): Track | null {
    return this.playlist.tracks[this.playlist.currentIndex] || null;
  }

  getPlaylist(): Playlist {
    return { ...this.playlist };
  }

  getSettings(): PlayerSettings {
    return { ...this.settings };
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.player?.getDuration() || 0;
  }

  getProgress(): number {
    const duration = this.getDuration();
    return duration > 0 ? (this.currentTime / duration) * 100 : 0;
  }

  getVolume(): number {
    return this.settings.volume;
  }

  isPlaying(): boolean {
    return this.player?.getPlayerState() === PlayerState.PLAYING;
  }

  isPaused(): boolean {
    return this.player?.getPlayerState() === PlayerState.PAUSED;
  }

  isMuted(): boolean {
    return this.player?.isMuted() || false;
  }

  // Event handling
  on(event: PlayerEventType, handler: EventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(handler);
  }

  off(event: PlayerEventType, handler: EventHandler): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: PlayerEventType, data: any): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.warn('Event handler error:', error);
        }
      });
    }
  }

  private handleError(error: PlayerError): void {
    console.error('Player error:', error);
    this.emit('error', error);
  }

  // State persistence
  private saveCurrentState(): void {
    if (!this.storage) return;

    const state: PlayerStateData = {
      playlist: this.playlist,
      currentTime: this.currentTime,
      settings: this.settings,
      lastUpdated: new Date(),
    };

    this.storage.saveState(state);
  }

  private loadStoredState(): void {
    if (!this.storage) return;

    const state = this.storage.loadState();
    if (state) {
      this.playlist = state.playlist;
      this.currentTime = state.currentTime;
      this.settings = state.settings;
    }
  }

  /**
   * Destroy player and clean up
   */
  destroy(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    
    this.eventListeners.clear();
    this.isReady = false;
  }
} 