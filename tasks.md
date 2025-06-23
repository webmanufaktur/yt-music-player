# YouTube Music Player - Development Plan & Tasks

## Project Overview

Create a feature-rich YouTube music player that:

- Plays audio-only from YouTube videos using official YouTube APIs
- Provides full music player functionality (play/pause, next/prev, seek)
- Manages playlists with auto-advance and looping
- Stores progress and current track in localStorage
- Works cross-platform in JavaScript for embedding in websites (including PHP)
- Written in TypeScript and compiled to JavaScript

## Research Findings

### Technical Approach

Based on research, the best approach is to use the **YouTube IFrame Player API** which:

- ✅ Is officially supported by Google/YouTube
- ✅ Works on all modern browsers including mobile
- ✅ Provides full player control via JavaScript API
- ✅ Can be hidden (0x0 pixels) for audio-only experience
- ✅ Handles all copyright and licensing automatically
- ✅ No server-side audio extraction needed (stays within ToS)

### Key Technical Insights

1. **Audio-Only Implementation**: Set player dimensions to 0x0 pixels and control via API
2. **Cross-Platform**: Works in all browsers that support postMessage (all modern browsers)
3. **Mobile Support**: Full support on mobile devices via official API
4. **No Copyright Issues**: Uses official YouTube player, respects all licensing
5. **Performance**: Lightweight, uses YouTube's CDN and infrastructure

## Task Breakdown

### Phase 1: Project Setup & Architecture

- [ ] **1.1** Initialize TypeScript project structure

  - [ ] Setup TypeScript configuration
  - [ ] Configure build system (webpack/rollup/vite)
  - [ ] Setup ESLint and Prettier
  - [ ] Create source and dist directories

- [ ] **1.2** Define project architecture
  - [ ] Create core player class structure
  - [ ] Design playlist management system
  - [ ] Plan localStorage integration
  - [ ] Define TypeScript interfaces/types

### Phase 2: Core YouTube Player Integration

- [ ] **2.1** Implement YouTube IFrame API integration

  - [ ] Load YouTube IFrame API script
  - [ ] Create player instance with 0x0 dimensions
  - [ ] Implement onYouTubeIframeAPIReady callback
  - [ ] Handle player ready and state change events

- [ ] **2.2** Create basic player controls

  - [ ] Play/Pause functionality
  - [ ] Volume controls (mute/unmute, setVolume)
  - [ ] Seek functionality (getCurrentTime, seekTo)
  - [ ] Player state management

- [ ] **2.3** YouTube URL/ID parsing
  - [ ] Extract video ID from various YouTube URL formats
  - [ ] Validate YouTube URLs
  - [ ] Handle different URL patterns (youtube.com, youtu.be, etc.)

### Phase 3: Playlist Management

- [ ] **3.1** Playlist data structure

  - [ ] Define playlist interface/type
  - [ ] Implement add/remove tracks
  - [ ] Track ordering and indexing
  - [ ] Playlist validation

- [ ] **3.2** Playlist navigation

  - [ ] Next track functionality
  - [ ] Previous track functionality
  - [ ] Jump to specific track (playVideoAt)
  - [ ] Auto-advance on track end
  - [ ] Loop playlist when reaching end

- [ ] **3.3** Advanced playlist features
  - [ ] Shuffle functionality
  - [ ] Repeat modes (none, one, all)
  - [ ] Playlist reordering
  - [ ] Clear playlist functionality

### Phase 4: User Interface

- [ ] **4.1** Basic player UI

  - [ ] Play/pause button with state indication
  - [ ] Progress bar with seek capability
  - [ ] Current time / total time display
  - [ ] Volume slider
  - [ ] Track information display

- [ ] **4.2** Playlist UI

  - [ ] Track list display
  - [ ] Current track highlighting
  - [ ] Add track input/button
  - [ ] Remove track functionality
  - [ ] Drag and drop reordering

- [ ] **4.3** Control buttons
  - [ ] Previous/Next track buttons
  - [ ] Shuffle toggle button
  - [ ] Repeat mode button (cycle through modes)
  - [ ] Clear playlist button

### Phase 5: Local Storage Integration

- [ ] **5.1** Persistence system

  - [ ] Save current playlist to localStorage
  - [ ] Save current track index
  - [ ] Save current playback position
  - [ ] Save player settings (volume, repeat mode, etc.)

- [ ] **5.2** State restoration

  - [ ] Load playlist on page load
  - [ ] Restore current track
  - [ ] Restore playback position
  - [ ] Restore player settings

- [ ] **5.3** Data management
  - [ ] Handle localStorage quota limits
  - [ ] Data cleanup and validation
  - [ ] Migration between data versions

### Phase 6: Error Handling & Edge Cases

- [ ] **6.1** YouTube API error handling

  - [ ] Video not found (404)
  - [ ] Video not embeddable (101/150)
  - [ ] Network errors
  - [ ] API loading failures

- [ ] **6.2** User experience improvements

  - [ ] Loading states and indicators
  - [ ] Error messages to user
  - [ ] Fallback behaviors
  - [ ] Graceful degradation

- [ ] **6.3** Browser compatibility
  - [ ] Test across different browsers
  - [ ] Handle older browser limitations
  - [ ] Mobile-specific considerations

### Phase 7: TypeScript to JavaScript Compilation

- [ ] **7.1** Build system optimization

  - [ ] Configure TypeScript compilation
  - [ ] Setup minification
  - [ ] Bundle optimization
  - [ ] Source map generation

- [ ] **7.2** Distribution packages
  - [ ] Create standalone JavaScript bundle
  - [ ] Create ES modules version
  - [ ] Create UMD version for broader compatibility
  - [ ] Generate TypeScript declaration files

### Phase 8: Testing & Documentation

- [ ] **8.1** Testing implementation

  - [ ] Unit tests for core functionality
  - [ ] Integration tests with YouTube API
  - [ ] Browser compatibility testing
  - [ ] Mobile device testing

- [ ] **8.2** Documentation
  - [ ] API documentation
  - [ ] Usage examples
  - [ ] Integration guide for PHP websites
  - [ ] Configuration options reference

### Phase 9: Optimization & Polish

- [ ] **9.1** Performance optimization

  - [ ] Lazy loading optimizations
  - [ ] Memory usage optimization
  - [ ] Bundle size optimization
  - [ ] Event listener cleanup

- [ ] **9.2** User experience polish
  - [ ] Smooth animations
  - [ ] Keyboard shortcuts
  - [ ] Accessibility improvements
  - [ ] Responsive design

## Technical Implementation Notes

### YouTube IFrame API Integration

```typescript
// Basic implementation structure
class YouTubeMusicPlayer {
  private player: YT.Player;
  private playlist: Track[] = [];
  private currentIndex: number = 0;

  async initialize(containerId: string) {
    // Load YouTube API and create player
  }

  async addTrack(youtubeUrl: string) {
    // Parse URL and add to playlist
  }

  play() {
    this.player.playVideo();
  }

  // ... other methods
}
```

### URL Parsing Patterns

Support these YouTube URL formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

### LocalStorage Structure

```json
{
  "ytMusicPlayer": {
    "playlist": [{ "id": "VIDEO_ID", "title": "Song Title", "duration": 240 }],
    "currentIndex": 0,
    "currentTime": 123.45,
    "settings": {
      "volume": 80,
      "repeatMode": "all",
      "shuffled": false
    }
  }
}
```

## Browser Compatibility Requirements

### Minimum Requirements

- Modern browsers with HTML5 support
- JavaScript ES2015+ features
- LocalStorage support
- Fetch API support

### Tested Browsers

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 70+

## Deployment Considerations

### For PHP Integration

1. Include compiled JavaScript bundle
2. Provide simple initialization script
3. Ensure HTTPS for YouTube API (required)
4. Handle same-origin policy considerations

### CDN Distribution

- Host on reliable CDN
- Provide multiple versions (dev/prod)
- Include integrity hashes
- Fallback to local copies

## Potential Challenges & Solutions

### Challenge 1: YouTube API Rate Limits

**Solution**: Implement smart caching and minimize API calls

### Challenge 2: Video Availability Changes

**Solution**: Implement retry logic and user notifications

### Challenge 3: Mobile Autoplay Restrictions

**Solution**: Require user interaction before first play, clear messaging

### Challenge 4: Large Playlist Performance

**Solution**: Virtual scrolling for UI, lazy loading of metadata

## Success Metrics

- [ ] Successfully plays audio from YouTube videos
- [ ] Playlist management works across browser sessions
- [ ] localStorage persistence works reliably
- [ ] Works on both desktop and mobile
- [ ] Easy integration into PHP websites
- [ ] TypeScript types provide good developer experience
- [ ] Bundle size < 100KB (gzipped)
- [ ] Works without server-side dependencies

## Timeline Estimate

- **Phase 1-2**: 1-2 weeks (Basic player functionality)
- **Phase 3-4**: 1-2 weeks (Playlist and UI)
- **Phase 5-6**: 1 week (Persistence and error handling)
- **Phase 7-8**: 1 week (Build system and testing)
- **Phase 9**: 1 week (Polish and optimization)

**Total Estimated Time**: 5-8 weeks for full implementation

## Next Steps

1. Set up the development environment
2. Create basic project structure
3. Implement core YouTube API integration
4. Build out playlist functionality incrementally
5. Add UI and polish iteratively

This approach ensures a working player early in development that can be progressively enhanced with additional features.
