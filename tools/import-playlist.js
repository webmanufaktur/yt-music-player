#!/usr/bin/env node

/**
 * YouTube Playlist Importer
 * 
 * Fetches a complete YouTube playlist using yt-dlp and converts it to 
 * the JSON format expected by the YouTube Music Player.
 * 
 * Usage:
 *   node tools/import-playlist.js PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR
 *   node tools/import-playlist.js PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR custom-name
 *   npm run import PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkYtDlpAvailability() {
  return new Promise((resolve) => {
    const process = spawn('yt-dlp', ['--version'], { stdio: 'pipe' });
    process.on('close', (code) => {
      resolve(code === 0);
    });
    process.on('error', () => {
      resolve(false);
    });
  });
}

function fetchPlaylistData(playlistId) {
  return new Promise((resolve, reject) => {
    const args = [
      '--flat-playlist',
      '--print-json',
      '--no-warnings',
      `https://www.youtube.com/playlist?list=${playlistId}`
    ];
    
    const process = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (error) => {
      reject(new Error(`Failed to execute yt-dlp: ${error.message}`));
    });
  });
}

function parsePlaylistData(stdout) {
  const videos = [];
  const lines = stdout.trim().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      
      if (data.id && data.title) {
        // Parse title to extract artist and song name
        const { artist, title, tags } = parseTitle(data.title, data.uploader || 'Unknown Artist');
        
        videos.push({
          id: data.id,
          title: title,
          artist: artist,
          tags: tags
        });
      }
    } catch (error) {
      console.warn('Failed to parse line:', line.substring(0, 100) + '...');
    }
  }
  
  return videos;
}

function parseTitle(rawTitle, channelName) {
  // Common patterns to identify artist and song
  const patterns = [
    // "Artist - Song Title"
    /^(.+?)\s*[-–—]\s*(.+)$/,
    // "Artist: Song Title"
    /^(.+?)\s*:\s*(.+)$/,
    // "Song Title by Artist"
    /^(.+?)\s+by\s+(.+)$/i,
    // "Artist | Song Title"
    /^(.+?)\s*\|\s*(.+)$/,
    // "Artist – Song Title" (different dash)
    /^(.+?)\s*–\s*(.+)$/,
  ];
  
  let artist = 'Unknown Artist';
  let title = rawTitle;
  let tags = ['2024']; // Default tag
  
  // Try to match patterns
  for (const pattern of patterns) {
    const match = rawTitle.match(pattern);
    if (match) {
      artist = match[1].trim();
      title = match[2].trim();
      break;
    }
  }
  
  // If no pattern matched, use channel name as artist (if not generic)
  if (artist === 'Unknown Artist' && channelName && !isGenericChannelName(channelName)) {
    artist = channelName;
  }
  
  // Clean up artist and title
  artist = cleanString(artist);
  title = cleanString(title);
  
  // Extract additional tags from title
  const titleLower = rawTitle.toLowerCase();
  
  // Content type tags
  if (titleLower.includes('remix')) tags.push('remix');
  if (titleLower.includes('edit')) tags.push('edit');
  if (titleLower.includes('official')) tags.push('official');
  if (titleLower.includes('music video')) tags.push('music video');
  if (titleLower.includes('lyrics')) tags.push('lyrics');
  if (titleLower.includes('live')) tags.push('live');
  if (titleLower.includes('acoustic')) tags.push('acoustic');
  if (titleLower.includes('cover')) tags.push('cover');
  if (titleLower.includes('bootleg')) tags.push('bootleg');
  if (titleLower.includes('mix') && !titleLower.includes('remix')) tags.push('mix');
  
  // Genre detection
  if (titleLower.includes('techno')) tags.push('techno');
  if (titleLower.includes('house')) tags.push('house');
  if (titleLower.includes('electronic')) tags.push('electronic');
  if (titleLower.includes('hardstyle')) tags.push('hardstyle');
  if (titleLower.includes('hardcore')) tags.push('hardcore');
  if (titleLower.includes('gabber')) tags.push('gabber');
  if (titleLower.includes('trance')) tags.push('trance');
  if (titleLower.includes('drum') && titleLower.includes('bass')) tags.push('drum and bass');
  if (titleLower.includes('dubstep')) tags.push('dubstep');
  if (titleLower.includes('pop')) tags.push('pop');
  if (titleLower.includes('rock')) tags.push('rock');
  if (titleLower.includes('hip hop') || titleLower.includes('rap')) tags.push('hip hop');
  if (titleLower.includes('jazz')) tags.push('jazz');
  if (titleLower.includes('classical')) tags.push('classical');
  if (titleLower.includes('frenchcore')) tags.push('frenchcore');
  if (titleLower.includes('hardtekk') || titleLower.includes('hard tekk')) tags.push('hardtekk');
  if (titleLower.includes('uptempo')) tags.push('uptempo');
  if (titleLower.includes('minimal')) tags.push('minimal');
  
  return { artist, title, tags };
}

function isGenericChannelName(channelName) {
  const genericNames = [
    'various artists', 'va', 'music', 'records', 'label', 'official',
    'topic', 'auto-generated', 'compilation', 'collection'
  ];
  
  const lowerName = channelName.toLowerCase();
  return genericNames.some(generic => lowerName.includes(generic));
}

function cleanString(str) {
  return str
    .replace(/[\[\](){}]/g, '') // Remove brackets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^["']+|["']+$/g, '') // Remove quotes
    .replace(/^[,\s]+|[,\s]+$/g, '') // Remove leading/trailing commas and spaces
    .trim();
}

function generatePlaylistName(playlistId, customName) {
  if (customName) {
    return customName;
  }
  
  // Generate a name based on playlist ID (fallback)
  return `playlist-${playlistId.slice(-8)}`;
}

async function getPlaylistTitle(playlistId) {
  try {
    const args = [
      '--no-download',
      '--print', '%(playlist_title)s',
      `https://www.youtube.com/playlist?list=${playlistId}`
    ];
    
    const process = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    let stdout = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    return new Promise((resolve) => {
      process.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          resolve(stdout.trim());
        } else {
          resolve(null);
        }
      });
      
      process.on('error', () => {
        resolve(null);
      });
    });
  } catch (error) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node import-playlist.js <PLAYLIST_ID> [OUTPUT_NAME]');
    console.error('       npm run import <PLAYLIST_ID> [OUTPUT_NAME]');
    console.error('');
    console.error('Examples:');
    console.error('  node tools/import-playlist.js PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR');
    console.error('  node tools/import-playlist.js PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR finest-music');
    console.error('  npm run import PLgHbFbnlci0Qq5yASCgE9416yvx7KwpnR');
    process.exit(1);
  }
  
  const playlistId = args[0];
  const customName = args[1];
  
  // Validate playlist ID format
  if (!playlistId.match(/^[A-Za-z0-9_-]+$/)) {
    console.error('❌ Invalid playlist ID format');
    process.exit(1);
  }
  
  try {
    // Check if yt-dlp is available
    console.log('🔍 Checking yt-dlp availability...');
    const ytDlpAvailable = await checkYtDlpAvailability();
    
    if (!ytDlpAvailable) {
      console.error('❌ yt-dlp is not available. Please install it:');
      console.error('   pip install yt-dlp');
      console.error('   or');
      console.error('   sudo apt install yt-dlp');
      process.exit(1);
    }
    
    console.log('✅ yt-dlp is available');
    
    // Get playlist title for better naming
    console.log('📋 Fetching playlist information...');
    const playlistTitle = await getPlaylistTitle(playlistId);
    
    // Generate output name
    const outputName = customName || (playlistTitle ? 
      playlistTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : 
      generatePlaylistName(playlistId)
    );
    
    const outputPath = path.join(__dirname, '..', 'public', `playlist-${outputName}.json`);
    
    console.log(`🎵 Importing playlist: ${playlistTitle || playlistId}`);
    console.log(`📁 Output file: playlist-${outputName}.json`);
    
    // Fetch playlist data
    console.log('⬇️ Downloading playlist metadata...');
    const { stdout, stderr } = await fetchPlaylistData(playlistId);
    
    // Show warning if there are hidden videos
    if (stderr.includes('Unavailable videos are hidden')) {
      console.log('⚠️ Some videos in the playlist are unavailable and will be skipped');
    }
    
    // Parse the data
    console.log('📋 Parsing video data...');
    const videos = parsePlaylistData(stdout);
    
    if (videos.length === 0) {
      console.error('❌ No videos found in playlist. Please check the playlist ID and make sure it\'s public.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${videos.length} videos`);
    
    // Write the JSON file
    fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
    
    console.log(`📁 Playlist saved to: ${outputPath}`);
    console.log('🎵 Sample tracks:');
    
    // Show first 5 tracks as preview
    videos.slice(0, 5).forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.artist} - ${video.title}`);
      console.log(`      ID: ${video.id} | Tags: ${video.tags.join(', ')}`);
    });
    
    if (videos.length > 5) {
      console.log(`   ... and ${videos.length - 5} more tracks`);
    }
    
    console.log('');
    console.log('🚀 Playlist imported successfully!');
    console.log('💡 Add this playlist to your index.html availablePlaylists array:');
    console.log(`   { id: '${outputName}', name: '🎵 ${playlistTitle || 'Imported Playlist'}', file: 'playlist-${outputName}.json' }`);
    
  } catch (error) {
    console.error(`❌ Error importing playlist: ${error.message}`);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchPlaylistData, parsePlaylistData, parseTitle };