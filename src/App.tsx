/**
 * HairMatch — Root App Component (v0.3.0)
 *
 * Full Bucket 1 + 2 + 3 flow:
 * Upload/Camera → Detect → Validate → Extract → Classify → Preferences → Results
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFaceDetection } from './hooks/useFaceDetection';
import { useCamera } from './hooks/useCamera';
import { validatePhoto } from './core/photo-validation';
import { convertToJpegIfNeeded, ACCEPTED_IMAGE_FORMATS } from './core/image-conversion';
import { extractFeatures } from './core/feature-extraction';
import { classifyFaceShape } from './core/classifier';
import { recommend } from './core/recommender';
import { LandmarkOverlay } from './components/debug/LandmarkOverlay';
import { ShapeConfidenceChart } from './components/debug/ShapeConfidenceChart';
import { PreferenceForm } from './components/PreferenceForm';
import { ResultsScreen } from './components/ResultsScreen';
import type { FaceDetectionResult } from './core/face-detection';
import type { ValidationResult } from './core/photo-validation';
import type { ClassificationResult } from './core/classifier';
import type { ScoredRecommendation, UserPreferences } from './core/recommender';

// ---------------------------------------------------------------------------
// App state machine
// ---------------------------------------------------------------------------

type AppStep =
  | 'idle'           // Upload/camera prompt
  | 'camera'         // Camera viewfinder active
  | 'processing'     // Running the pipeline
  | 'invalid-photo'  // Validation failure
  | 'preferences'    // Show preference form
  | 'results'        // Show style recommendations
  | 'error';         // Fatal error

export function App() {
  const { t } = useTranslation();
  const { detect, isLoading, error: detectionError } = useFaceDetection();
  const { videoRef, start: startCamera, capture, stop: stopCamera, isActive: cameraActive, hasCamera } = useCamera();

  const [step, setStep] = useState<AppStep>('idle');
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [photoDimensions, setPhotoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [detectionResults, setDetectionResults] = useState<FaceDetectionResult[] | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [recommendations, setRecommendations] = useState<ScoredRecommendation[]>([]);
  const [processingStep, setProcessingStep] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Photo processing pipeline
  // ---------------------------------------------------------------------------

  const processImage = useCallback(
    async (imageBitmap: ImageBitmap, imageUrl: string) => {
      setStep('processing');
      setPhotoSrc(imageUrl);
      setPhotoDimensions({ width: imageBitmap.width, height: imageBitmap.height });
      setDetectionResults(null);
      setValidationResult(null);
      setClassificationResult(null);

      try {
        // Step 1: Detect
        setProcessingStep(t('processing.step1'));
        const results = await detect(imageBitmap);

        // Step 2: Validate
        setProcessingStep(t('processing.step2'));
        const validation = validatePhoto(results, imageBitmap.width, imageBitmap.height);

        setDetectionResults(results);
        setValidationResult(validation);

        if (!validation.isValid) {
          setStep('invalid-photo');
          return;
        }

        // Step 3: Extract features
        setProcessingStep(t('processing.step3'));
        const features = extractFeatures(results[0].landmarks);

        // Step 4: Classify
        setProcessingStep(t('processing.step4'));
        const classification = await classifyFaceShape(features);

        setClassificationResult(classification);
        setStep('preferences');
      } catch (err) {
        console.error('Pipeline error:', err);
        setStep('error');
      }
    },
    [detect, t]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = ''; // allow re-upload of same file
      try {
        const processed = await convertToJpegIfNeeded(file);
        const imageUrl = URL.createObjectURL(processed);
        const bitmap = await createImageBitmap(processed);
        await processImage(bitmap, imageUrl);
      } catch (err) {
        console.error('File processing error:', err);
        setStep('error');
      }
    },
    [processImage]
  );

  const handleCameraCapture = useCallback(async () => {
    try {
      const frame = await capture();
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(frame, 0, 0);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      await processImage(frame, imageUrl);
    } catch (err) {
      console.error('Camera capture error:', err);
      setStep('error');
    }
  }, [capture, stopCamera, processImage]);

  const handlePreferenceSubmit = useCallback(
    (prefs: UserPreferences) => {
      if (!classificationResult) return;
      const recs = recommend(classificationResult.scores, prefs, 6);
      setRecommendations(recs);
      setStep('results');
    },
    [classificationResult]
  );

  const handleReset = useCallback(() => {
    setStep('idle');
    setPhotoSrc(null);
    setPhotoDimensions(null);
    setDetectionResults(null);
    setValidationResult(null);
    setClassificationResult(null);
    setRecommendations([]);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-title-gradient">HairMatch</span>
        </h1>
        <p className="app-subtitle">{t('landing.subtitle')}</p>
      </header>

      <main className="app-main">

        {/* ── IDLE: Upload / Camera ── */}
        {step === 'idle' && (
          <div className="upload-section">
            <div className="upload-card">
              <div className="upload-icon">📸</div>
              <h2>{t('landing.title')}</h2>
              <p className="privacy-note">🔒 {t('landing.privacyNote')}</p>
              <div className="upload-actions">
                <button
                  id="btn-upload"
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('landing.uploadCta')}
                </button>
                {hasCamera && (
                  <button
                    id="btn-camera"
                    className="btn btn-secondary"
                    onClick={() => { startCamera(); setStep('camera'); }}
                  >
                    {t('landing.cameraCta')}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_FORMATS}
                onChange={handleFileUpload}
                className="file-input-hidden"
                aria-label={t('landing.uploadCta')}
              />
            </div>
          </div>
        )}

        {/* ── CAMERA ── */}
        {step === 'camera' && cameraActive && (
          <div className="camera-section">
            <div className="camera-viewfinder">
              <video ref={videoRef} className="camera-video" />
              <div className="camera-guide" />
            </div>
            <div className="camera-controls">
              <button className="btn btn-secondary" onClick={() => { stopCamera(); setStep('idle'); }}>
                {t('common.cancel')}
              </button>
              <button id="btn-capture" className="btn btn-capture" onClick={handleCameraCapture}>
                {t('camera.captureButton')}
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="processing-section" aria-live="polite">
            <div className="processing-spinner" />
            <p className="processing-text">{processingStep || t('common.processing')}</p>
          </div>
        )}

        {(isLoading && step !== 'processing') && (
          <div className="processing-section" aria-live="polite">
            <div className="processing-spinner" />
            <p className="processing-text">{t('common.processing')}</p>
          </div>
        )}

        {/* ── INVALID PHOTO ── */}
        {step === 'invalid-photo' && validationResult && (
          <div className="results-section">
            {photoSrc && (
              <div className="photo-container">
                <img src={photoSrc} alt="Uploaded face photo" className="photo-preview" />
              </div>
            )}
            <div className="validation-error" role="alert">
              <div className="validation-error-icon">⚠️</div>
              <h3>{t('validation.title')}</h3>
              {validationResult.reasonCode && (
                <p>{t(`validation.${validationResult.reasonCode}`)}</p>
              )}
              <div className="photo-tips">
                <p className="tips-title">{t('validation.tips.title')}</p>
                <ul>
                  <li>{t('validation.tips.tip1')}</li>
                  <li>{t('validation.tips.tip2')}</li>
                  <li>{t('validation.tips.tip3')}</li>
                  <li>{t('validation.tips.tip4')}</li>
                  <li>{t('validation.tips.tip5')}</li>
                </ul>
              </div>
              <button className="btn btn-primary" onClick={handleReset}>
                {t('validation.retakeCta')}
              </button>
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {step === 'preferences' && classificationResult && (
          <div className="results-section">
            {/* Shape mini result */}
            <div className="photo-and-shape">
              {photoSrc && (
                <div className="photo-container photo-container-sm">
                  <img src={photoSrc} alt="Your photo" className="photo-preview" />
                  {detectionResults?.[0] && photoDimensions && (
                    <LandmarkOverlay
                      landmarks={detectionResults[0].landmarks}
                      imageWidth={photoDimensions.width}
                      imageHeight={photoDimensions.height}
                    />
                  )}
                </div>
              )}
              <div className="shape-result-mini">
                <div className="shape-emoji">{getShapeEmoji(classificationResult.dominantShape)}</div>
                <div>
                  <p className="shape-name-sm">{t(`shapes.${classificationResult.dominantShape}`)}</p>
                  <p className="shape-confidence-sm">
                    {(classificationResult.confidence * 100).toFixed(0)}% {t('results.confidence')}
                  </p>
                </div>
              </div>
            </div>

            {/* Debug confidence chart */}
            <ShapeConfidenceChart
              scores={classificationResult.scores}
              classifierType={classificationResult.classifierType}
            />

            <PreferenceForm onSubmit={handlePreferenceSubmit} />
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === 'results' && classificationResult && detectionResults?.[0] && photoDimensions && (
          <ResultsScreen
            recommendations={recommendations}
            dominantShape={classificationResult.dominantShape}
            photoSrc={photoSrc!}
            photoWidth={photoDimensions.width}
            photoHeight={photoDimensions.height}
            landmarks={detectionResults[0].landmarks}
            onReset={handleReset}
          />
        )}

        {/* ── ERROR ── */}
        {(step === 'error' || detectionError) && (
          <div className="error-section" role="alert">
            <p className="error-text">
              {detectionError?.code === 'MODEL_LOAD_FAILED'
                ? t('errors.modelLoadFailed')
                : t('errors.generic')}
            </p>
            <button className="btn btn-primary" onClick={handleReset}>
              {t('common.retry')}
            </button>
          </div>
        )}

      </main>

      <footer className="app-footer">
        <p>HairMatch v0.3.0 · Alpha</p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getShapeEmoji(shape: string): string {
  const map: Record<string, string> = {
    oval: '🥚', round: '🔵', square: '🟨', heart: '💜', oblong: '📏',
  };
  return map[shape] ?? '🔷';
}
