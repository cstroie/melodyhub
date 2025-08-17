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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Roboto:wght@300;400;500;700&family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
    <link rel="stylesheet" href="style.css">
</head>
    <body class="container-fluid">
        <header>
            <h1>MelodyHub</h1>
            <p>Browse, manage, and play your audio files</p>
        </header>
                
        <main>

	<section>
		<h2 id="nowPlaying">
			<span id="nowPlayingTitle">--</span>
		</h2>
		<div class="timeDisplay">
			<span id="currentTime" class="currentTime">0:00</span>
			<span class="timeSeparator">/</span>
			<span id="totalTime" class="totalTime">0:00</span>
		</div>
		<div id="progressContainer">
			<progress id="progressBar" value="0" max="100"></progress>
		</div>
		<audio id="audioPlayer"></audio>
		<div role="group">
			<button id="prevBtn" title="Previous" disabled>⏮</button>
			<button id="playBtn" title="Play">▶</button>
			<button id="pauseBtn" title="Pause" disabled>⏸</button>
			<button id="nextBtn" title="Next" disabled>⏭</button>
		</div>
		<label>
			Volume
			<input type="range" class="volumeSlider" id="volumeSlider" min="0" max="1" step="0.01" value="0.5">
		</label>
	</section>

	<section class="grid">
            <article>
                <h3>Directory Browser</h3>
                <nav aria-label="breadcrumb" id="breadcrumb">
                    <!-- Breadcrumb will be populated by JavaScript -->
                </nav>
                <ul class="fileList" id="fileList">
                    <!-- File list will be populated by JavaScript -->
                </ul>
                <div role="group">
                    <button class="secondary" id="addAllBtn">Add All Files in Current Directory</button>
                </div>
            </article>
            <article>
                <h3>Playlist</h3>
                <ul class="playList" id="playList">
                    <!-- Playlist items will be populated by JavaScript -->
                    <p id="emptyPlaylistMessage">Your playlist is empty. Add some audio files!</p>
                </ul>
                <div role="group">
                    <button id="importBtn">Import</button>
                    <button id="exportBtn">Export</button>
                    <button id="clearBtn" type="reset">Clear</button>
                </div>
            </article>
        </section>

	</main>

        <div id="notification" class="notification hidden"></div>

        <script src="script.js"></script>
    </body>
</html>
