"""
Classifier Training Script — HairMatch (B2-04)

Trains a face shape classifier on labeled feature data and exports
the best model as an ONNX file for browser inference.

Pipeline:
  1. Load labeled CSV (18 features + label)
  2. Train/test split (80/20, stratified)
  3. StandardScaler normalization
  4. Train 3 model types: SVM (RBF), Random Forest, MLP
  5. Hyperparameter tuning via GridSearchCV (5-fold CV, macro F1)
  6. Select best model → retrain on full training set
  7. Evaluate on held-out test set
  8. Export to ONNX with scaler embedded in pipeline
  9. Produce: model.onnx, metrics.json, confusion_matrix.png

Usage:
    python ml/train.py --data ml/data/synthetic_train.csv --output ml/output/
    python ml/train.py --test  # Quick test with synthetic data
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    f1_score,
)

from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType


# ---------------------------------------------------------------------------
# Feature names (must match TypeScript FEATURE_NAMES)
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
NUM_FEATURES = len(FEATURE_NAMES)


def load_data(path: str) -> tuple[np.ndarray, np.ndarray, LabelEncoder]:
    """Load labeled CSV and return features, encoded labels, and encoder."""
    df = pd.read_csv(path)

    # Validate columns
    missing = set(FEATURE_NAMES) - set(df.columns)
    if missing:
        raise ValueError(f"Missing feature columns: {missing}")
    if "label" not in df.columns:
        raise ValueError("CSV must have a 'label' column")

    X = df[FEATURE_NAMES].values.astype(np.float32)
    le = LabelEncoder()
    le.fit(FACE_SHAPES)  # Fixed order
    y = le.transform(df["label"].values)

    print(f"Loaded {len(X)} samples, {len(np.unique(y))} classes")
    print(f"Class distribution: {dict(zip(le.classes_, np.bincount(y)))}")

    return X, y, le


def build_pipelines() -> dict[str, tuple[Pipeline, dict]]:
    """Build model pipelines with hyperparameter grids."""
    return {
        "SVM": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("clf", SVC(probability=True)),
            ]),
            {
                "clf__C": [0.1, 1.0, 10.0],
                "clf__kernel": ["rbf"],
                "clf__gamma": ["scale", "auto"],
            },
        ),
        "RandomForest": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("clf", RandomForestClassifier(random_state=42)),
            ]),
            {
                "clf__n_estimators": [50, 100, 200],
                "clf__max_depth": [5, 10, None],
                "clf__min_samples_split": [2, 5],
            },
        ),
        "MLP": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("clf", MLPClassifier(max_iter=500, random_state=42)),
            ]),
            {
                "clf__hidden_layer_sizes": [(64, 32), (128, 64), (32,)],
                "clf__alpha": [0.0001, 0.001],
                "clf__learning_rate": ["adaptive"],
            },
        ),
    }


def train_and_evaluate(
    X: np.ndarray, y: np.ndarray, le: LabelEncoder, output_dir: Path
) -> dict:
    """Train models, select best, evaluate, and export."""

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain: {len(X_train)}, Test: {len(X_test)}")

    # Train each model with GridSearchCV
    pipelines = build_pipelines()
    best_model_name = None
    best_score = -1.0
    best_pipeline = None
    results: dict[str, dict] = {}

    for name, (pipeline, param_grid) in pipelines.items():
        print(f"\n--- Training {name} ---")
        grid = GridSearchCV(
            pipeline, param_grid,
            cv=5, scoring="f1_macro", n_jobs=-1, verbose=0
        )
        grid.fit(X_train, y_train)

        cv_score = grid.best_score_
        test_preds = grid.best_estimator_.predict(X_test)
        test_f1 = f1_score(y_test, test_preds, average="macro")

        print(f"  CV F1 (macro): {cv_score:.4f}")
        print(f"  Test F1 (macro): {test_f1:.4f}")
        print(f"  Best params: {grid.best_params_}")

        results[name] = {
            "cv_f1_macro": round(cv_score, 4),
            "test_f1_macro": round(test_f1, 4),
            "best_params": grid.best_params_,
        }

        if cv_score > best_score:
            best_score = cv_score
            best_model_name = name
            best_pipeline = grid.best_estimator_

    print(f"\n=== Best model: {best_model_name} (CV F1: {best_score:.4f}) ===\n")

    # Final evaluation on test set
    assert best_pipeline is not None
    y_pred = best_pipeline.predict(X_test)
    report = classification_report(
        y_test, y_pred, target_names=le.classes_, output_dict=True
    )
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(cm, display_labels=le.classes_)
    fig, ax = plt.subplots(figsize=(8, 6))
    disp.plot(ax=ax, cmap="Blues")
    ax.set_title(f"Confusion Matrix — {best_model_name}")
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png", dpi=150)
    plt.close()
    print(f"Saved confusion matrix → {output_dir / 'confusion_matrix.png'}")

    # Export to ONNX
    onnx_path = output_dir / "face_shape_classifier.onnx"
    initial_types = [("float_input", FloatTensorType([None, NUM_FEATURES]))]

    # Retrain best pipeline on full training data
    best_pipeline.fit(X_train, y_train)

    onnx_model = convert_sklearn(
        best_pipeline, initial_types=initial_types,
        target_opset=15,
        options={id(best_pipeline): {"zipmap": False}},
    )
    with open(onnx_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"Exported ONNX model → {onnx_path}")

    # Save metrics
    metrics = {
        "best_model": best_model_name,
        "best_cv_f1_macro": best_score,
        "test_classification_report": report,
        "all_models": results,
        "num_features": NUM_FEATURES,
        "feature_names": FEATURE_NAMES,
        "class_names": list(le.classes_),
    }
    metrics_path = output_dir / "metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2, default=str)
    print(f"Saved metrics → {metrics_path}")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train face shape classifier")
    parser.add_argument("--data", type=str, default="ml/data/synthetic_train.csv")
    parser.add_argument("--output", type=str, default="ml/output/")
    parser.add_argument("--test", action="store_true",
                        help="Quick test: generate synthetic data, train, and export")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.test:
        # Generate synthetic data first
        print("=== Test mode: generating synthetic data ===")
        data_dir = Path("ml/data")
        data_dir.mkdir(parents=True, exist_ok=True)
        data_path = data_dir / "synthetic_train.csv"

        # Import and run the generator
        sys.path.insert(0, str(Path(__file__).parent))
        from generate_synthetic_data import generate_samples
        import numpy as np

        rng = np.random.default_rng(42)
        dfs = [generate_samples(shape, 100, rng) for shape in FACE_SHAPES]
        df = pd.concat(dfs, ignore_index=True).sample(frac=1, random_state=42)
        df.to_csv(data_path, index=False)
        print(f"Generated {len(df)} test samples → {data_path}")
        args.data = str(data_path)

    # Load and train
    X, y, le = load_data(args.data)
    metrics = train_and_evaluate(X, y, le, output_dir)

    # Copy model to public/models/ for web serving
    src_model = output_dir / "face_shape_classifier.onnx"
    if src_model.exists():
        web_model_dir = Path("public/models")
        web_model_dir.mkdir(parents=True, exist_ok=True)
        dst_model = web_model_dir / "face_shape_classifier.onnx"
        import shutil
        shutil.copy2(src_model, dst_model)
        print(f"\nCopied model to web assets → {dst_model}")

    print(f"\n✅ Training complete! Best model: {metrics['best_model']} "
          f"(F1: {metrics['best_cv_f1_macro']:.4f})")


if __name__ == "__main__":
    main()
