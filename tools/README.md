# YouTube Playlist Importer

This tool imports **complete** public YouTube playlists using `yt-dlp` and converts them to the JSON format expected by the YouTube Music Player.

## Requirements

- `yt-dlp` must be installed on your system
- Install with: `pip install yt-dlp` or `sudo apt install yt-dlp`

## Quick Start

```bash
# Easy workflow - use npm script
npm run import PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR

# With custom name
npm run import PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR my-playlist

# Direct node command
node tools/import-playlist.js PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR
```

## Advanced Usage

```bash
# Import specific playlist with custom name
node tools/import-playlist.js PLyour-playlist-id-here custom-name

# The tool will auto-generate names from playlist titles
npm run import PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR
# Creates: playlist-finest-music.json (from "Finest Music" title)
```

## How it works

1. **Checks yt-dlp**: Validates that yt-dlp is available
2. **Fetches playlist title**: Gets the actual playlist name for better file naming
3. **Downloads metadata**: Uses `yt-dlp --flat-playlist --print-json` to get **all** videos
4. **Smart parsing**: Extracts artist/song names and detects genres from titles
5. **Generates JSON**: Creates playlist file in correct format

## Key Improvements

✅ **Complete playlists**: Gets **all** videos (105+ tracks), not just recent 15  
✅ **Smart naming**: Auto-generates names from playlist titles  
✅ **Better parsing**: Enhanced artist/song separation and genre detection  
✅ **Error handling**: Validates yt-dlp availability and playlist access  
✅ **Progress feedback**: Shows import progress and track counts  

## Output Format

```json
[
  {
    "id": "dUNuKP04y0w",
    "title": "The Ultimate Oldschool Hardcore Gabber Experience", 
    "artist": "Hardstyleofchoice",
    "tags": ["2024", "hardcore", "gabber"]
  }
]
```

## Default Playlist Configuration

Mark any playlist as default in `index.html`:

```javascript
const availablePlaylists = [
    { id: 'remote', name: '🎵 Finest Music', file: 'playlist-remote.json', default: true },
    { id: 'bangers', name: '🔥 Bangers', file: 'playlist-bangers.json' },
    { id: 'mash', name: '🎵 Mash', file: 'playlist-mash.json' }
];
```

The app will automatically load the playlist marked with `default: true`.

## Workflow Integration

After importing, the tool provides the exact code to add to your `availablePlaylists` array:

```bash
💡 Add this playlist to your index.html availablePlaylists array:
   { id: 'finest-music', name: '🎵 Finest Music', file: 'playlist-finest-music.json' }
```

## Troubleshooting

- **"yt-dlp is not available"**: Install with `pip install yt-dlp`
- **"No videos found"**: Check playlist ID and ensure it's public
- **Network errors**: Some playlists may have regional restrictions

## Re-importing Playlists

To update a playlist with new videos:

```bash
npm run import PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR
```

The tool will overwrite the existing file with updated content.