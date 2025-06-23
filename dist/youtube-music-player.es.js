var PlayerState = /* @__PURE__ */ ((PlayerState2) => {
  PlayerState2[PlayerState2["UNSTARTED"] = -1] = "UNSTARTED";
  PlayerState2[PlayerState2["ENDED"] = 0] = "ENDED";
  PlayerState2[PlayerState2["PLAYING"] = 1] = "PLAYING";
  PlayerState2[PlayerState2["PAUSED"] = 2] = "PAUSED";
  PlayerState2[PlayerState2["BUFFERING"] = 3] = "BUFFERING";
  PlayerState2[PlayerState2["CUED"] = 5] = "CUED";
  return PlayerState2;
})(PlayerState || {});
var RepeatMode = /* @__PURE__ */ ((RepeatMode2) => {
  RepeatMode2["NONE"] = "none";
  RepeatMode2["ONE"] = "one";
  RepeatMode2["ALL"] = "all";
  return RepeatMode2;
})(RepeatMode || {});
var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["INVALID_VIDEO_ID"] = "INVALID_VIDEO_ID";
  ErrorType2["VIDEO_NOT_FOUND"] = "VIDEO_NOT_FOUND";
  ErrorType2["VIDEO_NOT_EMBEDDABLE"] = "VIDEO_NOT_EMBEDDABLE";
  ErrorType2["NETWORK_ERROR"] = "NETWORK_ERROR";
  ErrorType2["API_ERROR"] = "API_ERROR";
  ErrorType2["STORAGE_ERROR"] = "STORAGE_ERROR";
  return ErrorType2;
})(ErrorType || {});
function extractVideoId(url) {
  const patterns = [
    // Standard YouTube URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube mobile URLs
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube shortened URLs with additional parameters
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Direct video ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/
  ];
  const cleanUrl = url.trim();
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return {
        isValid: true,
        videoId: match[1]
      };
    }
  }
  return {
    isValid: false,
    error: "Invalid YouTube URL or Video ID"
  };
}
function isValidYouTubeUrl(url) {
  return extractVideoId(url).isValid;
}
function getThumbnailUrl(videoId, quality = "medium") {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    standard: "sddefault",
    maxres: "maxresdefault"
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
class YouTubeAPIManager {
  constructor() {
    this.state = {
      loaded: false,
      loading: false
    };
    this.loadPromise = null;
    this.callbacks = [];
  }
  /**
   * Load the YouTube IFrame API
   */
  async loadAPI() {
    if (this.state.loaded) {
      return Promise.resolve();
    }
    if (this.state.loading && this.loadPromise) {
      return this.loadPromise;
    }
    this.state.loading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        this.state.loaded = true;
        this.state.loading = false;
        resolve();
        return;
      }
      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        this.state.loaded = true;
        this.state.loading = false;
        this.callbacks.forEach((callback) => callback());
        this.callbacks = [];
        if (originalCallback) {
          originalCallback();
        }
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        this.state.loading = false;
        this.state.error = "Failed to load YouTube API";
        reject(new Error("Failed to load YouTube API"));
      };
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
      setTimeout(() => {
        if (this.state.loading) {
          this.state.loading = false;
          this.state.error = "YouTube API load timeout";
          reject(new Error("YouTube API load timeout"));
        }
      }, 1e4);
    });
    return this.loadPromise;
  }
  /**
   * Check if API is ready
   */
  isReady() {
    return this.state.loaded && !!(window.YT && window.YT.Player);
  }
  /**
   * Wait for API to be ready
   */
  async waitForReady() {
    if (this.isReady()) {
      return Promise.resolve();
    }
    if (!this.state.loading && !this.state.loaded) {
      await this.loadAPI();
    }
    return new Promise((resolve) => {
      if (this.isReady()) {
        resolve();
        return;
      }
      this.callbacks.push(resolve);
    });
  }
  /**
   * Get current API state
   */
  getState() {
    return { ...this.state };
  }
}
const youtubeAPI = new YouTubeAPIManager();
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
function parseTime(timeString) {
  const parts = timeString.split(":").map((part) => parseInt(part, 10)).filter((num) => !isNaN(num));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 0;
}
function createPlayerError(errorCode, videoId) {
  const errorMap = {
    2: {
      type: ErrorType.INVALID_VIDEO_ID,
      message: "The video ID is invalid or contains invalid characters."
    },
    5: {
      type: ErrorType.API_ERROR,
      message: "The requested content cannot be played in an HTML5 player."
    },
    100: {
      type: ErrorType.VIDEO_NOT_FOUND,
      message: "The video was not found or has been removed."
    },
    101: {
      type: ErrorType.VIDEO_NOT_EMBEDDABLE,
      message: "The video owner does not allow it to be played in embedded players."
    },
    150: {
      type: ErrorType.VIDEO_NOT_EMBEDDABLE,
      message: "The video owner does not allow it to be played in embedded players."
    }
  };
  const errorInfo = errorMap[errorCode] || {
    type: ErrorType.API_ERROR,
    message: `Unknown YouTube API error: ${errorCode}`
  };
  return {
    type: errorInfo.type,
    message: errorInfo.message,
    ...videoId && { videoId },
    originalError: errorCode
  };
}
function generateShuffleOrder(length, currentIndex) {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (currentIndex !== void 0 && currentIndex >= 0 && currentIndex < length) {
    const currentPos = order.indexOf(currentIndex);
    if (currentPos > 0) {
      [order[0], order[currentPos]] = [order[currentPos], order[0]];
    }
  }
  return order;
}
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}
class LocalStorageManager {
  constructor(prefix = "ytMusicPlayer") {
    this.prefix = prefix;
  }
  /**
   * Save data to localStorage
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      const fullKey = this.getFullKey(key);
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
      throw new Error(`Storage save failed: ${error}`);
    }
  }
  /**
   * Load data from localStorage
   */
  load(key) {
    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
      return null;
    }
  }
  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  }
  /**
   * Clear all items with the current prefix
   */
  clear() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ":")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  }
  /**
   * Check if localStorage is available
   */
  isAvailable() {
    try {
      const testKey = "__localStorage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get storage usage information
   */
  getUsageInfo() {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += key.length + ((value == null ? void 0 : value.length) || 0);
        }
      }
      const estimated = 5 * 1024 * 1024;
      const percentage = used / estimated * 100;
      return {
        used,
        available: estimated - used,
        percentage: Math.min(percentage, 100)
      };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
  /**
   * Get full key with prefix
   */
  getFullKey(key) {
    return `${this.prefix}:${key}`;
  }
}
class PlayerStorageManager {
  constructor(storage, prefix = "ytMusicPlayer") {
    this.stateKey = "playerState";
    this.storage = storage || new LocalStorageManager(prefix);
  }
  /**
   * Save complete player state
   */
  saveState(state) {
    try {
      const serializableState = {
        ...state,
        lastUpdated: state.lastUpdated.toISOString(),
        playlist: {
          ...state.playlist,
          tracks: state.playlist.tracks.map((track) => ({
            ...track,
            addedAt: track.addedAt.toISOString()
          }))
        }
      };
      this.storage.save(this.stateKey, serializableState);
    } catch (error) {
      console.warn("Failed to save player state:", error);
    }
  }
  /**
   * Load complete player state
   */
  loadState() {
    try {
      const state = this.storage.load(this.stateKey);
      if (!state) {
        return null;
      }
      return {
        ...state,
        lastUpdated: new Date(state.lastUpdated),
        playlist: {
          ...state.playlist,
          tracks: state.playlist.tracks.map((track) => ({
            ...track,
            addedAt: new Date(track.addedAt)
          }))
        }
      };
    } catch (error) {
      console.warn("Failed to load player state:", error);
      return null;
    }
  }
  /**
   * Save only playlist data
   */
  savePlaylist(playlist) {
    try {
      const state = this.loadState();
      if (state) {
        state.playlist = playlist;
        state.lastUpdated = /* @__PURE__ */ new Date();
        this.saveState(state);
      }
    } catch (error) {
      console.warn("Failed to save playlist:", error);
    }
  }
  /**
   * Save only current playback position
   */
  saveCurrentTime(currentTime) {
    try {
      const state = this.loadState();
      if (state) {
        state.currentTime = currentTime;
        state.lastUpdated = /* @__PURE__ */ new Date();
        this.saveState(state);
      }
    } catch (error) {
      console.warn("Failed to save current time:", error);
    }
  }
  /**
   * Save only player settings
   */
  saveSettings(settings) {
    try {
      const state = this.loadState();
      if (state) {
        state.settings = settings;
        state.lastUpdated = /* @__PURE__ */ new Date();
        this.saveState(state);
      }
    } catch (error) {
      console.warn("Failed to save settings:", error);
    }
  }
  /**
   * Clear all stored data
   */
  clearState() {
    try {
      this.storage.remove(this.stateKey);
    } catch (error) {
      console.warn("Failed to clear player state:", error);
    }
  }
  /**
   * Check if storage is available
   */
  isStorageAvailable() {
    if (this.storage instanceof LocalStorageManager) {
      return this.storage.isAvailable();
    }
    return true;
  }
  /**
   * Migrate data from old format to new format
   */
  migrateData(oldKey = "ytMusicPlayer") {
    try {
      const oldData = localStorage.getItem(oldKey);
      if (!oldData) {
        return false;
      }
      const parsed = JSON.parse(oldData);
      if (parsed && typeof parsed === "object") {
        this.storage.save(this.stateKey, parsed);
        localStorage.removeItem(oldKey);
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to migrate data:", error);
      return false;
    }
  }
}
const defaultStorage = new PlayerStorageManager();
class YouTubeMusicPlayer {
  constructor(config) {
    this.player = null;
    this.playlist = {
      tracks: [],
      currentIndex: 0,
      shuffled: false
    };
    this.settings = {
      volume: 80,
      repeatMode: RepeatMode.ALL,
      shuffled: false,
      autoplay: false
    };
    this.currentTime = 0;
    this.isReady = false;
    this.eventListeners = /* @__PURE__ */ new Map();
    this.containerId = config.containerId;
    this.storage = config.saveState !== false ? defaultStorage : new PlayerStorageManager();
    if (config.volume !== void 0) this.settings.volume = config.volume;
    if (config.repeat !== void 0) this.settings.repeatMode = config.repeat;
    if (config.shuffle !== void 0) this.settings.shuffled = config.shuffle;
    if (config.autoplay !== void 0) this.settings.autoplay = config.autoplay;
    this.debouncedSaveState = debounce(() => this.saveCurrentState(), 1e3);
    this.debouncedTimeUpdate = debounce(() => this.debouncedSaveState(), 2e3);
    this.initialize();
  }
  /**
   * Initialize the player
   */
  async initialize() {
    try {
      this.loadStoredState();
      await youtubeAPI.waitForReady();
      this.ensureContainer();
      this.createPlayer();
      this.emit("ready", { player: this });
    } catch (error) {
      this.handleError({
        type: ErrorType.API_ERROR,
        message: "Failed to initialize player",
        originalError: error
      });
    }
  }
  /**
   * Ensure player container exists
   */
  ensureContainer() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      container.style.cssText = "width: 0; height: 0; overflow: hidden; position: absolute;";
      document.body.appendChild(container);
    }
  }
  /**
   * Create YouTube player instance
   */
  createPlayer() {
    const playerOptions = {
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
        origin: window.location.origin
        // Fix for localhost CORS issues
      },
      events: {
        onReady: (event) => this.handlePlayerReady(event),
        onStateChange: (event) => this.handlePlayerStateChange(event),
        onError: (event) => this.handlePlayerError(event)
      }
    };
    this.player = new window.YT.Player(this.containerId, playerOptions);
  }
  /**
   * Handle player ready event
   */
  handlePlayerReady(event) {
    var _a;
    this.isReady = true;
    (_a = this.player) == null ? void 0 : _a.setVolume(this.settings.volume);
    this.startTimeMonitoring();
    if (this.playlist.tracks.length > 0) {
      this.loadCurrentTrack();
    }
    this.emit("ready", { player: this });
  }
  /**
   * Handle player state changes
   */
  handlePlayerStateChange(event) {
    const state = event.data;
    this.emit("stateChange", {
      state,
      isPlaying: state === PlayerState.PLAYING,
      isPaused: state === PlayerState.PAUSED,
      isEnded: state === PlayerState.ENDED
    });
    if (state === PlayerState.ENDED) {
      this.handleTrackEnded();
    }
    if (state === PlayerState.PLAYING) {
      this.debouncedSaveState();
    }
  }
  /**
   * Handle YouTube API errors
   */
  handlePlayerError(event) {
    const errorCode = event.data;
    const currentTrack = this.getCurrentTrack();
    const error = createPlayerError(errorCode, currentTrack == null ? void 0 : currentTrack.id);
    this.handleError(error);
    if ([100, 101, 150].includes(errorCode) && this.playlist.tracks.length > 1) {
      this.next();
    }
  }
  /**
   * Handle track ended
   */
  handleTrackEnded() {
    if (this.settings.repeatMode === RepeatMode.ONE) {
      this.seekTo(0);
      this.play();
    } else {
      this.next();
    }
  }
  /**
   * Start time monitoring
   */
  startTimeMonitoring() {
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
  handleTimeUpdate() {
    this.emit("timeUpdate", {
      currentTime: this.currentTime,
      duration: this.getDuration(),
      progress: this.getProgress()
    });
    this.debouncedTimeUpdate();
  }
  /**
   * Add a track to the playlist
   */
  async addTrack(url, title) {
    const validation = extractVideoId(url);
    if (!validation.isValid || !validation.videoId) {
      this.handleError({
        type: ErrorType.INVALID_VIDEO_ID,
        message: "Invalid YouTube URL"
      });
      return null;
    }
    const track = {
      id: validation.videoId,
      title: title || `Video ${validation.videoId}`,
      duration: 0,
      // Will be updated when video loads
      thumbnail: getThumbnailUrl(validation.videoId),
      url,
      addedAt: /* @__PURE__ */ new Date()
    };
    this.playlist.tracks.push(track);
    if (this.playlist.tracks.length === 1) {
      this.playlist.currentIndex = 0;
      this.loadCurrentTrack();
    }
    this.emit("playlistChange", {
      playlist: this.playlist,
      action: "add",
      track
    });
    this.debouncedSaveState();
    return track;
  }
  /**
   * Add a track with enhanced metadata
   */
  async addTrackWithMetadata(trackData) {
    const track = {
      id: trackData.id,
      title: trackData.title,
      artist: trackData.artist,
      tags: trackData.tags,
      duration: 0,
      // Will be fetched from YouTube when the video loads
      thumbnail: getThumbnailUrl(trackData.id),
      url: `https://youtu.be/${trackData.id}`,
      addedAt: /* @__PURE__ */ new Date()
    };
    this.playlist.tracks.push(track);
    if (this.playlist.tracks.length === 1) {
      this.playlist.currentIndex = 0;
      this.loadCurrentTrack();
    }
    this.emit("playlistChange", {
      playlist: this.playlist,
      action: "add",
      track
    });
    this.debouncedSaveState();
    return track;
  }
  /**
   * Remove track from playlist
   */
  removeTrack(index) {
    if (index < 0 || index >= this.playlist.tracks.length) {
      return false;
    }
    const removedTrack = this.playlist.tracks[index];
    this.playlist.tracks.splice(index, 1);
    if (index < this.playlist.currentIndex) {
      this.playlist.currentIndex--;
    } else if (index === this.playlist.currentIndex) {
      if (this.playlist.tracks.length === 0) {
        this.playlist.currentIndex = 0;
        this.stop();
      } else {
        if (this.playlist.currentIndex >= this.playlist.tracks.length) {
          this.playlist.currentIndex = 0;
        }
        this.loadCurrentTrack();
      }
    }
    this.emit("playlistChange", {
      playlist: this.playlist,
      action: "remove",
      track: removedTrack,
      index
    });
    this.debouncedSaveState();
    return true;
  }
  /**
   * Load current track into player
   */
  loadCurrentTrack() {
    const track = this.getCurrentTrack();
    if (!track || !this.player || !this.isReady) {
      return;
    }
    this.player.loadVideoById(track.id, this.currentTime);
    this.emit("trackChange", {
      track,
      index: this.playlist.currentIndex,
      playlist: this.playlist
    });
  }
  /**
   * Play current track
   */
  play() {
    if (this.player && this.isReady) {
      this.player.playVideo();
    }
  }
  /**
   * Pause current track
   */
  pause() {
    if (this.player && this.isReady) {
      this.player.pauseVideo();
    }
  }
  /**
   * Stop playback
   */
  stop() {
    if (this.player && this.isReady) {
      this.player.stopVideo();
      this.currentTime = 0;
    }
  }
  /**
   * Toggle play/pause
   */
  togglePlay() {
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
  next() {
    if (this.playlist.tracks.length === 0) return;
    let nextIndex;
    if (this.settings.shuffled && this.playlist.shuffleOrder) {
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
  previous() {
    if (this.playlist.tracks.length === 0) return;
    let prevIndex;
    if (this.settings.shuffled && this.playlist.shuffleOrder) {
      const currentShufflePos = this.playlist.shuffleOrder.indexOf(this.playlist.currentIndex);
      const prevShufflePos = currentShufflePos === 0 ? this.playlist.shuffleOrder.length - 1 : currentShufflePos - 1;
      prevIndex = this.playlist.shuffleOrder[prevShufflePos];
    } else {
      prevIndex = this.playlist.currentIndex === 0 ? this.playlist.tracks.length - 1 : this.playlist.currentIndex - 1;
    }
    this.jumpToTrack(prevIndex);
  }
  /**
   * Jump to specific track
   */
  jumpToTrack(index) {
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
  seekTo(seconds) {
    if (this.player && this.isReady) {
      this.player.seekTo(seconds);
      this.currentTime = seconds;
    }
  }
  /**
   * Set volume (0-100)
   */
  setVolume(volume) {
    volume = Math.max(0, Math.min(100, volume));
    this.settings.volume = volume;
    if (this.player && this.isReady) {
      this.player.setVolume(volume);
    }
    this.emit("volumeChange", { volume });
    this.debouncedSaveState();
  }
  /**
   * Mute/unmute
   */
  toggleMute() {
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
  toggleShuffle() {
    this.settings.shuffled = !this.settings.shuffled;
    if (this.settings.shuffled) {
      this.playlist.shuffleOrder = generateShuffleOrder(
        this.playlist.tracks.length,
        this.playlist.currentIndex
      );
    } else {
      this.playlist.shuffleOrder = void 0;
    }
    this.emit("settingsChange", { settings: this.settings });
    this.debouncedSaveState();
  }
  /**
   * Cycle through repeat modes
   */
  toggleRepeat() {
    const modes = [RepeatMode.NONE, RepeatMode.ALL, RepeatMode.ONE];
    const currentIndex = modes.indexOf(this.settings.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.settings.repeatMode = modes[nextIndex];
    this.emit("settingsChange", { settings: this.settings });
    this.debouncedSaveState();
  }
  /**
   * Clear playlist
   */
  clearPlaylist() {
    this.playlist.tracks = [];
    this.playlist.currentIndex = 0;
    this.playlist.shuffleOrder = void 0;
    this.stop();
    this.emit("playlistChange", {
      playlist: this.playlist,
      action: "clear"
    });
    this.debouncedSaveState();
  }
  // Getters
  getCurrentTrack() {
    return this.playlist.tracks[this.playlist.currentIndex] || null;
  }
  getPlaylist() {
    return { ...this.playlist };
  }
  getSettings() {
    return { ...this.settings };
  }
  getCurrentTime() {
    return this.currentTime;
  }
  getDuration() {
    var _a;
    return ((_a = this.player) == null ? void 0 : _a.getDuration()) || 0;
  }
  getProgress() {
    const duration = this.getDuration();
    return duration > 0 ? this.currentTime / duration * 100 : 0;
  }
  getVolume() {
    return this.settings.volume;
  }
  isPlaying() {
    var _a;
    return ((_a = this.player) == null ? void 0 : _a.getPlayerState()) === PlayerState.PLAYING;
  }
  isPaused() {
    var _a;
    return ((_a = this.player) == null ? void 0 : _a.getPlayerState()) === PlayerState.PAUSED;
  }
  isMuted() {
    var _a;
    return ((_a = this.player) == null ? void 0 : _a.isMuted()) || false;
  }
  // Event handling
  on(event, handler) {
    var _a;
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    (_a = this.eventListeners.get(event)) == null ? void 0 : _a.push(handler);
  }
  off(event, handler) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  emit(event, data) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.warn("Event handler error:", error);
        }
      });
    }
  }
  handleError(error) {
    console.error("Player error:", error);
    this.emit("error", error);
  }
  // State persistence
  saveCurrentState() {
    if (!this.storage) return;
    const state = {
      playlist: this.playlist,
      currentTime: this.currentTime,
      settings: this.settings,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.storage.saveState(state);
  }
  loadStoredState() {
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
  destroy() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.eventListeners.clear();
    this.isReady = false;
  }
}
export {
  ErrorType,
  LocalStorageManager,
  PlayerState,
  PlayerStorageManager,
  RepeatMode,
  YouTubeMusicPlayer,
  YouTubeMusicPlayer as default,
  defaultStorage,
  extractVideoId,
  formatTime,
  getThumbnailUrl,
  isValidYouTubeUrl,
  parseTime,
  youtubeAPI
};
//# sourceMappingURL=youtube-music-player.es.js.map
