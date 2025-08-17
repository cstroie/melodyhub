<!DOCTYPE html>
<!--
 * MelodyHub - Audio Player
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
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>MelodyHub</h1>
            <p>Browse, manage, and play your audio files</p>
        </header>

        <div class="main-content">
            <div class="directory-browser">
                <h2 class="section-title">Directory Browser</h2>
                <div class="breadcrumb" id="breadcrumb">
                    <!-- Breadcrumb will be populated by JavaScript -->
                </div>
                <ul class="file-list" id="fileList">
                    <!-- File list will be populated by JavaScript -->
                </ul>
            </div>

            <div class="playlist-area">
                <h2 class="section-title">Playlist</h2>
                <ul class="playlist-items" id="playlistItems">
                    <!-- Playlist items will be populated by JavaScript -->
                </ul>
                <div id="emptyPlaylistMessage" class="empty-message">
                    Your playlist is empty. Add some audio files!
                </div>
                <div class="player-controls">
                    <div class="now-playing" id="nowPlaying">
                        Now Playing: <span id="nowPlayingTitle">Nothing</span>
                    </div>
                    <div class="time-info">
                        <span id="currentTime">0:00</span>
                        <span id="totalTime">0:00</span>
                    </div>
                    <div class="progress-container" id="progressContainer">
                        <div class="progress-bar" id="progressBar"></div>
                    </div>
                    <audio id="audioPlayer"></audio>
                    <div class="control-buttons">
                        <button class="control-btn" id="prevBtn" title="Previous" disabled>⏮</button>
                        <button class="control-btn" id="playBtn" title="Play">▶</button>
                        <button class="control-btn" id="pauseBtn" title="Pause" disabled>⏸</button>
                        <button class="control-btn" id="nextBtn" title="Next" disabled>⏭</button>
                    </div>
                    <div class="volume-container">
                        <span>🔈</span>
                        <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.01" value="1">
                        <span>🔊</span>
                    </div>
                </div>
                <div class="playlist-management">
                    <button class="btn btn-success management-btn" id="importBtn">Import Playlist</button>
                    <button class="btn btn-primary management-btn" id="exportBtn">Export Playlist</button>
                    <button class="btn btn-danger management-btn" id="clearBtn">Clear Playlist</button>
                </div>
            </div>
        </div>
    </div>

    <div id="notification" class="notification hidden"></div>

    <script src="script.js"></script>
</body>
</html>
