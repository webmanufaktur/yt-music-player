import { StorageManager, PlayerStateData, ErrorType, PlayerError } from '../types';

/**
 * LocalStorage implementation of StorageManager
 */
export class LocalStorageManager implements StorageManager {
  private readonly prefix: string;

  constructor(prefix = 'ytMusicPlayer') {
    this.prefix = prefix;
  }

  /**
   * Save data to localStorage
   */
  save(key: string, data: any): void {
    try {
      const serialized = JSON.stringify(data);
      const fullKey = this.getFullKey(key);
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      throw new Error(`Storage save failed: ${error}`);
    }
  }

  /**
   * Load data from localStorage
   */
  load<T>(key: string): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clear all items with the current prefix
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getUsageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      // Estimate storage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += key.length + (value?.length || 0);
        }
      }

      // Most browsers have ~5-10MB localStorage limit
      const estimated = 5 * 1024 * 1024; // 5MB
      const percentage = (used / estimated) * 100;

      return {
        used,
        available: estimated - used,
        percentage: Math.min(percentage, 100),
      };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
}

/**
 * Player-specific storage manager
 */
export class PlayerStorageManager {
  private storage: StorageManager;
  private readonly stateKey = 'playerState';

  constructor(storage?: StorageManager, prefix = 'ytMusicPlayer') {
    this.storage = storage || new LocalStorageManager(prefix);
  }

  /**
   * Save complete player state
   */
  saveState(state: PlayerStateData): void {
    try {
      // Create a serializable version of the state
      const serializableState = {
        ...state,
        lastUpdated: state.lastUpdated.toISOString(),
        playlist: {
          ...state.playlist,
          tracks: state.playlist.tracks.map(track => ({
            ...track,
            addedAt: track.addedAt.toISOString(),
          })),
        },
      };

      this.storage.save(this.stateKey, serializableState);
    } catch (error) {
      console.warn('Failed to save player state:', error);
    }
  }

  /**
   * Load complete player state
   */
  loadState(): PlayerStateData | null {
    try {
      const state = this.storage.load<any>(this.stateKey);
      if (!state) {
        return null;
      }

      // Convert string dates back to Date objects
      return {
        ...state,
        lastUpdated: new Date(state.lastUpdated),
        playlist: {
          ...state.playlist,
          tracks: state.playlist.tracks.map((track: any) => ({
            ...track,
            addedAt: new Date(track.addedAt),
          })),
        },
      };
    } catch (error) {
      console.warn('Failed to load player state:', error);
      return null;
    }
  }

  /**
   * Save only playlist data
   */
  savePlaylist(playlist: PlayerStateData['playlist']): void {
    try {
      const state = this.loadState();
      if (state) {
        state.playlist = playlist;
        state.lastUpdated = new Date();
        this.saveState(state);
      }
    } catch (error) {
      console.warn('Failed to save playlist:', error);
    }
  }

  /**
   * Save only current playback position
   */
  saveCurrentTime(currentTime: number): void {
    try {
      const state = this.loadState();
      if (state) {
        state.currentTime = currentTime;
        state.lastUpdated = new Date();
        this.saveState(state);
      }
    } catch (error) {
      console.warn('Failed to save current time:', error);
    }
  }

  /**
   * Save only player settings
   */
  saveSettings(settings: PlayerStateData['settings']): void {
    try {
      const state = this.loadState();
      if (state) {
        state.settings = settings;
        state.lastUpdated = new Date();
        this.saveState(state);
      }
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }

  /**
   * Clear all stored data
   */
  clearState(): void {
    try {
      this.storage.remove(this.stateKey);
    } catch (error) {
      console.warn('Failed to clear player state:', error);
    }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    if (this.storage instanceof LocalStorageManager) {
      return this.storage.isAvailable();
    }
    return true; // Assume other storage implementations are available
  }

  /**
   * Migrate data from old format to new format
   */
  migrateData(oldKey = 'ytMusicPlayer'): boolean {
    try {
      const oldData = localStorage.getItem(oldKey);
      if (!oldData) {
        return false;
      }

      const parsed = JSON.parse(oldData);
      
      // Convert old format to new format if needed
      if (parsed && typeof parsed === 'object') {
        // This is where you'd handle migration logic
        // For now, we'll assume the format is compatible
        this.storage.save(this.stateKey, parsed);
        localStorage.removeItem(oldKey);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to migrate data:', error);
      return false;
    }
  }
}

// Default export
export const defaultStorage = new PlayerStorageManager(); 