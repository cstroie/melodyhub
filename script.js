/**
 * Audio Player Application
 * 
 * This is the main JavaScript application for the audio player.
 * It handles UI interactions, playlist management, and audio playback.
 */

// === CONFIGURATION ===
/**
 * Supported audio file extensions
 * @type {string[]}
 */
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

/**
 * Supported playlist file extensions
 * @type {string[]}
 */
const PLAYLIST_EXTENSIONS = ['m3u', 'm3u8', 'pls'];

// === APPLICATION STATE ===
/**
 * Current directory path being browsed
 * @type {string}
 */
let currentPath = '';

/**
 * Array of playlist items
 * @type {Array<{title: string, path: string}>}
 */
let playlist = [];

/**
 * Index of currently playing track in playlist
 * @type {number}
 */
let currentTrackIndex = -1;

/**
 * Playback state
 * @type {boolean}
 */
let isPlaying = false;

/**
 * Load playlist and current path from localStorage on page load
 */
function loadFromStorage() {
    const savedPlaylist = localStorage.getItem('audioPlayerPlaylist');
    const savedTrackIndex = localStorage.getItem('audioPlayerCurrentTrackIndex');
    const savedPath = localStorage.getItem('audioPlayerCurrentPath');
    
    if (savedPlaylist) {
        playlist = JSON.parse(savedPlaylist);
    }
    
    if (savedTrackIndex !== null) {
        currentTrackIndex = parseInt(savedTrackIndex);
    }
    
    if (savedPath !== null) {
        currentPath = savedPath;
    }
}

// === DOM ELEMENTS ===
/** @type {HTMLElement} Breadcrumb navigation element */
let breadcrumbEl;

/** @type {HTMLElement} File list container */
let fileListEl;

/** @type {HTMLElement} Playlist items container */
let playlistItemsEl;

/** @type {HTMLAudioElement} Audio player element */
let audioPlayer;

/** @type {HTMLButtonElement} Play button */
let playBtn;

/** @type {HTMLButtonElement} Pause button */
let pauseBtn;

/** @type {HTMLButtonElement} Previous track button */
let prevBtn;

/** @type {HTMLButtonElement} Next track button */
let nextBtn;

/** @type {HTMLElement} Progress bar element */
let progressBar;

/** @type {HTMLElement} Progress container element */
let progressContainer;

/** @type {HTMLElement} Current time display */
let currentTimeEl;

/** @type {HTMLElement} Total time display */
let totalTimeEl;

/** @type {HTMLInputElement} Volume slider */
let volumeSlider;

/** @type {HTMLButtonElement} Import playlist button */
let importBtn;

/** @type {HTMLButtonElement} Export playlist button */
let exportBtn;

/** @type {HTMLButtonElement} Clear playlist button */
let clearBtn;

/** @type {HTMLElement} Notification element */
let notificationEl;

// === INITIALIZATION ===
/**
 * Initialize the application when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    breadcrumbEl = document.getElementById('breadcrumb');
    fileListEl = document.getElementById('fileList');
    playlistItemsEl = document.getElementById('playList');
    audioPlayer = document.getElementById('audioPlayer');
    playBtn = document.getElementById('playBtn');
    pauseBtn = document.getElementById('pauseBtn');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    progressBar = document.getElementById('progressBar');
    progressContainer = document.getElementById('progressContainer');
    currentTimeEl = document.getElementById('currentTime');
    totalTimeEl = document.getElementById('totalTime');
    volumeSlider = document.getElementById('volumeSlider');
    importBtn = document.getElementById('importBtn');
    exportBtn = document.getElementById('exportBtn');
    clearBtn = document.getElementById('clearBtn');
    notificationEl = document.getElementById('notification');

    // Load data from localStorage
    loadFromStorage();
    
    // Render playlist if it was loaded from storage
    if (playlist.length > 0) {
        renderPlaylist();
    }

    // Load directory based on saved path or default to root
    loadDirectory(currentPath);
    setupEventListeners();
    
    // Initialize now playing display
    updateNowPlaying();
});

// === EVENT LISTENERS ===
/**
 * Set up all event listeners for UI elements
 */
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
    
    // Add event listener for the new "Add All" button
    const addAllBtn = document.getElementById('addAllBtn');
    if (addAllBtn) {
        addAllBtn.addEventListener('click', () => {
            addDirectoryToPlaylist('.');
        });
    }
    
    // Set initial volume
    setVolume();
}

// === DIRECTORY BROWSING FUNCTIONS ===
/**
 * Load and display directory contents
 * @param {string} path - Directory path to load
 */
function loadDirectory(path) {
    currentPath = path;
    updateBreadcrumb();

    // Fetch directory contents from API
    fetch(`api.php?action=list&path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            renderFileList(data.files);
        })
        .catch(error => {
            showNotification('Error loading directory: ' + error.message, 'error');
        });
}

/**
 * Update breadcrumb navigation based on current path
 */
function updateBreadcrumb() {
    // Split path into components and filter out empty parts
    const paths = currentPath.split('/').filter(p => p);
    // Start with home link
    let breadcrumbHTML = '<li><a href="#" onclick="loadDirectory(\'\')">Home</a></li>';
    // Build path for each component
    let current = '';
    paths.forEach((path, index) => {
        current += (index > 0 ? '/' : '') + path;
        breadcrumbHTML += `<li><a href="#" onclick="loadDirectory('${current}')">${path}</a></li>`;
    });
    breadcrumbEl.innerHTML = '<ul>' + breadcrumbHTML + '</ul>';
    // Save current path to localStorage
    saveToStorage();
}

/**
 * Render file list in the directory browser
 * @param {Array} files - Array of file objects to render
 */
function renderFileList(files) {
    fileListEl.innerHTML = '';

    files.forEach(file => {
        const li = document.createElement('li');
	li.role = "grid";

        // Determine icon class based on file type
        const iconClass = file.type === 'directory' ? 'folder-icon' : 
                         AUDIO_EXTENSIONS.includes(file.extension) ? 'audio-icon' : 
                         PLAYLIST_EXTENSIONS.includes(file.extension) ? 'playlist-icon' : '';

        // Determine icon character based on file type
        const icon = file.type === 'directory' ? '📁' : 
                    AUDIO_EXTENSIONS.includes(file.extension) ? '🎵' : 
                    PLAYLIST_EXTENSIONS.includes(file.extension) ? '📝' : '📄';

        // Generate HTML for file item
        li.innerHTML = `
            <span class="file-icon ${iconClass}">${icon}</span>
            <span class="file-name" ${file.type === 'directory' ? `style="cursor: pointer; text-decoration: underline;" onclick="loadDirectory('${currentPath ? currentPath + '/' + file.name : file.name}')"` : ''}>${file.name}</span>
                ${file.type === 'directory' ? 
                    `<button class="outline" onclick="addDirectoryToPlaylist('${currentPath ? currentPath + '/' + file.name : file.name}')">Add All</button>` : 
                    `<button class="outline secondary" onclick="addToPlaylist('${file.name}', '${file.extension}')">Add</button>`
                }
        `;

        fileListEl.appendChild(li);
    });
}

// === PLAYLIST MANAGEMENT FUNCTIONS ===
/**
 * Add a file to the playlist
 * @param {string} filename - Name of the file to add
 * @param {string} extension - File extension
 */
function addToPlaylist(filename, extension) {
    // Check if file is a playlist
    if (PLAYLIST_EXTENSIONS.includes(extension)) {
        // Load playlist content from API
        fetch(`api.php?action=loadPlaylist&path=${encodeURIComponent(currentPath + '/' + filename)}`)
            .then(response => response.json())
            .then(data => {
                // Add each file in the playlist to our playlist
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
        // Add single audio file to playlist
        const fullPath = currentPath ? currentPath + '/' + filename : filename;
        playlist.push({
            title: filename,
            path: fullPath
        });
        renderPlaylist();
        showNotification('Added to playlist: ' + filename);
    }
}

/**
 * Add all audio files from a directory to the playlist
 * @param {string} dirname - Name of the directory to add
 */
function addDirectoryToPlaylist(dirname) {
    // Handle special case for current directory
    let fullPath;
    if (dirname === '.') {
        fullPath = currentPath; // Current directory
    } else {
        fullPath = currentPath ? currentPath + '/' + dirname : dirname;
    }
    
    // Load all audio files from directory recursively
    fetch(`api.php?action=getDirectoryFiles&path=${encodeURIComponent(fullPath)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('Error: ' + data.error, 'error');
                return;
            }
            
            // Add each file to our playlist
            data.files.forEach(file => {
                playlist.push({
                    title: file.name,
                    path: file.path
                });
            });
            
            renderPlaylist();
            showNotification(`Added ${data.files.length} tracks from directory`);
        })
        .catch(error => {
            showNotification('Error loading directory: ' + error.message, 'error');
        });
}

/**
 * Save playlist and current path to localStorage
 */
function saveToStorage() {
    localStorage.setItem('audioPlayerPlaylist', JSON.stringify(playlist));
    localStorage.setItem('audioPlayerCurrentTrackIndex', currentTrackIndex.toString());
    localStorage.setItem('audioPlayerCurrentPath', currentPath);
}

/**
 * Render the playlist in the UI
 */
function renderPlaylist() {
    // Clear the playlist container first
    playlistItemsEl.innerHTML = '';

    // Create list item for each playlist entry
    playlist.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item grid';
        li.draggable = true;
        li.dataset.index = index;

        // Generate HTML for playlist item
        li.innerHTML = `
            <span class="item-number">${index + 1}.</span>
            <span class="playlist-title" style="cursor: pointer; text-decoration: underline;" onclick="playTrack(${index})">${item.title}</span>
            <button class="secondary" onclick="removeFromPlaylist(${index})">Remove</button>
        `;

        // Add drag and drop event listeners
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        playlistItemsEl.appendChild(li);
    });

    updatePlayerControls();
    
    // Save to localStorage
    saveToStorage();
}

/**
 * Remove an item from the playlist
 * @param {number} index - Index of item to remove
 */
function removeFromPlaylist(index) {
    // Remove item from playlist array
    playlist.splice(index, 1);

    // If we removed the currently playing track
    if (currentTrackIndex === index) {
        currentTrackIndex = -1;
        audioPlayer.src = '';
        isPlaying = false;
        updatePlayPauseButtons();
    } 
    // If we removed a track before the current one, adjust index
    else if (currentTrackIndex > index) {
        currentTrackIndex--;
    }

    renderPlaylist();
    showNotification('Removed from playlist');
}

/**
 * Clear the entire playlist
 */
function clearPlaylist() {
    // Don't do anything if playlist is already empty
    if (playlist.length === 0) return;

    // Confirm with user before clearing
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

/**
 * Import a playlist from a file
 */
function importPlaylist() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.m3u,.m3u8,.pls';

    // Handle file selection
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        // Read the file content
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                // Split into lines and filter out empty lines and comments
                const lines = content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));

                // Add each line as a playlist item
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

/**
 * Export the current playlist to a file
 */
function exportPlaylist() {
    // Don't export empty playlist
    if (playlist.length === 0) {
        showNotification('Playlist is empty', 'error');
        return;
    }

    // Create M3U format content
    let content = '#EXTM3U\n';
    playlist.forEach(item => {
        content += `${item.path}\n`;
    });

    // Create a blob and download link
    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);

    // Create temporary anchor element for download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.m3u';
    document.body.appendChild(a);
    a.click();

    // Clean up temporary elements
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    showNotification('Playlist exported');
}

// === DRAG AND DROP FUNCTIONS ===
/** @type {HTMLElement} Element being dragged */
let dragSrcEl = null;

/**
 * Handle drag start event
 * @param {DragEvent} e - Drag event
 */
function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

/**
 * Handle drag over event
 * @param {DragEvent} e - Drag event
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handle drop event
 * @param {DragEvent} e - Drag event
 */
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    // Only process if dropping on a different element
    if (dragSrcEl !== this) {
        const srcIndex = parseInt(dragSrcEl.dataset.index);
        const destIndex = parseInt(this.dataset.index);

        // Reorder playlist by removing and reinserting item
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

/**
 * Handle drag end event
 */
function handleDragEnd() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach(item => {
        item.classList.remove('dragging');
    });
}

// === AUDIO PLAYER FUNCTIONS ===
/**
 * Play the current track or first track if none playing
 */
function playAudio() {
    // Don't play if playlist is empty
    if (playlist.length === 0) {
        showNotification('Playlist is empty', 'error');
        return;
    }

    // Start at first track if no track is currently selected
    if (currentTrackIndex === -1) {
        currentTrackIndex = 0;
    }

    // Get current track and set audio source
    const track = playlist[currentTrackIndex];
    audioPlayer.src = `api.php?action=play&file=${encodeURIComponent(track.path)}`;
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayPauseButtons();
            updateNowPlaying(); // Update now playing display
            showNotification('Now playing: ' + track.title);
            // Save current state to localStorage
            saveToStorage();
        })
        .catch(error => {
            showNotification('Error playing audio: ' + error.message, 'error');
        });
}

/**
 * Pause audio playback
 */
function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayPauseButtons();
}

/**
 * Play the previous track in the playlist
 */
function playPrevious() {
    if (playlist.length === 0) return;

    // Cycle to last track if at beginning
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playAudio();
}

/**
 * Play a specific track by index
 * @param {number} index - Index of the track to play
 */
function playTrack(index) {
    if (playlist.length === 0 || index < 0 || index >= playlist.length) return;
    
    currentTrackIndex = index;
    playAudio();
}

/**
 * Play the next track in the playlist
 */
function playNext() {
    if (playlist.length === 0) return;

    // Cycle to first track if at end
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playAudio();
}

/**
 * Update progress bar during playback
 */
function updateProgress() {
    const { currentTime, duration } = audioPlayer;
    // Don't update if duration is not available
    if (isNaN(duration)) return;

    // Calculate progress percentage
    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = `${progressPercent}`;

    // Update time displays
    currentTimeEl.textContent = formatTime(currentTime);
    totalTimeEl.textContent = formatTime(duration);
}

/**
 * Set playback position based on click position on progress bar
 * @param {MouseEvent} e - Click event
 */
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;

    // Don't seek if duration is not available
    if (isNaN(duration)) return;

    // Calculate new playback time based on click position
    audioPlayer.currentTime = (clickX / width) * duration;
}

/**
 * Set audio volume based on slider value
 */
function setVolume() {
    audioPlayer.volume = volumeSlider.value;
}

/**
 * Update the now playing display
 */
function updateNowPlaying() {
    const nowPlayingTitleEl = document.getElementById('nowPlayingTitle');
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
        nowPlayingTitleEl.textContent = playlist[currentTrackIndex].title;
    } else {
        nowPlayingTitleEl.textContent = 'Paused';
    }
}

/**
 * Update play/pause button states based on playback state
 */
function updatePlayPauseButtons() {
    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
    prevBtn.disabled = playlist.length === 0;
    nextBtn.disabled = playlist.length === 0;
}

/**
 * Update player control states
 */
function updatePlayerControls() {
    prevBtn.disabled = playlist.length === 0;
    nextBtn.disabled = playlist.length === 0;
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// === NOTIFICATION FUNCTIONS ===
/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    notificationEl.textContent = message;
    notificationEl.className = 'notification ' + (type === 'error' ? 'error' : '');
    notificationEl.classList.remove('hidden');

    // Automatically hide notification after 3 seconds
    setTimeout(() => {
        notificationEl.classList.add('hidden');
    }, 3000);
}
