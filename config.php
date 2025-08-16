<?php
/**
 * MelodyHub Configuration File
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
 * MelodyHub Configuration File
 * 
 * This file contains all user-configurable settings for the MelodyHub application.
 */

// Base path for audio files - change this to your audio directory
// Uses AUDIO_DIR environment variable if set, otherwise defaults to ./audio
$basePath = getenv('AUDIO_DIR') ?: __DIR__ . '/audio';

?>
