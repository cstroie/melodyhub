<!DOCTYPE html>
<!--
 * MelodyHub - Web-based Audio Player
 *
 * A responsive web-based audio player that allows browsing local directories,
 * managing playlists, and playing audio files with cover art display.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MelodyHub - Audio Player</title>
    <!-- Load Google Fonts for better typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Roboto:wght@300;400;500;700&family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Load PicoCSS for base styling -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
    <!-- Load custom styles -->
    <link rel="stylesheet" href="style.css">
</head>
    <body class="container-fluid">
                
        <main>
            <!-- Audio player controls section -->
            <section class="player-section">
                <!-- Now playing display -->
                <div id="nowPlaying" class="now-playing-container">
                    <div id="nowPlayingCover" class="cover-art-container">
                        <div class="now-playing-cover-placeholder">🎵</div>
                    </div>
                    <div class="track-info">
                        <span id="nowPlayingTitle" class="track-title">--</span>
                    </div>
                </div>
                
                <!-- Time display showing current position and total duration -->
                <div class="timeDisplay">
                    <span id="currentTime" class="currentTime">0:00</span>
                    <span class="timeSeparator">/</span>
                    <span id="totalTime" class="totalTime">0:00</span>
                </div>
                
                <!-- Progress bar for tracking and seeking playback position -->
                <div id="progressContainer">
                    <progress id="progressBar" value="0" max="100"></progress>
                </div>
                
                <!-- Hidden audio element that handles actual playback -->
                <audio id="audioPlayer"></audio>
                
                <!-- Playback control buttons -->
                <div role="group">
                    <button id="prevBtn" title="Previous" disabled>⏮</button>
                    <button id="playBtn" title="Play">▶</button>
                    <button id="pauseBtn" title="Pause" disabled>⏸</button>
                    <button id="nextBtn" title="Next" disabled>⏭</button>
                </div>
                
                <!-- Volume control slider -->
                <label>
                    Volume
                    <input type="range" class="volumeSlider" id="volumeSlider" min="0" max="1" step="0.01" value="0.5">
                </label>
            </section>

            <!-- Main content area with directory browser and playlist -->
            <section class="grid">
                <!-- Directory browser section -->
                <article>
                    <header>
                        <h3>Directory Browser</h3>
                        <!-- Breadcrumb navigation showing current path -->
                        <nav aria-label="breadcrumb" id="breadcrumb">
                            <!-- Breadcrumb will be populated by JavaScript -->
                        </nav>
                    </header>
                    <!-- List of files in the current directory -->
                    <ul class="fileList" id="fileList">
                        <!-- File list will be populated by JavaScript -->
                    </ul>
                    <!-- Button to add all files in current directory to playlist -->
                    <footer>
                        <div role="group">
                            <button class="secondary" id="addAllBtn">Add All Files in Current Directory</button>
                        </div>
                    </footer>
                </article>
                <!-- Playlist section -->
                <article>
                    <header>
                        <h3>Playlist (<span id="playlistCount">0</span> items)</h3>
                    </header>
                    <!-- List of tracks in the current playlist -->
                    <ul class="playList" id="playList">
                        <!-- Playlist items will be populated by JavaScript -->
                        <p id="emptyPlaylistMessage">Your playlist is empty. Add some audio files!</p>
                    </ul>
                    <!-- Playlist management buttons -->
                    <footer>
                      <div role="group">
                        <button id="importBtn">Import</button>
                        <button id="exportBtn">Export</button>
                        <button id="clearBtn" type="reset">Clear</button>
                      </div>
                    </footer>
                </article>
            </section>
        </main>
        <!-- Footer with application name and description -->
        <footer>
            <p><strong>MelodyHub</strong> - Browse, manage, and play your audio files</p>
        </footer>
        <!-- Notification element for displaying messages to the user -->
        <div id="notification" class="notification hidden"></div>
        <!-- Load the main application script -->
        <script src="script.js"></script>
    </body>
</html>
