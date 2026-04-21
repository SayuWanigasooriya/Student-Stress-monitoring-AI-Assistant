#!/usr/bin/env python3
"""
Evaluate the emotion API with a labeled CSV dataset.

CSV format:
text,label
"I feel overwhelmed with exams",stress
"I am calm and happy today",joy
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate the emotion API against a labeled CSV file.")
    parser.add_argument("--csv", required=True, help="Path to evaluation CSV with text and label columns.")
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:8001/predict-emotion",
        help="Emotion API endpoint. Default: http://127.0.0.1:8001/predict-emotion",
    )
    parser.add_argument("--text-column", default="text", help="CSV column containing the input text.")
    parser.add_argument("--label-column", default="label", help="CSV column containing the expected label.")
    parser.add_argument(
        "--output-json",
        help="Optional path to save the full evaluation report as JSON.",
    )
    return parser.parse_args()


def read_dataset(path: str, text_column: str, label_column: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if text_column not in (reader.fieldnames or []) or label_column not in (reader.fieldnames or []):
            raise ValueError(
                f"CSV must include '{text_column}' and '{label_column}' columns. "
                f"Found: {reader.fieldnames or []}"
            )

        for row in reader:
            text = (row.get(text_column) or "").strip()
            label = (row.get(label_column) or "").strip()
            if not text or not label:
                continue
            rows.append({"text": text, "label": label})

    if not rows:
        raise ValueError("No valid rows found in the evaluation CSV.")
    return rows


def call_api(url: str, text: str) -> tuple[str, float, float]:
    payload = json.dumps({"text": text}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Failed to call emotion API at {url}: {exc}") from exc
    elapsed_ms = (time.perf_counter() - started) * 1000
    return body["emotion"], float(body.get("score", 0.0)), elapsed_ms


def safe_divide(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def compute_metrics(expected: list[str], predicted: list[str]) -> dict[str, object]:
    labels = sorted(set(expected) | set(predicted))
    per_label: dict[str, dict[str, float]] = {}
    confusion: dict[str, dict[str, int]] = {
        actual: {pred: 0 for pred in labels} for actual in labels
    }

    for actual, pred in zip(expected, predicted):
        confusion[actual][pred] += 1

    total = len(expected)
    correct = sum(1 for actual, pred in zip(expected, predicted) if actual == pred)
    accuracy = safe_divide(correct, total)

    macro_precision = 0.0
    macro_recall = 0.0
    macro_f1 = 0.0

    for label in labels:
        tp = sum(1 for a, p in zip(expected, predicted) if a == label and p == label)
        fp = sum(1 for a, p in zip(expected, predicted) if a != label and p == label)
        fn = sum(1 for a, p in zip(expected, predicted) if a == label and p != label)
        support = sum(1 for a in expected if a == label)

        precision = safe_divide(tp, tp + fp)
        recall = safe_divide(tp, tp + fn)
        f1 = safe_divide(2 * precision * recall, precision + recall) if precision + recall else 0.0

        per_label[label] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": support,
        }
        macro_precision += precision
        macro_recall += recall
        macro_f1 += f1

    label_count = len(labels) if labels else 1
    macro_precision /= label_count
    macro_recall /= label_count
    macro_f1 /= label_count

    weighted_precision = 0.0
    weighted_recall = 0.0
    weighted_f1 = 0.0
    for label in labels:
        support = per_label[label]["support"]
        weight = safe_divide(support, total)
        weighted_precision += per_label[label]["precision"] * weight
        weighted_recall += per_label[label]["recall"] * weight
        weighted_f1 += per_label[label]["f1"] * weight

    return {
        "accuracy": accuracy,
        "macro_precision": macro_precision,
        "macro_recall": macro_recall,
        "macro_f1": macro_f1,
        "weighted_precision": weighted_precision,
        "weighted_recall": weighted_recall,
        "weighted_f1": weighted_f1,
        "labels": labels,
        "per_label": per_label,
        "confusion_matrix": confusion,
    }


def round_report(value: float) -> float:
    return round(value, 4)


def main() -> None:
    args = parse_args()
    rows = read_dataset(args.csv, args.text_column, args.label_column)

    expected: list[str] = []
    predicted: list[str] = []
    confidences: list[float] = []
    response_times_ms: list[float] = []
    mismatches: list[dict[str, object]] = []

    for row in rows:
        predicted_label, confidence, elapsed_ms = call_api(args.url, row["text"])
        expected_label = row["label"]

        expected.append(expected_label)
        predicted.append(predicted_label)
        confidences.append(confidence)
        response_times_ms.append(elapsed_ms)

        if predicted_label != expected_label:
            mismatches.append(
                {
                    "text": row["text"],
                    "expected": expected_label,
                    "predicted": predicted_label,
                    "confidence": round_report(confidence),
                    "response_time_ms": round_report(elapsed_ms),
                }
            )

    metrics = compute_metrics(expected, predicted)
    report = {
        "sample_count": len(rows),
        "accuracy": round_report(metrics["accuracy"]),
        "precision": round_report(metrics["macro_precision"]),
        "recall": round_report(metrics["macro_recall"]),
        "f1_score": round_report(metrics["macro_f1"]),
        "average_response_time_ms": round_report(statistics.mean(response_times_ms)),
        "median_response_time_ms": round_report(statistics.median(response_times_ms)),
        "min_response_time_ms": round_report(min(response_times_ms)),
        "max_response_time_ms": round_report(max(response_times_ms)),
        "average_confidence": round_report(statistics.mean(confidences)),
        "weighted_precision": round_report(metrics["weighted_precision"]),
        "weighted_recall": round_report(metrics["weighted_recall"]),
        "weighted_f1": round_report(metrics["weighted_f1"]),
        "labels": metrics["labels"],
        "per_label": {
            label: {
                key: round_report(value) if isinstance(value, float) else value
                for key, value in data.items()
            }
            for label, data in metrics["per_label"].items()
        },
        "confusion_matrix": metrics["confusion_matrix"],
        "mismatches": mismatches,
    }

    print(json.dumps(report, indent=2))

    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)


if __name__ == "__main__":
    main()
