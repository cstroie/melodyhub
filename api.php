<?php
/**
 * MelodyHub - Audio Player API
 *
 * Backend API for the MelodyHub audio player web application.
 * Handles directory listing, audio file streaming, cover art serving, 
 * and playlist loading with security checks.
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
 */

/**
 * Audio Player API
 * 
 * This script provides backend functionality for the audio player web application.
 * It handles directory listing, audio file streaming, cover art serving, and playlist loading.
 * 
 * Endpoints:
 * - ?action=list&path=[path] - List directory contents
 * - ?action=play&file=[file] - Stream an audio file
 * - ?action=cover&file=[file] - Serve a cover art image
 * - ?action=loadPlaylist&path=[file] - Load a playlist file
 */

// Include configuration file
require_once 'config.php';

// Get the requested action
$action = $_GET['action'] ?? '';

// Route to appropriate function based on action
switch ($action) {
    case 'list':
        header('Content-Type: application/json');
        listDirectory();
        break;
    case 'play':
        playAudio();
        break;
    case 'cover':
        serveCoverArt();
        break;
    case 'loadPlaylist':
        header('Content-Type: application/json');
        loadPlaylist();
        break;
    case 'getDirectoryFiles':
        header('Content-Type: application/json');
        getDirectoryFiles();
        break;
    default:
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid action']);
        break;
}

/**
 * List directory contents
 * 
 * This function returns a JSON array of files and directories in the specified path.
 * It includes security checks to prevent directory traversal attacks.
 * 
 * @return void Outputs JSON response with file listing
 */
function listDirectory() {
    global $basePath;
    
    // Get the requested path, default to empty string
    $path = $_GET['path'] ?? '';
    
    // Security check to prevent directory traversal
    // realpath() resolves symbolic links and returns absolute path
    // strpos() ensures the resolved path is within the base path
    $fullPath = realpath($basePath . '/' . $path);
    $realBasePath = realpath($basePath);
    
    // Additional security checks
    if (!$fullPath || !$realBasePath || strpos($fullPath, $realBasePath) !== 0) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    // Ensure we're still within the base path after normalization
    $normalizedPath = str_replace('\\', '/', substr($fullPath, strlen($realBasePath)));
    if (preg_match('/\.\.(\/|\\\\|$)/', $normalizedPath)) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    // Check if the path is actually a directory
    if (!is_dir($fullPath)) {
        echo json_encode(['error' => 'Directory not found']);
        return;
    }
    
    // Initialize files array
    $files = [];
    
    // Get directory contents
    $items = scandir($fullPath);
    
    // Initialize files array
    $files = [];
    $coverArt = null; // Cover art for current directory files
    
    // Process each item in the directory
    foreach ($items as $item) {
        // Skip current and parent directory references
        if ($item === '.' || $item === '..') continue;
        
        // Build full path and relative path
        $itemPath = $fullPath . '/' . $item;
        $relativePath = $path ? $path . '/' . $item : $item;
        
        // Check if item is a directory
        if (is_dir($itemPath)) {
            // For directories, check if they contain audio files and look for cover art
            $dirCoverArt = findCoverArtInDirectory($itemPath);
            if ($dirCoverArt) {
                // Convert to relative path
                $dirCoverArt = substr($dirCoverArt, strlen(realpath($basePath)) + 1);
            }
                
            $files[] = [
                'name' => $item,
                'type' => 'directory',
                'path' => $relativePath,
                'coverArt' => $dirCoverArt
            ];
        } else {
            // For files, extract extension for type identification
            $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            
            // Define supported audio extensions
            $audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
            
            // Define supported image extensions for cover art
            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
            
            // Check for cover art files
            if (in_array($extension, $imageExtensions) && isCoverArt($item)) {
                // Store the first cover art found
                if ($coverArt === null) {
                    $coverArt = $relativePath;
                }
            }
            // Only include audio files and playlist files
            else if (in_array($extension, $audioExtensions) || in_array($extension, ['m3u', 'm3u8', 'pls'])) {
                $files[] = [
                    'name' => $item,
                    'type' => 'file',
                    'extension' => $extension,
                    'path' => $relativePath
                ];
            }
        }
    }
    
    // Add cover art to each file entry if found
    if ($coverArt !== null) {
        foreach ($files as &$file) {
            // Only add cover art to file entries, not directories (they already have their own)
            if ($file['type'] !== 'directory') {
                $file['coverArt'] = $coverArt;
            }
        }
        $response = ['files' => $files, 'coverArt' => $coverArt];
    } else {
        $response = ['files' => $files];
    }
    
    // Sort items: directories first, then files, both alphabetically
    usort($files, function($a, $b) {
        // If both items are the same type, sort by name
        if ($a['type'] === $b['type']) {
            return strcmp($a['name'], $b['name']);
        }
        // Directories come before files
        return $a['type'] === 'directory' ? -1 : 1;
    });
    
    // Return JSON response with file list
    echo json_encode($response);
}

/**
 * Stream an audio file
 * 
 * This function streams an audio file to the client with appropriate headers.
 * It includes security checks to prevent unauthorized file access.
 * 
 * @return void Streams audio file content or returns 404 error
 */
function playAudio() {
    global $basePath;
    
    // Get the requested file path
    $file = $_GET['file'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $file);
    $realBasePath = realpath($basePath);
    
    // Additional security checks
    if (!$fullPath || !$realBasePath || strpos($fullPath, $realBasePath) !== 0) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Ensure we're still within the base path after normalization
    $normalizedPath = str_replace('\\', '/', substr($fullPath, strlen($realBasePath)));
    if (preg_match('/\.\.(\/|\\\\|$)/', $normalizedPath)) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Check if file exists
    if (!file_exists($fullPath)) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Determine content type based on file extension
    $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'mp3' => 'audio/mpeg',
        'wav' => 'audio/wav',
        'ogg' => 'audio/ogg',
        'flac' => 'audio/flac',
        'm4a' => 'audio/mp4',
        'aac' => 'audio/aac'
    ];
    
    // Default to MP3 if extension not found
    $contentType = $mimeTypes[$extension] ?? 'audio/mpeg';
    
    // Set appropriate headers for audio streaming
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($fullPath));
    header('Accept-Ranges: bytes');
    
    // Stream the file content to the client
    readfile($fullPath);
    exit;
}

/**
 * Serve a cover art image
 * 
 * This function serves cover art images with appropriate headers.
 * It includes security checks to prevent unauthorized file access.
 * 
 * @return void Streams image file content or returns 404 error
 */
function serveCoverArt() {
    global $basePath;
    
    // Get the requested file path
    $file = $_GET['file'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $file);
    $realBasePath = realpath($basePath);
    
    // Additional security checks
    if (!$fullPath || !$realBasePath || strpos($fullPath, $realBasePath) !== 0) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Ensure we're still within the base path after normalization
    $normalizedPath = str_replace('\\', '/', substr($fullPath, strlen($realBasePath)));
    if (preg_match('/\.\.(\/|\\\\|$)/', $normalizedPath)) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Check if file exists
    if (!file_exists($fullPath)) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Determine content type based on file extension
    $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'bmp' => 'image/bmp'
    ];
    
    // Default to JPEG if extension not found
    $contentType = $mimeTypes[$extension] ?? 'image/jpeg';
    
    // Set appropriate headers for image serving
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($fullPath));
    
    // Stream the file content to the client
    readfile($fullPath);
    exit;
}

/**
 * Get all audio files from a directory recursively
 * 
 * This function returns a JSON array of all audio files in the specified directory
 * and its subdirectories.
 * 
 * @return void Outputs JSON response with file listing
 */
function getDirectoryFiles() {
    global $basePath;
    
    // Get the requested path, default to empty string
    $path = $_GET['path'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $path);
    $realBasePath = realpath($basePath);
    
    // Additional security checks
    if (!$fullPath || !$realBasePath || strpos($fullPath, $realBasePath) !== 0) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    // Ensure we're still within the base path after normalization
    $normalizedPath = str_replace('\\', '/', substr($fullPath, strlen($realBasePath)));
    if (preg_match('/\.\.(\/|\\\\|$)/', $normalizedPath)) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    // Check if the path is actually a directory
    if (!is_dir($fullPath)) {
        echo json_encode(['error' => 'Directory not found']);
        return;
    }
    
    // Initialize files array
    $files = [];
    
    // Define supported audio extensions
    $audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
    
    // Create recursive iterator to get all files
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($fullPath, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    
    // Process each file
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $extension = strtolower($file->getExtension());
            
            // Only include audio files
            if (in_array($extension, $audioExtensions)) {
                // Get relative path from base path
                $relativePath = substr($file->getPathname(), strlen(realpath($basePath)) + 1);
                $dirPath = dirname($relativePath);
                
                // Find cover art for this file's directory
                $coverArt = findCoverArtInDirectory(dirname($file->getPathname()));
                if ($coverArt) {
                    // Convert to relative path
                    $coverArt = substr($coverArt, strlen(realpath($basePath)) + 1);
                }
                
                $files[] = [
                    'name' => $file->getFilename(),
                    'path' => $relativePath,
                    'extension' => $extension,
                    'coverArt' => $coverArt
                ];
            }
        }
    }
    
    // Sort files alphabetically by path
    usort($files, function($a, $b) {
        return strcmp($a['path'], $b['path']);
    });
    
    // Return JSON response with file list
    echo json_encode(['files' => $files]);
}

/**
 * Load and parse a playlist file
 * 
 * This function loads and parses playlist files (M3U, M3U8, PLS) and returns
 * a JSON array of the contained audio files.
 * 
 * @return void Outputs JSON response with playlist contents
 */
function loadPlaylist() {
    global $basePath;
    
    // Get the requested playlist file path
    $file = $_GET['path'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $file);
    $realBasePath = realpath($basePath);
    
    // Additional security checks
    if (!$fullPath || !$realBasePath || strpos($fullPath, $realBasePath) !== 0) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    // Ensure we're still within the base path after normalization
    $normalizedPath = str_replace('\\', '/', substr($fullPath, strlen($realBasePath)));
    if (preg_match('/\.\.(\/|\\\\|$)/', $normalizedPath)) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    // Check if playlist file exists
    if (!file_exists($fullPath)) {
        echo json_encode(['error' => 'Playlist not found']);
        return;
    }
    
    // Get file extension to determine parsing method
    $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    
    // Initialize array to hold playlist entries
    $files = [];
    
    // Find cover art in the same directory as the playlist
    $coverArt = findCoverArtInDirectory(dirname($fullPath));
    if ($coverArt) {
        // Convert to relative path
        $coverArt = substr($coverArt, strlen(realpath($basePath)) + 1);
    }
    
    // Parse M3U/M3U8 playlist files
    if ($extension === 'm3u' || $extension === 'm3u8') {
        // Read entire file content
        $content = file_get_contents($fullPath);
        
        // Split content into lines
        $lines = explode("\n", $content);
        
        // Process each line
        foreach ($lines as $line) {
            // Trim whitespace and skip empty lines or comments
            $line = trim($line);
            if ($line && strpos($line, '#') !== 0) {
                // Resolve relative paths based on playlist location
                $filePath = dirname($file) . '/' . $line;
                $files[] = [
                    'path' => $filePath,
                    'title' => basename($line),
                    'coverArt' => $coverArt
                ];
            }
        }
    } 
    // Parse PLS playlist files
    elseif ($extension === 'pls') {
        // Read entire file content
        $content = file_get_contents($fullPath);
        
        // Split content into lines
        $lines = explode("\n", $content);
        
        // Process each line
        foreach ($lines as $line) {
            // Match PLS file entries (File1=path, File2=path, etc.)
            if (preg_match('/^File\d+=(.+)$/', $line, $matches)) {
                // Sanitize the file path to prevent directory traversal
                $playlistEntry = $matches[1];
                
                // Prevent directory traversal in playlist entries
                if (strpos($playlistEntry, '..') !== false) {
                    continue; // Skip this entry
                }
                
                // Resolve relative paths based on playlist location
                $filePath = dirname($file) . '/' . $playlistEntry;
                $files[] = [
                    'path' => $filePath,
                    'title' => basename($playlistEntry),
                    'coverArt' => $coverArt
                ];
            }
        }
    } 
    // Unsupported playlist format
    else {
        echo json_encode(['error' => 'Unsupported playlist format']);
        return;
    }
    
    // Return JSON response with playlist contents
    echo json_encode(['files' => $files]);
}

/**
 * Check if a file is a cover art file
 * 
 * @param string $filename
 * @return bool
 */
function isCoverArt($filename) {
    $filename = strtolower($filename);
    $coverNames = ['cover', 'folder', 'album', 'front', 'artwork'];
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    
    // Remove extension for name checking
    $nameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
    
    // Check if filename matches common cover art names
    foreach ($coverNames as $coverName) {
        if (strpos($nameWithoutExt, $coverName) !== false) {
            return true;
        }
    }
    
    return false;
}

/**
 * Find cover art in a directory
 * 
 * @param string $directoryPath
 * @return string|null
 */
function findCoverArtInDirectory($directoryPath) {
    $coverNames = ['cover', 'folder', 'album', 'front', 'artwork'];
    $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    
    // Check if directory exists
    if (!is_dir($directoryPath)) {
        return null;
    }
    
    // Get directory contents
    $items = scandir($directoryPath);
    
    // Arrays to store potential cover art files
    $namedCoverArts = [];
    $anyImageFiles = [];
    
    // Look for cover art files in the main directory
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        
        $itemPath = $directoryPath . '/' . $item;
        if (is_file($itemPath)) {
            $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            
            // Check if it's an image file
            if (in_array($extension, $imageExtensions)) {
                // Check if it matches cover art naming
                if (isCoverArt($item)) {
                    $namedCoverArts[] = $itemPath;
                } else {
                    // Store any image file as fallback
                    $anyImageFiles[] = $itemPath;
                }
            }
        }
    }
    
    // Return named cover art first (prioritized by common names)
    if (!empty($namedCoverArts)) {
        // Sort by priority of cover art names
        usort($namedCoverArts, function($a, $b) use ($coverNames) {
            $nameA = strtolower(pathinfo($a, PATHINFO_FILENAME));
            $nameB = strtolower(pathinfo($b, PATHINFO_FILENAME));
            
            foreach ($coverNames as $priority => $coverName) {
                if (strpos($nameA, $coverName) !== false && strpos($nameB, $coverName) === false) {
                    return -1;
                }
                if (strpos($nameB, $coverName) !== false && strpos($nameA, $coverName) === false) {
                    return 1;
                }
            }
            return 0;
        });
        
        return $namedCoverArts[0];
    }
    
    // If no specific cover art found, return first image file found
    if (!empty($anyImageFiles)) {
        return $anyImageFiles[0];
    }
    
    // If no cover art found in main directory, check first-level subdirectories
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        
        $itemPath = $directoryPath . '/' . $item;
        if (is_dir($itemPath)) {
            // Recursively check subdirectory for cover art
            $subdirCoverArt = findCoverArtInSubdirectory($itemPath, $coverNames, $imageExtensions);
            if ($subdirCoverArt !== null) {
                return $subdirCoverArt;
            }
        }
    }
    
    return null;
}

/**
 * Find cover art in a subdirectory (first level only)
 * 
 * @param string $directoryPath
 * @param array $coverNames
 * @param array $imageExtensions
 * @return string|null
 */
function findCoverArtInSubdirectory($directoryPath, $coverNames, $imageExtensions) {
    // Check if directory exists
    if (!is_dir($directoryPath)) {
        return null;
    }
    
    // Get directory contents
    $items = scandir($directoryPath);
    
    // Arrays to store potential cover art files
    $namedCoverArts = [];
    $anyImageFiles = [];
    
    // Look for cover art files
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        
        $itemPath = $directoryPath . '/' . $item;
        if (is_file($itemPath)) {
            $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            
            // Check if it's an image file
            if (in_array($extension, $imageExtensions)) {
                // Check if it matches cover art naming
                if (isCoverArt($item)) {
                    $namedCoverArts[] = $itemPath;
                } else {
                    // Store any image file as fallback
                    $anyImageFiles[] = $itemPath;
                }
            }
        }
    }
    
    // Return named cover art first (prioritized by common names)
    if (!empty($namedCoverArts)) {
        // Sort by priority of cover art names
        usort($namedCoverArts, function($a, $b) use ($coverNames) {
            $nameA = strtolower(pathinfo($a, PATHINFO_FILENAME));
            $nameB = strtolower(pathinfo($b, PATHINFO_FILENAME));
            
            foreach ($coverNames as $priority => $coverName) {
                if (strpos($nameA, $coverName) !== false && strpos($nameB, $coverName) === false) {
                    return -1;
                }
                if (strpos($nameB, $coverName) !== false && strpos($nameA, $coverName) === false) {
                    return 1;
                }
            }
            return 0;
        });
        
        return $namedCoverArts[0];
    }
    
    // If no specific cover art found, return first image file found
    if (!empty($anyImageFiles)) {
        return $anyImageFiles[0];
    }
    
    return null;
}
?>
