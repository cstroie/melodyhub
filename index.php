<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audio Player</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #2c3e50;
            color: white;
            border-radius: 5px;
        }

        h1 {
            margin-bottom: 10px;
        }

        .main-content {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }

        @media (max-width: 768px) {
            .main-content {
                flex-direction: column;
            }
        }

        .directory-browser, .playlist-area {
            flex: 1;
            min-width: 300px;
            background: white;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .section-title {
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
            color: #2c3e50;
        }

        .breadcrumb {
            margin-bottom: 15px;
            padding: 10px;
            background: #ecf0f1;
            border-radius: 3px;
        }

        .breadcrumb a {
            text-decoration: none;
            color: #3498db;
        }

        .breadcrumb a:hover {
            text-decoration: underline;
        }

        .file-list {
            list-style: none;
        }

        .file-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
        }

        .file-item:hover {
            background-color: #f9f9f9;
        }

        .file-icon {
            margin-right: 10px;
            font-size: 1.2em;
        }

        .folder-icon {
            color: #f39c12;
        }

        .audio-icon {
            color: #27ae60;
        }

        .playlist-icon {
            color: #9b59b6;
        }

        .file-actions {
            margin-left: auto;
        }

        .btn {
            padding: 8px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin-left: 5px;
            font-size: 0.9em;
        }

        .btn-primary {
            background: #3498db;
            color: white;
        }

        .btn-success {
            background: #27ae60;
            color: white;
        }

        .btn-danger {
            background: #e74c3c;
            color: white;
        }

        .btn-warning {
            background: #f39c12;
            color: white;
        }

        .btn:hover {
            opacity: 0.9;
        }

        .playlist-items {
            list-style: none;
            max-height: 400px;
            overflow-y: auto;
        }

        .playlist-item {
            padding: 12px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
        }

        .playlist-item.dragging {
            opacity: 0.5;
            background: #e3f2fd;
        }

        .item-number {
            margin-right: 10px;
            font-weight: bold;
            color: #7f8c8d;
        }

        .playlist-title {
            flex: 1;
        }

        .playlist-controls {
            display: flex;
            gap: 5px;
        }

        .player-controls {
            margin-top: 20px;
            text-align: center;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 5px;
        }

        .progress-container {
            width: 100%;
            height: 10px;
            background: #ddd;
            border-radius: 5px;
            margin: 15px 0;
            cursor: pointer;
        }

        .progress-bar {
            height: 100%;
            background: #3498db;
            border-radius: 5px;
            width: 0%;
        }

        .time-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 0.9em;
            color: #7f8c8d;
        }

        .control-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
        }

        .control-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: #3498db;
            color: white;
            font-size: 1.2em;
            cursor: pointer;
        }

        .control-btn:hover {
            background: #2980b9;
        }

        .control-btn:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }

        .volume-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }

        .volume-slider {
            flex: 1;
            max-width: 100px;
        }

        .playlist-management {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }

        .management-btn {
            flex: 1;
            min-width: 120px;
        }

        .hidden {
            display: none;
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 5px;
            color: white;
            background: #27ae60;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
        }

        .notification.error {
            background: #e74c3c;
        }

        .empty-message {
            text-align: center;
            padding: 20px;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Audio Player</h1>
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

    <script>
        // Configuration
        const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
        const PLAYLIST_EXTENSIONS = ['m3u', 'm3u8', 'pls'];

        // State
        let currentPath = '';
        let playlist = [];
        let currentTrackIndex = -1;
        let isPlaying = false;

        // DOM Elements
        const breadcrumbEl = document.getElementById('breadcrumb');
        const fileListEl = document.getElementById('fileList');
        const playlistItemsEl = document.getElementById('playlistItems');
        const emptyPlaylistMessageEl = document.getElementById('emptyPlaylistMessage');
        const audioPlayer = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const progressContainer = document.getElementById('progressContainer');
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        const volumeSlider = document.getElementById('volumeSlider');
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        const notificationEl = document.getElementById('notification');

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadDirectory('');
            setupEventListeners();
        });

        // Event Listeners
        function setupEventListeners() {
            playBtn.addEventListener('click', playAudio);
            pauseBtn.addEventListener('click', pauseAudio);
            prevBtn.addEventListener('click', playPrevious);
            nextBtn.addEventListener('click', playNext);
            audioPlayer.addEventListener('timeupdate', updateProgress);
            audioPlayer.addEventListener('ended', playNext);
            progressContainer.addEventListener('click', setProgress);
            volumeSlider.addEventListener('input', setVolume);
            importBtn.addEventListener('click', importPlaylist);
            exportBtn.addEventListener('click', exportPlaylist);
            clearBtn.addEventListener('click', clearPlaylist);
        }

        // Directory Browsing
        function loadDirectory(path) {
            currentPath = path;
            updateBreadcrumb();
            
            // In a real implementation, this would make an AJAX request to the server
            // For this example, we'll simulate the response
            fetch(`api.php?action=list&path=${encodeURIComponent(path)}`)
                .then(response => response.json())
                .then(data => {
                    renderFileList(data.files);
                })
                .catch(error => {
                    showNotification('Error loading directory: ' + error.message, 'error');
                });
        }

        function updateBreadcrumb() {
            const paths = currentPath.split('/').filter(p => p);
            let breadcrumbHTML = '<a href="#" onclick="loadDirectory(\'\')">Home</a>';
            
            let current = '';
            paths.forEach((path, index) => {
                current += (index > 0 ? '/' : '') + path;
                breadcrumbHTML += ` > <a href="#" onclick="loadDirectory('${current}')">${path}</a>`;
            });
            
            breadcrumbEl.innerHTML = breadcrumbHTML;
        }

        function renderFileList(files) {
            fileListEl.innerHTML = '';
            
            files.forEach(file => {
                const li = document.createElement('li');
                li.className = 'file-item';
                
                const iconClass = file.type === 'directory' ? 'folder-icon' : 
                                 AUDIO_EXTENSIONS.includes(file.extension) ? 'audio-icon' : 
                                 PLAYLIST_EXTENSIONS.includes(file.extension) ? 'playlist-icon' : '';
                
                const icon = file.type === 'directory' ? '📁' : 
                            AUDIO_EXTENSIONS.includes(file.extension) ? '🎵' : 
                            PLAYLIST_EXTENSIONS.includes(file.extension) ? '📝' : '📄';
                
                li.innerHTML = `
                    <span class="file-icon ${iconClass}">${icon}</span>
                    <span class="file-name">${file.name}</span>
                    <div class="file-actions">
                        ${file.type === 'directory' ? 
                            `<button class="btn btn-primary" onclick="loadDirectory('${currentPath ? currentPath + '/' + file.name : file.name}')">Open</button>` : 
                            `<button class="btn btn-success" onclick="addToPlaylist('${file.name}', '${file.extension}')">Add</button>`
                        }
                    </div>
                `;
                
                fileListEl.appendChild(li);
            });
        }

        // Playlist Management
        function addToPlaylist(filename, extension) {
            if (PLAYLIST_EXTENSIONS.includes(extension)) {
                // Load playlist content
                fetch(`api.php?action=loadPlaylist&path=${encodeURIComponent(currentPath + '/' + filename)}`)
                    .then(response => response.json())
                    .then(data => {
                        data.files.forEach(file => {
                            playlist.push({
                                title: file.title || file.path.split('/').pop(),
                                path: file.path
                            });
                        });
                        renderPlaylist();
                        showNotification(`Added ${data.files.length} tracks from playlist`);
                    })
                    .catch(error => {
                        showNotification('Error loading playlist: ' + error.message, 'error');
                    });
            } else {
                // Add single audio file
                const fullPath = currentPath ? currentPath + '/' + filename : filename;
                playlist.push({
                    title: filename,
                    path: fullPath
                });
                renderPlaylist();
                showNotification('Added to playlist: ' + filename);
            }
        }

        function renderPlaylist() {
            playlistItemsEl.innerHTML = '';
            emptyPlaylistMessageEl.classList.toggle('hidden', playlist.length > 0);
            
            playlist.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'playlist-item';
                li.draggable = true;
                li.dataset.index = index;
                
                li.innerHTML = `
                    <span class="item-number">${index + 1}.</span>
                    <span class="playlist-title">${item.title}</span>
                    <div class="playlist-controls">
                        <button class="btn btn-danger" onclick="removeFromPlaylist(${index})">Remove</button>
                    </div>
                `;
                
                // Drag and drop handlers
                li.addEventListener('dragstart', handleDragStart);
                li.addEventListener('dragover', handleDragOver);
                li.addEventListener('drop', handleDrop);
                li.addEventListener('dragend', handleDragEnd);
                
                playlistItemsEl.appendChild(li);
            });
            
            updatePlayerControls();
        }

        function removeFromPlaylist(index) {
            playlist.splice(index, 1);
            if (currentTrackIndex === index) {
                currentTrackIndex = -1;
                audioPlayer.src = '';
                isPlaying = false;
                updatePlayPauseButtons();
            } else if (currentTrackIndex > index) {
                currentTrackIndex--;
            }
            renderPlaylist();
            showNotification('Removed from playlist');
        }

        function clearPlaylist() {
            if (playlist.length === 0) return;
            
            if (confirm('Are you sure you want to clear the entire playlist?')) {
                playlist = [];
                currentTrackIndex = -1;
                audioPlayer.src = '';
                isPlaying = false;
                renderPlaylist();
                updatePlayPauseButtons();
                showNotification('Playlist cleared');
            }
        }

        function importPlaylist() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.m3u,.m3u8,.pls';
            
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const content = e.target.result;
                        const lines = content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
                        
                        lines.forEach(line => {
                            if (line.trim()) {
                                playlist.push({
                                    title: line.split('/').pop(),
                                    path: line.trim()
                                });
                            }
                        });
                        
                        renderPlaylist();
                        showNotification(`Imported ${lines.length} tracks`);
                    } catch (error) {
                        showNotification('Error importing playlist: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        }

        function exportPlaylist() {
            if (playlist.length === 0) {
                showNotification('Playlist is empty', 'error');
                return;
            }
            
            let content = '#EXTM3U\n';
            playlist.forEach(item => {
                content += `${item.path}\n`;
            });
            
            const blob = new Blob([content], { type: 'audio/x-mpegurl' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'playlist.m3u';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showNotification('Playlist exported');
        }

        // Drag and Drop
        let dragSrcEl = null;

        function handleDragStart(e) {
            dragSrcEl = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            
            if (dragSrcEl !== this) {
                const srcIndex = parseInt(dragSrcEl.dataset.index);
                const destIndex = parseInt(this.dataset.index);
                
                // Reorder playlist
                const item = playlist.splice(srcIndex, 1)[0];
                playlist.splice(destIndex, 0, item);
                
                // Update current track index if needed
                if (currentTrackIndex === srcIndex) {
                    currentTrackIndex = destIndex;
                } else if (srcIndex < currentTrackIndex && destIndex >= currentTrackIndex) {
                    currentTrackIndex--;
                } else if (srcIndex > currentTrackIndex && destIndex <= currentTrackIndex) {
                    currentTrackIndex++;
                }
                
                renderPlaylist();
            }
            
            return false;
        }

        function handleDragEnd() {
            const items = document.querySelectorAll('.playlist-item');
            items.forEach(item => {
                item.classList.remove('dragging');
            });
        }

        // Audio Player
        function playAudio() {
            if (playlist.length === 0) {
                showNotification('Playlist is empty', 'error');
                return;
            }
            
            if (currentTrackIndex === -1) {
                currentTrackIndex = 0;
            }
            
            const track = playlist[currentTrackIndex];
            audioPlayer.src = `api.php?action=play&file=${encodeURIComponent(track.path)}`;
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseButtons();
                    showNotification('Now playing: ' + track.title);
                })
                .catch(error => {
                    showNotification('Error playing audio: ' + error.message, 'error');
                });
        }

        function pauseAudio() {
            audioPlayer.pause();
            isPlaying = false;
            updatePlayPauseButtons();
        }

        function playPrevious() {
            if (playlist.length === 0) return;
            
            currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            playAudio();
        }

        function playNext() {
            if (playlist.length === 0) return;
            
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            playAudio();
        }

        function updateProgress() {
            const { currentTime, duration } = audioPlayer;
            if (isNaN(duration)) return;
            
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            currentTimeEl.textContent = formatTime(currentTime);
            totalTimeEl.textContent = formatTime(duration);
        }

        function setProgress(e) {
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = audioPlayer.duration;
            
            if (isNaN(duration)) return;
            
            audioPlayer.currentTime = (clickX / width) * duration;
        }

        function setVolume() {
            audioPlayer.volume = volumeSlider.value;
        }

        function updatePlayPauseButtons() {
            playBtn.disabled = isPlaying;
            pauseBtn.disabled = !isPlaying;
            prevBtn.disabled = playlist.length === 0;
            nextBtn.disabled = playlist.length === 0;
        }

        function updatePlayerControls() {
            prevBtn.disabled = playlist.length === 0;
            nextBtn.disabled = playlist.length === 0;
        }

        function formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        // Notifications
        function showNotification(message, type = 'success') {
            notificationEl.textContent = message;
            notificationEl.className = 'notification ' + (type === 'error' ? 'error' : '');
            notificationEl.classList.remove('hidden');
            
            setTimeout(() => {
                notificationEl.classList.add('hidden');
            }, 3000);
        }
    </script>
</body>
</html>
