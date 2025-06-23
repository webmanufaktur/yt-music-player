import { URLValidationResult, YouTubeAPIState, ErrorType, PlayerError } from '../types';

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): URLValidationResult {
  const patterns = [
    // Standard YouTube URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube mobile URLs
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube shortened URLs with additional parameters
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Direct video ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  // Clean the URL
  const cleanUrl = url.trim();

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return {
        isValid: true,
        videoId: match[1],
      };
    }
  }

  return {
    isValid: false,
    error: 'Invalid YouTube URL or Video ID',
  };
}

/**
 * Validates if a string is a valid YouTube URL or video ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url).isValid;
}

/**
 * Generates thumbnail URL for a YouTube video
 */
export function getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * YouTube API management
 */
class YouTubeAPIManager {
  private state: YouTubeAPIState = {
    loaded: false,
    loading: false,
  };

  private loadPromise: Promise<void> | null = null;
  private callbacks: (() => void)[] = [];

  /**
   * Load the YouTube IFrame API
   */
  async loadAPI(): Promise<void> {
    if (this.state.loaded) {
      return Promise.resolve();
    }

    if (this.state.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.state.loading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        this.state.loaded = true;
        this.state.loading = false;
        resolve();
        return;
      }

      // Set up global callback
      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        this.state.loaded = true;
        this.state.loading = false;
        
        // Execute any pending callbacks
        this.callbacks.forEach(callback => callback());
        this.callbacks = [];

        // Call original callback if it existed
        if (originalCallback) {
          originalCallback();
        }

        resolve();
      };

      // Create and append script tag
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => {
        this.state.loading = false;
        this.state.error = 'Failed to load YouTube API';
        reject(new Error('Failed to load YouTube API'));
      };

      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.state.loading) {
          this.state.loading = false;
          this.state.error = 'YouTube API load timeout';
          reject(new Error('YouTube API load timeout'));
        }
      }, 10000);
    });

    return this.loadPromise;
  }

  /**
   * Check if API is ready
   */
  isReady(): boolean {
    return this.state.loaded && !!(window.YT && window.YT.Player);
  }

  /**
   * Wait for API to be ready
   */
  async waitForReady(): Promise<void> {
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
  getState(): YouTubeAPIState {
    return { ...this.state };
  }
}

// Singleton instance
export const youtubeAPI = new YouTubeAPIManager();

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(part => parseInt(part, 10)).filter(num => !isNaN(num));
  
  if (parts.length === 2) {
    // MM:SS
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    // HH:MM:SS
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  
  return 0;
}

/**
 * Create a PlayerError from YouTube API error codes
 */
export function createPlayerError(errorCode: number, videoId?: string): PlayerError {
  const errorMap: Record<number, { type: ErrorType; message: string }> = {
    2: {
      type: ErrorType.INVALID_VIDEO_ID,
      message: 'The video ID is invalid or contains invalid characters.',
    },
    5: {
      type: ErrorType.API_ERROR,
      message: 'The requested content cannot be played in an HTML5 player.',
    },
    100: {
      type: ErrorType.VIDEO_NOT_FOUND,
      message: 'The video was not found or has been removed.',
    },
    101: {
      type: ErrorType.VIDEO_NOT_EMBEDDABLE,
      message: 'The video owner does not allow it to be played in embedded players.',
    },
    150: {
      type: ErrorType.VIDEO_NOT_EMBEDDABLE,
      message: 'The video owner does not allow it to be played in embedded players.',
    },
  };

  const errorInfo = errorMap[errorCode] || {
    type: ErrorType.API_ERROR,
    message: `Unknown YouTube API error: ${errorCode}`,
  };

  return {
    type: errorInfo.type,
    message: errorInfo.message,
    ...(videoId && { videoId }),
    originalError: errorCode,
  };
}

/**
 * Generate a random shuffle order for playlist
 */
export function generateShuffleOrder(length: number, currentIndex?: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  // If current index is provided, ensure it's first in the shuffle order
  if (currentIndex !== undefined && currentIndex >= 0 && currentIndex < length) {
    const currentPos = order.indexOf(currentIndex);
    if (currentPos > 0) {
      [order[0], order[currentPos]] = [order[currentPos], order[0]];
    }
  }

  return order;
}

/**
 * Debounce function for limiting API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
} 