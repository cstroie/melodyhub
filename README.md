# MelodyHub

A responsive web-based audio player that allows browsing local directories, managing playlists, and playing audio files.

## Features

- **Directory Browsing**: Navigate through local directories and subdirectories
- **Audio Playback**: Play MP3, WAV, OGG, FLAC, M4A, and AAC files
- **Playlist Management**:
  - Add individual audio files to playlist
  - Add entire playlists (M3U, M3U8, PLS formats)
  - Remove individual items
  - Clear entire playlist
- **Player Controls**:
  - Play/Pause
  - Next/Previous track
  - Progress bar with seeking
  - Volume control
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

## Usage

1. **Browsing Files**:
   - Use the directory browser panel to navigate through your audio files
   - Click "Open" on folders to enter them
   - Use the breadcrumb navigation to go back to parent directories

2. **Adding to Playlist**:
   - Click "Add" next to audio files to add them to the playlist
   - Click "Add" next to playlist files (M3U, M3U8, PLS) to add all contained files

3. **Managing Playlist**:
   - Click "Remove" to delete individual items
   - Use "Clear Playlist" to remove all items

4. **Playing Audio**:
   - Click the "Play" button to start playback
   - Use the progress bar to seek within the current track
   - Adjust volume with the slider
   - Use Next/Previous buttons to navigate between tracks

## Security Notes

- The application includes security measures to prevent directory traversal attacks
- Only files within the configured audio directory can be accessed
- All file paths are validated and sanitized

## Supported Formats

- **Audio Files**: MP3, WAV, OGG, FLAC, M4A, AAC
- **Playlist Files**: M3U, M3U8, PLS

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
