/**
 * MelodyHub Audio Player
 * 
 * Main JavaScript application for the audio player.
 * Handles UI interactions, playlist management, and audio playback.
 * 
 * Features:
 * - Directory browsing with breadcrumb navigation
 * - Playlist management with drag-and-drop reordering
 * - Audio playback controls (play, pause, next, previous)
 * - Progress bar with seeking
 * - Volume control
 * - Cover art display
 * - Playlist import/export
 */

// === LOGGING FUNCTIONS ===
/**
 * Log debug messages to console
 * @param {...any} args - Arguments to log
 */
function logDebug(...args) {
    console.debug('[MelodyHub Debug]', ...args);
}

/**
 * Log info messages to console
 * @param {...any} args - Arguments to log
 */
function logInfo(...args) {
    console.info('[MelodyHub Info]', ...args);
}

/**
 * Log warning messages to console
 * @param {...any} args - Arguments to log
 */
function logWarning(...args) {
    console.warn('[MelodyHub Warning]', ...args);
}

/**
 * Log error messages to console
 * @param {...any} args - Arguments to log
 */
function logError(...args) {
    console.error('[MelodyHub Error]', ...args);
}

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
 * Application state object that holds all the current state of the player
 * @property {string} currentPath - Current directory path being browsed
 * @property {Array} playlist - Array of playlist items
 * @property {number} currentTrackIndex - Index of currently playing track
 * @property {boolean} isPlaying - Whether audio is currently playing
 * @property {number} volume - Current volume level (0.0 to 1.0)
 */
const state = {
    currentPath: '',
    playlist: [],
    currentTrackIndex: -1,
    isPlaying: false,
    volume: 0.5
};

// Shortcut references to state properties for easier access
let currentPath = state.currentPath;
let playlist = state.playlist;
let currentTrackIndex = state.currentTrackIndex;
let isPlaying = state.isPlaying;

/**
 * Load playlist and current path from localStorage on page load
 * This function restores the user's previous session
 */
function loadFromStorage() {
    logDebug('Loading data from localStorage');
    const savedPlaylist = localStorage.getItem('audioPlayerPlaylist');
    const savedTrackIndex = localStorage.getItem('audioPlayerCurrentTrackIndex');
    const savedPath = localStorage.getItem('audioPlayerCurrentPath');
    const savedVolume = localStorage.getItem('audioPlayerVolume');
    
    if (savedPlaylist) {
        try {
            const parsedPlaylist = JSON.parse(savedPlaylist);
            if (Array.isArray(parsedPlaylist)) {
                state.playlist = parsedPlaylist;
                playlist = state.playlist;
                logInfo(`Loaded playlist with ${state.playlist.length} items from storage`);
            } else {
                logWarning('Saved playlist is not an array, initializing empty playlist');
                state.playlist = [];
                playlist = state.playlist;
            }
        } catch (e) {
            logError('Failed to parse saved playlist:', e);
            state.playlist = [];
            playlist = state.playlist;
        }
    }
    
    if (savedTrackIndex !== null) {
        const index = parseInt(savedTrackIndex);
        if (!isNaN(index) && index >= -1) {
            state.currentTrackIndex = index;
            currentTrackIndex = state.currentTrackIndex;
            logDebug(`Current track index set to ${state.currentTrackIndex}`);
        }
    }
    
    if (savedPath !== null) {
        state.currentPath = savedPath;
        currentPath = state.currentPath;
        logDebug(`Current path set to ${state.currentPath}`);
    }
    
    if (savedVolume !== null) {
        const volume = parseFloat(savedVolume);
        if (!isNaN(volume) && volume >= 0 && volume <= 1) {
            state.volume = volume;
            logDebug(`Volume set to ${state.volume}`);
        }
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
 * This is the main entry point of the application
 */
document.addEventListener('DOMContentLoaded', () => {
    logInfo('Initializing MelodyHub Audio Player');
    
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
    
    // Set volume from state
    volumeSlider.value = state.volume;
    setVolume();
    
    // Render playlist if it was loaded from storage
    if (playlist.length > 0) {
        logDebug(`Rendering playlist with ${playlist.length} items`);
        renderPlaylist();
    }

    // Load directory based on saved path or default to root
    logDebug(`Loading directory: ${currentPath || 'root'}`);
    loadDirectory(currentPath);
    setupEventListeners();
    
    // Initialize now playing display
    updateNowPlaying();
    
    logInfo('MelodyHub Audio Player initialized successfully');
});

// === EVENT LISTENERS ===
/**
 * Set up all event listeners for UI elements
 * This function connects user interactions to application functionality
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
    
    // Add event listeners for clear playlist modal
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');
    
    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', confirmClearPlaylist);
    }
    
    if (cancelClearBtn) {
        cancelClearBtn.addEventListener('click', cancelClearPlaylist);
    }
    
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
    logDebug(`Loading directory: ${path}`);
    currentPath = path;
    updateBreadcrumb();

    // Fetch directory contents from API
    fetch(`api.php?action=list&path=${encodeURIComponent(path)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                logError('API error loading directory:', data.error);
                showNotification('Error loading directory: ' + data.error, 'error');
                return;
            }
            logDebug(`Loaded ${data.files.length} items from directory`);
            renderFileList(data.files);
        })
        .catch(error => {
            logError('Network error loading directory:', error);
            showNotification('Error loading directory: ' + error.message, 'error');
        });
}

/**
 * Update breadcrumb navigation based on current path
 * This creates a navigable path showing where the user is in the directory structure
 */
function updateBreadcrumb() {
    logDebug(`Updating breadcrumb for path: ${currentPath}`);
    // Split path into components and filter out empty parts
    const paths = currentPath.split('/').filter(p => p);
    // Start with home link
    let breadcrumbHTML = '<li><a href="#" onclick="loadDirectory(\'\')">Home</a></li>';
    // Build path for each component
    let current = '';
    paths.forEach((path, index) => {
        current += (index > 0 ? '/' : '') + path;
        // Escape single quotes in path for JavaScript onclick handler
        const escapedPath = current.replace(/'/g, "\\'");
        breadcrumbHTML += `<li><a href="#" onclick="loadDirectory('${escapedPath}')">${path}</a></li>`;
    });
    breadcrumbEl.innerHTML = '<ul>' + breadcrumbHTML + '</ul>';
    // Save current path to localStorage
    state.currentPath = currentPath;
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

        // Determine icon based on file type and cover art
        let iconHTML = '';
        if (file.coverArt) {
            // Use cover art as icon
            iconHTML = `<img src="api.php?action=cover&file=${encodeURIComponent(file.coverArt)}" alt="Cover" class="file-cover-icon">`;
        } else {
            // Determine icon class based on file type
            const iconClass = file.type === 'directory' ? 'folderIcon' : 
                             AUDIO_EXTENSIONS.includes(file.extension) ? 'audioIcon' : 
                             PLAYLIST_EXTENSIONS.includes(file.extension) ? 'playlistIcon' : '';

            // Determine icon character based on file type
            const icon = file.type === 'directory' ? '📁' : 
                        AUDIO_EXTENSIONS.includes(file.extension) ? '🎵' : 
                        PLAYLIST_EXTENSIONS.includes(file.extension) ? '📝' : '📄';
            
            iconHTML = `<span class="fileIcon ${iconClass}">${icon}</span>`;
        }

        // Generate HTML for file item
        // Escape single quotes in file names for JavaScript onclick handlers
        const escapedFileName = file.name.replace(/'/g, "\\'");
        const fullPath = currentPath ? currentPath + '/' + file.name : file.name;
        const escapedFullPath = fullPath.replace(/'/g, "\\'");
        
        // Properly escape the path for use in onclick handlers
        const jsSafePath = fullPath.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        
        li.innerHTML = `
            ${iconHTML}
            <span class="fileName" style="cursor: pointer;" ${file.type === 'directory' ? `onclick="loadDirectory('${escapedFullPath}')" ondblclick="addDirectoryToPlaylist('${jsSafePath}'); event.stopPropagation(); return false;"` : `onclick="handleFileClick('${escapedFileName}', '${file.extension}')" title="Add to playlist"`}>${file.name}</span>
        `;

        fileListEl.appendChild(li);
    });
}

/**
 * Handle file name click in the file list
 * @param {string} filename - Name of the file
 * @param {string} extension - File extension
 */
function handleFileClick(filename, extension) {
    // If it's an audio file, add it to playlist
    if (AUDIO_EXTENSIONS.includes(extension)) {
        addToPlaylist(filename, extension);
    } 
    // If it's a directory, navigate into it
    else if (extension === '') { // Directories don't have extensions
        const fullPath = currentPath ? currentPath + '/' + filename : filename;
        const escapedFullPath = fullPath.replace(/'/g, "\\'");
        loadDirectory(escapedFullPath);
    }
    // If it's a playlist file, add it to playlist
    else if (PLAYLIST_EXTENSIONS.includes(extension)) {
        addToPlaylist(filename, extension);
    }
}

// === PLAYLIST MANAGEMENT FUNCTIONS ===
/**
 * Add a file to the playlist
 * @param {string} filename - Name of the file to add
 * @param {string} extension - File extension
 */
function addToPlaylist(filename, extension) {
    logDebug(`Adding file to playlist: ${filename} (${extension})`);
    // Check if file is a playlist
    if (PLAYLIST_EXTENSIONS.includes(extension)) {
        logInfo(`Loading playlist file: ${filename}`);
        // Load playlist content from API
        fetch(`api.php?action=loadPlaylist&path=${encodeURIComponent(currentPath + '/' + filename)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    logError('API error loading playlist:', data.error);
                    showNotification('Error loading playlist: ' + data.error, 'error');
                    return;
                }
                // Add each file in the playlist to our playlist
                if (Array.isArray(data.files)) {
                    data.files.forEach(file => {
                        state.playlist.push({
                            title: file.title || file.path.split('/').pop(),
                            path: file.path,
                            coverArt: file.coverArt || null
                        });
                    });
                    playlist = state.playlist;
                    logInfo(`Added ${data.files.length} tracks from playlist`);
                    renderPlaylist();
                    showNotification(`Added ${data.files.length} tracks from playlist`);
                } else {
                    logError('Invalid playlist data format');
                    showNotification('Error: Invalid playlist format', 'error');
                }
            })
            .catch(error => {
                logError('Network error loading playlist:', error);
                showNotification('Error loading playlist: ' + error.message, 'error');
            });
    } else {
        // Add single audio file to playlist
        const fullPath = currentPath ? currentPath + '/' + filename : filename;
        
        // Try to find cover art for this file's directory
        fetch(`api.php?action=list&path=${encodeURIComponent(currentPath)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const coverArt = data.coverArt || null;
                state.playlist.push({
                    title: filename,
                    path: fullPath,
                    coverArt: coverArt
                });
                playlist = state.playlist;
                logDebug(`Added audio file to playlist: ${filename}`);
                renderPlaylist();
                showNotification('Added to playlist: ' + filename);
            })
            .catch(error => {
                // Fallback if we can't get cover art
                state.playlist.push({
                    title: filename,
                    path: fullPath,
                    coverArt: null
                });
                playlist = state.playlist;
                logDebug(`Added audio file to playlist: ${filename}`);
                renderPlaylist();
                showNotification('Added to playlist: ' + filename);
            });
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
        fullPath = currentPath || '.'; // Current directory
    } else {
        // dirname is already the full path from the API, no need to concatenate
        fullPath = dirname;
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
                state.playlist.push({
                    title: file.name,
                    path: file.path,
                    coverArt: file.coverArt || null
                });
            });
            playlist = state.playlist;
            
            renderPlaylist();
            showNotification(`Added ${data.files.length} tracks from directory`);
        })
        .catch(error => {
            showNotification('Error loading directory: ' + error.message, 'error');
        });
}

/**
 * Save playlist and current path to localStorage
 * This preserves the user's session between page reloads
 */
function saveToStorage() {
    localStorage.setItem('audioPlayerPlaylist', JSON.stringify(state.playlist));
    localStorage.setItem('audioPlayerCurrentTrackIndex', state.currentTrackIndex.toString());
    localStorage.setItem('audioPlayerCurrentPath', state.currentPath);
    localStorage.setItem('audioPlayerVolume', state.volume.toString());
}

/**
 * Render the playlist in the UI
 * This function updates the visual representation of the playlist
 */
function renderPlaylist() {
    // Clear the playlist container first
    playlistItemsEl.innerHTML = '';

    // Update playlist count in header
    const playlistCountEl = document.getElementById('playlistCount');
    if (playlistCountEl) {
        playlistCountEl.textContent = playlist.length;
    }

    // If playlist is empty, show the empty message
    if (playlist.length === 0) {
        playlistItemsEl.innerHTML = '<p id="emptyPlaylistMessage">Your playlist is empty. Add some audio files!</p>';
    } else {
        // Create list item for each playlist entry
        playlist.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'playlistItem grid';
            li.draggable = true;
            li.dataset.index = index;

            // Check if this is the currently playing track
            const isCurrentTrack = index === currentTrackIndex;
            const titleStyle = isCurrentTrack ? 'cursor: pointer; color: #ffeb3b; font-weight: bold;' : 'cursor: pointer;';

            // Generate HTML for playlist item
            li.innerHTML = `
                <span class="itemNumber">${index + 1}.</span>
                <span class="playlistTitle" style="${titleStyle}" onclick="playTrack(${index + 1})">${item.title}</span>
            `;

            // Add drag and drop event listeners
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragend', handleDragEnd);

            playlistItemsEl.appendChild(li);
        });
    }

    updatePlayerControls();
    updateNowPlaying(); // Update now playing display with cover art
    
    // Save to localStorage
    saveToStorage();
}


/**
 * Clear the entire playlist
 * This function asks for user confirmation before clearing
 */
function clearPlaylist() {
    // Don't do anything if playlist is already empty
    if (playlist.length === 0) return;

    // Show confirmation modal
    const modal = document.getElementById('clearPlaylistModal');
    if (modal) {
        modal.showModal();
    }
}

/**
 * Confirm clearing the playlist
 * This function is called when the user confirms the clear action
 */
function confirmClearPlaylist() {
    state.playlist = [];
    playlist = state.playlist;
    state.currentTrackIndex = -1;
    currentTrackIndex = state.currentTrackIndex;
    audioPlayer.src = '';
    isPlaying = false;
    renderPlaylist();
    updatePlayPauseButtons();
    showNotification('Playlist cleared');
    
    // Close the modal
    const modal = document.getElementById('clearPlaylistModal');
    if (modal) {
        modal.close();
    }
}

/**
 * Cancel clearing the playlist
 * This function is called when the user cancels the clear action
 */
function cancelClearPlaylist() {
    // Close the modal
    const modal = document.getElementById('clearPlaylistModal');
    if (modal) {
        modal.close();
    }
}

/**
 * Import a playlist from a file
 * This function allows users to load M3U, M3U8, or PLS playlist files
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

        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!PLAYLIST_EXTENSIONS.includes(extension)) {
            showNotification('Please select a valid playlist file (M3U, M3U8, or PLS)', 'error');
            return;
        }

        // Read the file content
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                // Split into lines and filter out empty lines and comments
                const lines = content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));

                // Add each line as a playlist item
                let trackCount = 0;
                lines.forEach(line => {
                    if (line.trim()) {
                        state.playlist.push({
                            title: line.split('/').pop(),
                            path: line.trim()
                        });
                        trackCount++;
                    }
                });
                playlist = state.playlist;

                renderPlaylist();
                showNotification(`Imported ${trackCount} tracks`);
            } catch (error) {
                showNotification('Error importing playlist: ' + error.message, 'error');
            }
        };
        reader.onerror = function() {
            showNotification('Error reading file', 'error');
        };
        reader.readAsText(file);
    };

    input.click();
}

/**
 * Export the current playlist to a file
 * This function creates and downloads an M3U playlist file
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
        const item = state.playlist.splice(srcIndex, 1)[0];
        state.playlist.splice(destIndex, 0, item);
        playlist = state.playlist;

        // Update current track index if needed
        if (state.currentTrackIndex === srcIndex) {
            state.currentTrackIndex = destIndex;
            currentTrackIndex = state.currentTrackIndex;
        } else if (srcIndex < state.currentTrackIndex && destIndex >= state.currentTrackIndex) {
            state.currentTrackIndex--;
            currentTrackIndex = state.currentTrackIndex;
        } else if (srcIndex > state.currentTrackIndex && destIndex <= state.currentTrackIndex) {
            state.currentTrackIndex++;
            currentTrackIndex = state.currentTrackIndex;
        }

        renderPlaylist();
    }

    return false;
}

/**
 * Handle drag end event
 * This function cleans up after a drag operation
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
 * This is the main function for starting audio playback
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
        state.currentTrackIndex = currentTrackIndex;
    }

    // Get current track and set audio source
    const track = playlist[currentTrackIndex];
    audioPlayer.src = `api.php?action=play&file=${encodeURIComponent(track.path)}`;
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            state.isPlaying = isPlaying;
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
 * This function pauses the currently playing audio
 */
function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    state.isPlaying = isPlaying;
    updatePlayPauseButtons();
}

/**
 * Play the previous track in the playlist
 * This function cycles to the previous track or wraps to the end
 */
function playPrevious() {
    if (playlist.length === 0) return;

    // Cycle to last track if at beginning
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    state.currentTrackIndex = currentTrackIndex;
    renderPlaylist(); // Update playlist highlighting
    playAudio();
}

/**
 * Play a specific track by index (1-based indexing)
 * @param {number} oneBasedIndex - 1-based index of the track to play
 */
function playTrack(oneBasedIndex) {
    // Convert 1-based index to 0-based index
    const index = oneBasedIndex - 1;
    
    if (playlist.length === 0 || index < 0 || index >= playlist.length) return;
    
    currentTrackIndex = index;
    state.currentTrackIndex = currentTrackIndex;
    renderPlaylist(); // Update playlist highlighting
    playAudio();
}

/**
 * Play the next track in the playlist
 * This function cycles to the next track or wraps to the beginning
 */
function playNext() {
    if (playlist.length === 0) return;

    // Cycle to first track if at end
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    state.currentTrackIndex = currentTrackIndex;
    renderPlaylist(); // Update playlist highlighting
    playAudio();
}

/**
 * Update progress bar during playback
 * This function updates the UI with current playback position
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
 * This function updates the audio volume and saves it to state
 */
function setVolume() {
    state.volume = volumeSlider.value;
    audioPlayer.volume = state.volume;
    saveToStorage();
}

/**
 * Update the now playing display
 * This function updates the UI with the currently playing track title and cover art
 */
function updateNowPlaying() {
    const nowPlayingTitleEl = document.getElementById('nowPlayingTitle');
    const nowPlayingCoverEl = document.getElementById('nowPlayingCover');
    
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
        const track = playlist[currentTrackIndex];
        nowPlayingTitleEl.textContent = track.title;
        
        // Display cover art if available
        if (track.coverArt) {
            nowPlayingCoverEl.innerHTML = `<img src="api.php?action=cover&file=${encodeURIComponent(track.coverArt)}" alt="Cover Art" class="now-playing-cover">`;
        } else {
            nowPlayingCoverEl.innerHTML = '<div class="now-playing-cover-placeholder">🎵</div>';
        }
    } else {
        nowPlayingTitleEl.textContent = 'Paused';
        nowPlayingCoverEl.innerHTML = '<div class="now-playing-cover-placeholder">🎵</div>';
    }
}

/**
 * Update play/pause button states based on playback state
 * This function enables/disables buttons based on current state
 */
function updatePlayPauseButtons() {
    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
    prevBtn.disabled = playlist.length === 0;
    nextBtn.disabled = playlist.length === 0;
}

/**
 * Update player control states
 * This function updates the state of navigation buttons
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
    return `${min}:${sec.toString().padStart(2, '0')}`;
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
