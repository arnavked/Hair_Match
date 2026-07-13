"""
Generate Synthetic Training Data — HairMatch (B2-03)

Creates synthetic face shape feature data for pipeline testing.
Uses the same geometric feature definitions as the TypeScript extractor.

The synthetic data is NOT a substitute for real labeled data.
It generates feature vectors that approximate typical measurements
for each face shape, with controlled noise, so we can validate
the full train → export → inference pipeline end-to-end.

Usage:
    python ml/generate_synthetic_data.py --output ml/data/synthetic_train.csv --n-per-class 200
"""

import argparse
import numpy as np
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Feature names — must match FEATURE_NAMES in feature-extractor.types.ts
# ---------------------------------------------------------------------------

FEATURE_NAMES = [
    "faceHeightToWidthRatio",
    "foreheadWidthRatio",
    "jawWidthRatio",
    "cheekboneWidthRatio",
    "foreheadToJawRatio",
    "foreheadToCheekRatio",
    "jawToCheekRatio",
    "jawAngleLeft",
    "jawAngleRight",
    "chinToJawRatio",
    "foreheadHeight",
    "midFaceHeight",
    "lowerFaceHeight",
    "faceCircularity",
    "jawlineContourAngle",
    "templeToJawTaper",
    "cheekFullness",
    "facialSymmetry",
]

FACE_SHAPES = ["oval", "round", "square", "heart", "oblong"]

# ---------------------------------------------------------------------------
# Archetype feature profiles (mean, std per feature per shape)
# ---------------------------------------------------------------------------

# Each shape has a "typical" profile with small noise
SHAPE_PROFILES: dict[str, dict[str, tuple[float, float]]] = {
    "oval": {
        "faceHeightToWidthRatio": (1.50, 0.08),
        "foreheadWidthRatio": (0.85, 0.05),
        "jawWidthRatio": (0.78, 0.05),
        "cheekboneWidthRatio": (0.92, 0.04),
        "foreheadToJawRatio": (1.10, 0.08),
        "foreheadToCheekRatio": (0.92, 0.05),
        "jawToCheekRatio": (0.85, 0.05),
        "jawAngleLeft": (2.40, 0.15),
        "jawAngleRight": (2.40, 0.15),
        "chinToJawRatio": (0.35, 0.04),
        "foreheadHeight": (0.32, 0.03),
        "midFaceHeight": (0.18, 0.02),
        "lowerFaceHeight": (0.42, 0.03),
        "faceCircularity": (0.75, 0.05),
        "jawlineContourAngle": (2.50, 0.15),
        "templeToJawTaper": (0.08, 0.03),
        "cheekFullness": (0.04, 0.01),
        "facialSymmetry": (0.95, 0.03),
    },
    "round": {
        "faceHeightToWidthRatio": (1.05, 0.08),
        "foreheadWidthRatio": (0.82, 0.05),
        "jawWidthRatio": (0.80, 0.05),
        "cheekboneWidthRatio": (0.95, 0.04),
        "foreheadToJawRatio": (1.02, 0.06),
        "foreheadToCheekRatio": (0.86, 0.05),
        "jawToCheekRatio": (0.84, 0.05),
        "jawAngleLeft": (2.60, 0.12),
        "jawAngleRight": (2.60, 0.12),
        "chinToJawRatio": (0.38, 0.04),
        "foreheadHeight": (0.30, 0.03),
        "midFaceHeight": (0.20, 0.02),
        "lowerFaceHeight": (0.40, 0.03),
        "faceCircularity": (0.88, 0.04),
        "jawlineContourAngle": (2.70, 0.10),
        "templeToJawTaper": (0.03, 0.02),
        "cheekFullness": (0.08, 0.02),
        "facialSymmetry": (0.95, 0.03),
    },
    "square": {
        "faceHeightToWidthRatio": (1.08, 0.07),
        "foreheadWidthRatio": (0.88, 0.04),
        "jawWidthRatio": (0.88, 0.04),
        "cheekboneWidthRatio": (0.93, 0.04),
        "foreheadToJawRatio": (1.00, 0.05),
        "foreheadToCheekRatio": (0.95, 0.04),
        "jawToCheekRatio": (0.95, 0.04),
        "jawAngleLeft": (1.95, 0.12),
        "jawAngleRight": (1.95, 0.12),
        "chinToJawRatio": (0.40, 0.04),
        "foreheadHeight": (0.30, 0.03),
        "midFaceHeight": (0.20, 0.02),
        "lowerFaceHeight": (0.42, 0.03),
        "faceCircularity": (0.65, 0.05),
        "jawlineContourAngle": (2.20, 0.12),
        "templeToJawTaper": (0.02, 0.02),
        "cheekFullness": (0.03, 0.01),
        "facialSymmetry": (0.96, 0.02),
    },
    "heart": {
        "faceHeightToWidthRatio": (1.40, 0.08),
        "foreheadWidthRatio": (0.92, 0.04),
        "jawWidthRatio": (0.65, 0.05),
        "cheekboneWidthRatio": (0.88, 0.04),
        "foreheadToJawRatio": (1.42, 0.10),
        "foreheadToCheekRatio": (1.05, 0.05),
        "jawToCheekRatio": (0.74, 0.05),
        "jawAngleLeft": (2.30, 0.15),
        "jawAngleRight": (2.30, 0.15),
        "chinToJawRatio": (0.28, 0.04),
        "foreheadHeight": (0.34, 0.03),
        "midFaceHeight": (0.18, 0.02),
        "lowerFaceHeight": (0.38, 0.03),
        "faceCircularity": (0.70, 0.05),
        "jawlineContourAngle": (2.40, 0.12),
        "templeToJawTaper": (0.18, 0.04),
        "cheekFullness": (0.03, 0.01),
        "facialSymmetry": (0.94, 0.03),
    },
    "oblong": {
        "faceHeightToWidthRatio": (1.75, 0.10),
        "foreheadWidthRatio": (0.82, 0.05),
        "jawWidthRatio": (0.78, 0.05),
        "cheekboneWidthRatio": (0.85, 0.04),
        "foreheadToJawRatio": (1.05, 0.07),
        "foreheadToCheekRatio": (0.96, 0.05),
        "jawToCheekRatio": (0.92, 0.05),
        "jawAngleLeft": (2.35, 0.15),
        "jawAngleRight": (2.35, 0.15),
        "chinToJawRatio": (0.32, 0.04),
        "foreheadHeight": (0.30, 0.03),
        "midFaceHeight": (0.18, 0.02),
        "lowerFaceHeight": (0.45, 0.03),
        "faceCircularity": (0.60, 0.05),
        "jawlineContourAngle": (2.40, 0.12),
        "templeToJawTaper": (0.06, 0.03),
        "cheekFullness": (0.02, 0.01),
        "facialSymmetry": (0.95, 0.03),
    },
}


def generate_samples(shape: str, n: int, rng: np.random.Generator) -> pd.DataFrame:
    """Generate n synthetic feature samples for a face shape."""
    profile = SHAPE_PROFILES[shape]
    data: dict[str, np.ndarray] = {}

    for feat in FEATURE_NAMES:
        mean, std = profile[feat]
        data[feat] = rng.normal(mean, std, size=n).clip(0)  # No negative values

    df = pd.DataFrame(data)
    df["label"] = shape
    return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic face shape training data")
    parser.add_argument("--output", type=str, default="ml/data/synthetic_train.csv",
                        help="Output CSV path")
    parser.add_argument("--n-per-class", type=int, default=200,
                        help="Samples per face shape class")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)
    dfs = [generate_samples(shape, args.n_per_class, rng) for shape in FACE_SHAPES]
    df = pd.concat(dfs, ignore_index=True)

    # Shuffle
    df = df.sample(frac=1, random_state=args.seed).reset_index(drop=True)

    # Ensure output dir exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} samples ({args.n_per_class} per class) → {output_path}")
    print(f"Class distribution:\n{df['label'].value_counts().to_string()}")


if __name__ == "__main__":
    main()
