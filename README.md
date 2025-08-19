# MelodyHub

A web-based audio player with directory browsing, playlist management, and cover art display. Features include drag-and-drop reordering, import/export playlists, and responsive design. Supports MP3, WAV, OGG, FLAC, M4A, AAC files.

## Features

- **Directory Browsing**: Navigate through local directories and subdirectories
- **Audio Playback**: Play MP3, WAV, OGG, FLAC, M4A, and AAC files
- **Playlist Management**:
  - Add individual audio files to playlist
  - Add entire directories to playlist (non-recursive)
  - Add entire playlists (M3U, M3U8, PLS formats)
  - Import/export playlists
  - Clear entire playlist
  - Drag and drop reordering
- **Player Controls**:
  - Play/Pause
  - Next/Previous track
  - Progress bar with seeking
  - Volume control
- **Cover Art Display**: Automatically detects and displays album artwork
- **Persistent Storage**: Playlist saved in browser's localStorage
- **Responsive Design**: Works on desktop and mobile devices

## Requirements

- PHP 7.0 or higher
- Web server with PHP support (Apache, Nginx, etc.)

## Installation

1. Clone or download this repository
2. Place your audio files in the `audio` directory (create it if it doesn't exist)
3. Ensure the web server has read permissions for the audio directory
4. Configure the application by editing `config.php` (see Configuration section)
5. Access `index.php` through your web browser

## Configuration

The main configuration file is `config.php`. Before using the application, you need to configure it properly:

1. Edit `config.php` and change the `$basePath` variable to point to your audio directory:
   ```php
   $basePath = __DIR__ . '/audio'; // Change this to your audio directory
   ```

2. Make sure the path you specify exists and contains your audio files
3. Ensure the web server has read permissions for this directory

## API Endpoints

The application uses the following PHP endpoints:

- `api.php?action=list&path=PATH` - List directory contents
- `api.php?action=play&file=FILE` - Play an audio file
- `api.php?action=loadPlaylist&path=PATH` - Load a playlist file
- `api.php?action=getDirectoryFiles&path=PATH` - Get all audio files from a directory recursively

## Usage

1. **Browsing Files**:
   - Use the directory browser panel to navigate through your audio files
   - Click on folder names to enter them
   - Use the breadcrumb navigation to go back to parent directories
   - Click "Add All Files in Current Directory" to add all audio files from the current directory
   - Double-click on directory names to add all audio files from that directory to the playlist

2. **Adding to Playlist**:
   - Click on audio files to add them to the playlist
   - Double-click on directories to add all audio files from that directory
   - Click on playlist files (M3U, M3U8, PLS) to add all contained files

3. **Managing Playlist**:
   - Drag and drop playlist items to reorder them
   - Use "Import" to load a playlist from a file
   - Use "Export" to save your current playlist to a file
   - Use "Clear" to remove all items from the playlist

4. **Playing Audio**:
   - Click the "▶" button to start playback
   - Use the progress bar to seek within the current track
   - Adjust volume with the slider
   - Use Next/Previous buttons to navigate between tracks
   - Click on any playlist item to play that specific track

## Security Notes

- The application includes security measures to prevent directory traversal attacks
- Only files within the configured audio directory can be accessed
- All file paths are validated and sanitized

## Supported Formats

- **Audio Files**: MP3, WAV, OGG, FLAC, M4A, AAC
- **Playlist Files**: M3U, M3U8, PLS

## Cover Art Detection

The application automatically detects cover art in directories. It looks for files with these names (case insensitive):
- cover.*
- folder.*
- album.*
- front.*
- artwork.*

Supported image formats: JPG, JPEG, PNG, GIF, BMP

## Browser Support

The player works in all modern browsers that support HTML5 audio:
- Chrome 3+
- Firefox 3.5+
- Safari 4+
- Edge 12+
- Internet Explorer 9+

## Author

Costin Stroie <costinstroie@eridu.eu.org>

## License

This project is open source and available under the MIT License.
