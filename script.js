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

// === DOM ELEMENTS ===
/** @type {HTMLElement} Breadcrumb navigation element */
let breadcrumbEl;

/** @type {HTMLElement} File list container */
let fileListEl;

/** @type {HTMLElement} Playlist items container */
let playlistItemsEl;

/** @type {HTMLElement} Empty playlist message element */
let emptyPlaylistMessageEl;

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
    playlistItemsEl = document.getElementById('playlistItems');
    emptyPlaylistMessageEl = document.getElementById('emptyPlaylistMessage');
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

    loadDirectory('');
    setupEventListeners();
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
    let breadcrumbHTML = '<a href="#" onclick="loadDirectory(\'\')">Home</a>';

    // Build path for each component
    let current = '';
    paths.forEach((path, index) => {
        current += (index > 0 ? '/' : '') + path;
        breadcrumbHTML += ` > <a href="#" onclick="loadDirectory('${current}')">${path}</a>`;
    });

    breadcrumbEl.innerHTML = breadcrumbHTML;
}

/**
 * Render file list in the directory browser
 * @param {Array} files - Array of file objects to render
 */
function renderFileList(files) {
    fileListEl.innerHTML = '';

    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';

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
 * Render the playlist in the UI
 */
function renderPlaylist() {
    playlistItemsEl.innerHTML = '';
    emptyPlaylistMessageEl.classList.toggle('hidden', playlist.length > 0);

    // Create list item for each playlist entry
    playlist.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.draggable = true;
        li.dataset.index = index;

        // Generate HTML for playlist item
        li.innerHTML = `
            <span class="item-number">${index + 1}.</span>
            <span class="playlist-title">${item.title}</span>
            <div class="playlist-controls">
                <button class="btn btn-danger" onclick="removeFromPlaylist(${index})">Remove</button>
            </div>
        `;

        // Add drag and drop event listeners
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        playlistItemsEl.appendChild(li);
    });

    updatePlayerControls();
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
            showNotification('Now playing: ' + track.title);
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
    progressBar.style.width = `${progressPercent}%`;

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
// Debug function to log messages to console
function debugLog(message, data = null) {
    console.log('[MelodyHub Debug]', message, data || '');
}

// DOM Elements
const fileList = document.getElementById('fileList');
const playlistItems = document.getElementById('playlistItems');
const emptyPlaylistMessage = document.getElementById('emptyPlaylistMessage');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const volumeSlider = document.getElementById('volumeSlider');
const breadcrumb = document.getElementById('breadcrumb');
const clearBtn = document.getElementById('clearBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const notification = document.getElementById('notification');

// State variables
let currentPath = '';
let playlist = [];
let currentTrackIndex = -1;

// Initialize the application
debugLog('Initializing MelodyHub application');
loadDirectory('');

// Event Listeners
playBtn.addEventListener('click', playTrack);
pauseBtn.addEventListener('click', pauseTrack);
prevBtn.addEventListener('click', playPreviousTrack);
nextBtn.addEventListener('click', playNextTrack);
clearBtn.addEventListener('click', clearPlaylist);
importBtn.addEventListener('click', importPlaylist);
exportBtn.addEventListener('click', exportPlaylist);

// Audio player event listeners
audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('ended', playNextTrack);
audioPlayer.addEventListener('loadedmetadata', updateTotalTime);

// Volume control
volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
});

// Progress bar click event
progressContainer.addEventListener('click', setProgress);

// Load directory contents
function loadDirectory(path) {
    debugLog('Loading directory:', path);
    currentPath = path;
    updateBreadcrumb(path);
    
    fetch(`api.php?action=list&path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                debugLog('Error loading directory:', data.error);
                showNotification('Error: ' + data.error, 'error');
                return;
            }
            
            debugLog('Directory loaded successfully, items found:', data.files.length);
            displayFiles(data.files);
        })
        .catch(error => {
            debugLog('Error fetching directory:', error);
            showNotification('Error loading directory', 'error');
        });
}

// Display files in the directory browser
function displayFiles(files) {
    debugLog('Displaying files in directory browser, count:', files.length);
    fileList.innerHTML = '';
    
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        
        if (file.type === 'directory') {
            li.innerHTML = `
                <span class="file-icon">📁</span>
                <span class="file-name">${file.name}</span>
            `;
            li.addEventListener('click', () => {
                debugLog('Navigating to directory:', file.path);
                loadDirectory(file.path);
            });
        } else {
            li.innerHTML = `
                <span class="file-icon">🎵</span>
                <span class="file-name">${file.name}</span>
            `;
            li.addEventListener('click', () => {
                debugLog('Adding file to playlist:', file.path);
                addToPlaylist(file.path, file.name);
            });
        }
        
        fileList.appendChild(li);
    });
}

// Update breadcrumb navigation
function updateBreadcrumb(path) {
    debugLog('Updating breadcrumb for path:', path);
    const parts = path ? path.split('/') : [];
    breadcrumb.innerHTML = '<span class="breadcrumb-item" data-path="">Home</span>';
    
    let currentPath = '';
    parts.forEach((part, index) => {
        currentPath += (index > 0 ? '/' : '') + part;
        const separator = document.createElement('span');
        separator.textContent = ' / ';
        breadcrumb.appendChild(separator);
        
        const item = document.createElement('span');
        item.className = 'breadcrumb-item';
        item.textContent = part;
        item.dataset.path = currentPath;
        item.addEventListener('click', () => {
            debugLog('Breadcrumb navigation to:', currentPath);
            loadDirectory(currentPath);
        });
        
        breadcrumb.appendChild(item);
    });
}

// Add file to playlist
function addToPlaylist(filePath, fileName) {
    debugLog('Adding to playlist:', { filePath, fileName });
    playlist.push({ path: filePath, title: fileName });
    updatePlaylistDisplay();
    showNotification('Added to playlist: ' + fileName);
}

// Update playlist display
function updatePlaylistDisplay() {
    debugLog('Updating playlist display, items count:', playlist.length);
    playlistItems.innerHTML = '';
    
    if (playlist.length === 0) {
        emptyPlaylistMessage.style.display = 'block';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    
    emptyPlaylistMessage.style.display = 'none';
    
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        if (index === currentTrackIndex) {
            li.classList.add('playing');
        }
        
        li.innerHTML = `
            <span class="track-title">${track.title}</span>
            <button class="remove-btn" title="Remove">✕</button>
        `;
        
        li.addEventListener('click', () => {
            debugLog('Playing track from playlist, index:', index);
            playTrackAtIndex(index);
        });
        
        li.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            debugLog('Removing track from playlist, index:', index);
            removeFromPlaylist(index);
        });
        
        playlistItems.appendChild(li);
    });
    
    // Update button states
    prevBtn.disabled = currentTrackIndex <= 0;
    nextBtn.disabled = currentTrackIndex >= playlist.length - 1;
}

// Remove track from playlist
function removeFromPlaylist(index) {
    debugLog('Removing track at index:', index);
    playlist.splice(index, 1);
    
    // Adjust current track index if necessary
    if (index < currentTrackIndex) {
        currentTrackIndex--;
    } else if (index === currentTrackIndex) {
        // If we removed the currently playing track
        if (playlist.length > 0) {
            // Play the next track or the previous one if at the end
            if (currentTrackIndex < playlist.length) {
                playTrackAtIndex(currentTrackIndex);
            } else {
                playTrackAtIndex(currentTrackIndex - 1);
            }
        } else {
            // No more tracks, stop playback
            stopTrack();
            currentTrackIndex = -1;
        }
    }
    
    updatePlaylistDisplay();
    showNotification('Removed from playlist');
}

// Play track at specific index
function playTrackAtIndex(index) {
    debugLog('Playing track at index:', index);
    if (index < 0 || index >= playlist.length) return;
    
    currentTrackIndex = index;
    const track = playlist[index];
    
    audioPlayer.src = `api.php?action=play&file=${encodeURIComponent(track.path)}`;
    audioPlayer.play()
        .then(() => {
            debugLog('Track playback started:', track.title);
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            updatePlaylistDisplay();
        })
        .catch(error => {
            debugLog('Error playing track:', error);
            showNotification('Error playing track: ' + error.message, 'error');
        });
}

// Play current track
function playTrack() {
    debugLog('Play button clicked');
    if (playlist.length === 0) {
        showNotification('Playlist is empty');
        return;
    }
    
    if (currentTrackIndex === -1) {
        playTrackAtIndex(0);
    } else {
        audioPlayer.play()
            .then(() => {
                debugLog('Track playback resumed');
                playBtn.disabled = true;
                pauseBtn.disabled = false;
            })
            .catch(error => {
                debugLog('Error resuming track:', error);
                showNotification('Error playing track: ' + error.message, 'error');
            });
    }
}

// Pause current track
function pauseTrack() {
    debugLog('Pause button clicked');
    audioPlayer.pause();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    debugLog('Track playback paused');
}

// Stop current track
function stopTrack() {
    debugLog('Stopping track playback');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Play next track
function playNextTrack() {
    debugLog('Next track button clicked');
    if (currentTrackIndex < playlist.length - 1) {
        playTrackAtIndex(currentTrackIndex + 1);
    }
}

// Play previous track
function playPreviousTrack() {
    debugLog('Previous track button clicked');
    if (currentTrackIndex > 0) {
        playTrackAtIndex(currentTrackIndex - 1);
    }
}

// Update progress bar
function updateProgress() {
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    // Update current time display
    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
}

// Update total time display
function updateTotalTime() {
    totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
}

// Set progress when clicking on progress bar
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    
    audioPlayer.currentTime = (clickX / width) * duration;
    debugLog('Progress bar clicked, setting time to:', audioPlayer.currentTime);
}

// Format time in MM:SS format
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Clear playlist
function clearPlaylist() {
    debugLog('Clearing playlist');
    if (playlist.length === 0) {
        showNotification('Playlist is already empty');
        return;
    }
    
    if (confirm('Are you sure you want to clear the playlist?')) {
        stopTrack();
        playlist = [];
        currentTrackIndex = -1;
        updatePlaylistDisplay();
        showNotification('Playlist cleared');
    }
}

// Import playlist
function importPlaylist() {
    debugLog('Import playlist button clicked');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.m3u,.m3u8,.pls';
    
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        debugLog('Selected playlist file for import:', file.name);
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                const extension = file.name.split('.').pop().toLowerCase();
                let importedFiles = [];
                
                if (extension === 'm3u' || extension === 'm3u8') {
                    importedFiles = parseM3U(content);
                } else if (extension === 'pls') {
                    importedFiles = parsePLS(content);
                }
                
                debugLog('Parsed playlist, tracks count:', importedFiles.length);
                if (importedFiles.length > 0) {
                    playlist = importedFiles;
                    currentTrackIndex = -1;
                    updatePlaylistDisplay();
                    showNotification(`Imported ${importedFiles.length} tracks`);
                } else {
                    showNotification('No valid tracks found in playlist', 'warning');
                }
            } catch (error) {
                debugLog('Error importing playlist:', error);
                showNotification('Error importing playlist: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    
    fileInput.click();
}

// Parse M3U/M3U8 playlist
function parseM3U(content) {
    debugLog('Parsing M3U playlist');
    const lines = content.split('\n');
    const files = [];
    
    lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            files.push({
                path: line,
                title: line.split('/').pop()
            });
        }
    });
    
    return files;
}

// Parse PLS playlist
function parsePLS(content) {
    debugLog('Parsing PLS playlist');
    const lines = content.split('\n');
    const files = [];
    
    lines.forEach(line => {
        const match = line.match(/^File\d+=(.+)$/);
        if (match) {
            const path = match[1];
            files.push({
                path: path,
                title: path.split('/').pop()
            });
        }
    });
    
    return files;
}

// Export playlist
function exportPlaylist() {
    debugLog('Export playlist button clicked');
    if (playlist.length === 0) {
        showNotification('Playlist is empty');
        return;
    }
    
    let playlistContent = '#EXTM3U\n';
    playlist.forEach(track => {
        playlistContent += `${track.path}\n`;
    });
    
    const blob = new Blob([playlistContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    debugLog('Playlist exported, tracks count:', playlist.length);
    showNotification('Playlist exported');
}

// Show notification
function showNotification(message, type = 'info') {
    debugLog('Showing notification:', { message, type });
    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}
