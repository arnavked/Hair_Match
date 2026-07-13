/**
 * Image Conversion Module — HairMatch (B1-07)
 *
 * Client-side HEIC/HEIF to JPEG conversion using heic2any.
 * Transparent to callers — returns the original file unchanged if
 * it's not HEIC/HEIF.
 */

import heic2any from 'heic2any';

// ---------------------------------------------------------------------------
// HEIC detection
// ---------------------------------------------------------------------------

/** MIME types that indicate HEIC/HEIF format. */
const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/** File extensions that indicate HEIC/HEIF format. */
const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

/**
 * Check if a file is in HEIC/HEIF format.
 *
 * Detection uses both MIME type and file extension because:
 * - Some browsers report 'image/heic' correctly
 * - Others report '' or 'application/octet-stream' for HEIC files
 * - Extension fallback catches the latter case
 */
export function isHeicFile(file: File): boolean {
  // Check MIME type first
  if (HEIC_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  // Fallback: check file extension
  if (HEIC_EXTENSIONS.test(file.name)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/** JPEG quality for HEIC conversion. Per B1-07 acceptance criteria: >= 85% */
const JPEG_QUALITY = 0.85;

/**
 * Convert a file to JPEG if it's HEIC/HEIF. Returns the original file
 * unchanged for any other format.
 *
 * @param file - The input file (from <input type="file"> or drag-and-drop).
 * @returns A JPEG File if the input was HEIC, otherwise the original file.
 * @throws Error if HEIC conversion fails.
 */
export async function convertToJpegIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const conversionResult = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: JPEG_QUALITY,
    });

    // heic2any may return a single Blob or an array (for multi-image HEIC)
    const jpegBlob = Array.isArray(conversionResult)
      ? conversionResult[0]
      : conversionResult;

    // Create a new File with .jpg extension
    const newName = file.name.replace(HEIC_EXTENSIONS, '.jpg');

    return new File([jpegBlob], newName, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch (error) {
    throw new Error(
      `HEIC conversion failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Supported formats
// ---------------------------------------------------------------------------

/** File input accept string for all supported image formats (FR-01). */
export const ACCEPTED_IMAGE_FORMATS =
  'image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif';
