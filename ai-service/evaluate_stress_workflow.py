#!/usr/bin/env python3
"""
Evaluate the AI service stress-impact classification endpoint.

CSV format:
detected_emotions,mental_status,expected_impact
"stressed|tired","stress|fatigue",moderate
"joy|calm","motivated",low
"anxious|overwhelmed","burnout|anxiety",high
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
import time
import urllib.error
import urllib.request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate the AI service stress-impact workflow.")
    parser.add_argument("--csv", required=True, help="Path to evaluation CSV.")
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:8000/api/v1/generate",
        help="AI service endpoint. Default: http://127.0.0.1:8000/api/v1/generate",
    )
    parser.add_argument("--emotions-column", default="detected_emotions")
    parser.add_argument("--mental-column", default="mental_status")
    parser.add_argument("--label-column", default="expected_impact")
    parser.add_argument(
        "--separator",
        default="|",
        help="Separator used for list fields inside a CSV cell. Default: |",
    )
    return parser.parse_args()


def safe_divide(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def split_values(raw: str, separator: str) -> list[str]:
    return [item.strip() for item in (raw or "").split(separator) if item.strip()]


def read_dataset(path: str, emotions_column: str, mental_column: str, label_column: str, separator: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []
        required = {emotions_column, mental_column, label_column}
        if not required.issubset(fieldnames):
            raise ValueError(f"CSV must include columns {sorted(required)}. Found: {fieldnames}")

        for row in reader:
            emotions = split_values(row.get(emotions_column, ""), separator)
            mental = split_values(row.get(mental_column, ""), separator)
            label = (row.get(label_column) or "").strip().lower()
            if not label:
                continue
            rows.append(
                {
                    "detected_emotions": emotions,
                    "mental_status": mental,
                    "expected_impact": label,
                }
            )
    if not rows:
        raise ValueError("No valid rows found in the evaluation CSV.")
    return rows


def call_api(url: str, detected_emotions: list[str], mental_status: list[str]) -> tuple[str, float]:
    payload = json.dumps(
        {
            "user_message": "Evaluation run",
            "detected_emotions": detected_emotions,
            "mental_status": mental_status,
            "intensity": 3,
            "history": "Unknown",
            "time_of_day": "Unknown",
        }
    ).encode("utf-8")
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
        raise RuntimeError(f"Failed to call AI service at {url}: {exc}") from exc
    elapsed_ms = (time.perf_counter() - started) * 1000
    return body["wellbeing_impact"], elapsed_ms


def compute_metrics(expected: list[str], predicted: list[str]) -> dict[str, object]:
    labels = sorted(set(expected) | set(predicted))
    confusion = {actual: {pred: 0 for pred in labels} for actual in labels}
    per_label = {}

    for actual, pred in zip(expected, predicted):
        confusion[actual][pred] += 1

    total = len(expected)
    accuracy = safe_divide(sum(1 for a, p in zip(expected, predicted) if a == p), total)

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
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": support,
        }

        macro_precision += precision
        macro_recall += recall
        macro_f1 += f1

    label_count = len(labels) if labels else 1
    return {
        "accuracy": round(accuracy, 4),
        "precision": round(macro_precision / label_count, 4),
        "recall": round(macro_recall / label_count, 4),
        "f1_score": round(macro_f1 / label_count, 4),
        "per_label": per_label,
        "confusion_matrix": confusion,
    }


def main() -> None:
    args = parse_args()
    rows = read_dataset(
        args.csv,
        args.emotions_column,
        args.mental_column,
        args.label_column,
        args.separator,
    )

    expected: list[str] = []
    predicted: list[str] = []
    response_times_ms: list[float] = []
    mismatches: list[dict[str, object]] = []

    for row in rows:
        prediction, elapsed_ms = call_api(
            args.url,
            row["detected_emotions"],
            row["mental_status"],
        )
        expected_label = str(row["expected_impact"])
        expected.append(expected_label)
        predicted.append(prediction)
        response_times_ms.append(elapsed_ms)

        if prediction != expected_label:
            mismatches.append(
                {
                    "detected_emotions": row["detected_emotions"],
                    "mental_status": row["mental_status"],
                    "expected": expected_label,
                    "predicted": prediction,
                    "response_time_ms": round(elapsed_ms, 4),
                }
            )

    metrics = compute_metrics(expected, predicted)
    metrics["sample_count"] = len(rows)
    metrics["average_response_time_ms"] = round(statistics.mean(response_times_ms), 4)
    metrics["median_response_time_ms"] = round(statistics.median(response_times_ms), 4)
    metrics["mismatches"] = mismatches

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
