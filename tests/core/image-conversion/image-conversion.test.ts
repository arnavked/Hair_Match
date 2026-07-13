import { describe, it, expect, vi } from 'vitest';
import { isHeicFile, convertToJpegIfNeeded } from '@/core/image-conversion/image-conversion';

// Mock heic2any
vi.mock('heic2any', () => {
  return {
    default: vi.fn().mockImplementation(async ({ blob: _blob }) => {
      // Return a simulated JPEG blob
      return new Blob(['simulated-jpeg'], { type: 'image/jpeg' });
    }),
  };
});

describe('HEIC to JPEG Conversion', () => {
  it('correctly detects HEIC files by mime type', () => {
    const file = new File([''], 'photo.heic', { type: 'image/heic' });
    expect(isHeicFile(file)).toBe(true);

    const file2 = new File([''], 'photo.heif', { type: 'image/heif' });
    expect(isHeicFile(file2)).toBe(true);
  });

  it('correctly detects HEIC files by extension fallback when mime is empty', () => {
    const file = new File([''], 'photo.HEIC', { type: '' });
    expect(isHeicFile(file)).toBe(true);

    const file2 = new File([''], 'photo.heif', { type: 'application/octet-stream' });
    expect(isHeicFile(file2)).toBe(true);
  });

  it('correctly ignores non-HEIC files', () => {
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    expect(isHeicFile(file)).toBe(false);

    const file2 = new File([''], 'photo.png', { type: 'image/png' });
    expect(isHeicFile(file2)).toBe(false);
  });

  it('returns original file unchanged if not HEIC', async () => {
    const file = new File(['original-jpeg'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await convertToJpegIfNeeded(file);
    expect(result).toBe(file);
  });

  it('converts HEIC file to JPEG and changes extension', async () => {
    const file = new File(['heic-content'], 'my_selfie.heic', { type: 'image/heic' });
    const result = await convertToJpegIfNeeded(file);
    
    expect(result).not.toBe(file);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('my_selfie.jpg');
  });
});
