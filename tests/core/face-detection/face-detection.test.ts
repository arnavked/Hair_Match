import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFaceLandmarkerService } from '@/core/face-detection/face-detection';

// Use vi.hoisted to declare variables that are accessible inside vi.mock calls
const { mockDetect, mockClose } = vi.hoisted(() => ({
  mockDetect: vi.fn(),
  mockClose: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => {
  return {
    FilesetResolver: {
      forVisionTasks: vi.fn().mockResolvedValue({}),
    },
    FaceLandmarker: {
      createFromOptions: vi.fn().mockResolvedValue({
        detect: mockDetect,
        close: mockClose,
      }),
    },
  };
});

describe('Face Landmarker Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const service = createFaceLandmarkerService();
    service.dispose(); // clean singleton state
  });

  it('initializes and is ready', async () => {
    const service = createFaceLandmarkerService();
    expect(service.isReady()).toBe(false);

    await service.initialize();
    expect(service.isReady()).toBe(true);
  });

  it('calls mediaPipe detect and processes results', async () => {
    const service = createFaceLandmarkerService();
    await service.initialize();

    // Mock response with 1 face
    const mockLandmarks = Array.from({ length: 468 }, (_, i) => ({
      x: 0.1 * i,
      y: 0.2 * i,
      z: 0,
      visibility: 0.9,
    }));

    mockDetect.mockReturnValue({
      faceLandmarks: [mockLandmarks],
    });

    const canvas = document.createElement('canvas');
    const results = await service.detect(canvas);

    expect(mockDetect).toHaveBeenCalledWith(canvas);
    expect(results).toHaveLength(1);
    expect(results[0].faceCount).toBe(1);
    expect(results[0].landmarks).toHaveLength(468);
    expect(results[0].boundingBox).toEqual({
      x: 0,
      y: 0,
      width: expect.any(Number),
      height: expect.any(Number),
    });
    expect(results[0].processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('returns empty array when no faces are detected', async () => {
    const service = createFaceLandmarkerService();
    await service.initialize();

    mockDetect.mockReturnValue({
      faceLandmarks: [],
    });

    const canvas = document.createElement('canvas');
    const results = await service.detect(canvas);
    expect(results).toEqual([]);
  });

  it('throws error if detect is called before initialization', async () => {
    const service = createFaceLandmarkerService();
    const canvas = document.createElement('canvas');
    await expect(service.detect(canvas)).rejects.toThrow(
      'FaceLandmarkerService not initialized. Call initialize() first.'
    );
  });
});
