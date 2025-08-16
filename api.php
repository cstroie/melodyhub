<?php
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listDirectory();
        break;
    case 'play':
        playAudio();
        break;
    case 'loadPlaylist':
        loadPlaylist();
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

function listDirectory() {
    $basePath = __DIR__ . '/audio'; // Change this to your audio directory
    $path = $_GET['path'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $path);
    if (!$fullPath || strpos($fullPath, realpath($basePath)) !== 0) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    if (!is_dir($fullPath)) {
        echo json_encode(['error' => 'Directory not found']);
        return;
    }
    
    $files = [];
    $items = scandir($fullPath);
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        
        $itemPath = $fullPath . '/' . $item;
        $relativePath = $path ? $path . '/' . $item : $item;
        
        if (is_dir($itemPath)) {
            $files[] = [
                'name' => $item,
                'type' => 'directory',
                'path' => $relativePath
            ];
        } else {
            $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            $files[] = [
                'name' => $item,
                'type' => 'file',
                'extension' => $extension,
                'path' => $relativePath
            ];
        }
    }
    
    // Sort: directories first, then files
    usort($files, function($a, $b) {
        if ($a['type'] === $b['type']) {
            return strcmp($a['name'], $b['name']);
        }
        return $a['type'] === 'directory' ? -1 : 1;
    });
    
    echo json_encode(['files' => $files]);
}

function playAudio() {
    $basePath = __DIR__ . '/audio'; // Change this to your audio directory
    $file = $_GET['file'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $file);
    if (!$fullPath || strpos($fullPath, realpath($basePath)) !== 0) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    if (!file_exists($fullPath)) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Determine content type
    $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'mp3' => 'audio/mpeg',
        'wav' => 'audio/wav',
        'ogg' => 'audio/ogg',
        'flac' => 'audio/flac',
        'm4a' => 'audio/mp4',
        'aac' => 'audio/aac'
    ];
    
    $contentType = $mimeTypes[$extension] ?? 'audio/mpeg';
    
    // Set headers
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($fullPath));
    header('Accept-Ranges: bytes');
    
    // Stream the file
    readfile($fullPath);
    exit;
}

function loadPlaylist() {
    $basePath = __DIR__ . '/audio'; // Change this to your audio directory
    $file = $_GET['path'] ?? '';
    
    // Security check to prevent directory traversal
    $fullPath = realpath($basePath . '/' . $file);
    if (!$fullPath || strpos($fullPath, realpath($basePath)) !== 0) {
        echo json_encode(['error' => 'Invalid path']);
        return;
    }
    
    if (!file_exists($fullPath)) {
        echo json_encode(['error' => 'Playlist not found']);
        return;
    }
    
    $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    $files = [];
    
    if ($extension === 'm3u' || $extension === 'm3u8') {
        $content = file_get_contents($fullPath);
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line && !$line.startsWith('#')) {
                // Resolve relative paths
                $filePath = dirname($file) . '/' . $line;
                $files[] = [
                    'path' => $filePath,
                    'title' => basename($line)
                ];
            }
        }
    } elseif ($extension === 'pls') {
        $content = file_get_contents($fullPath);
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            if (preg_match('/^File\d+=(.+)$/', $line, $matches)) {
                $filePath = dirname($file) . '/' . $matches[1];
                $files[] = [
                    'path' => $filePath,
                    'title' => basename($matches[1])
                ];
            }
        }
    } else {
        echo json_encode(['error' => 'Unsupported playlist format']);
        return;
    }
    
    echo json_encode(['files' => $files]);
}
?>
