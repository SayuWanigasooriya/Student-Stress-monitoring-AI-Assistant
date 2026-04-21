#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a mental health status classifier from Combined Data.csv.")
    parser.add_argument("--csv", default="/Users/sandarunipuna/Downloads/Combined Data.csv")
    parser.add_argument("--output-dir", default=str(Path(__file__).resolve().parent / "data"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    df = pd.read_csv(args.csv)
    if "statement" not in df.columns or "status" not in df.columns:
        raise ValueError("CSV must contain 'statement' and 'status' columns.")

    clean = df[["statement", "status"]].dropna().copy()
    clean["statement"] = clean["statement"].astype(str).str.strip()
    clean["status"] = clean["status"].astype(str).str.strip()
    clean = clean[(clean["statement"] != "") & (clean["status"] != "")]

    labels = sorted(clean["status"].unique().tolist())
    model = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    stop_words="english",
                    ngram_range=(1, 2),
                    min_df=2,
                    max_features=50000,
                    sublinear_tf=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=400,
                    class_weight="balanced",
                    solver="liblinear",
                ),
            ),
        ]
    )
    model.fit(clean["statement"], clean["status"])

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_dir / "mental_health_status_model.joblib")
    joblib.dump(labels, output_dir / "mental_health_status_labels.joblib")

    print(f"Rows used: {len(clean)}")
    print(f"Classes: {labels}")


if __name__ == "__main__":
    main()
