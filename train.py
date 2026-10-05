"""
SYNAPSE ML Training
Trains two models:
  1. Isolation Forest - unsupervised anomaly detection on network traffic
  2. Random Forest - supervised congestion/failure prediction

Uses CICIDS2017-style features (synthetic generation for demo reliability).
Replace generate_training_data() with real CSV load for production.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
import json

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)
np.random.seed(42)


def generate_anomaly_training_data(n_normal=5000, n_anomaly=500):
    """
    Simulate CICIDS2017-style flow features.
    Normal traffic clusters tightly; anomalies are outliers in multiple dims.
    """
    # NORMAL traffic
    normal = pd.DataFrame({
        'flow_duration_ms': np.random.gamma(2, 500, n_normal),
        'packet_count': np.random.poisson(50, n_normal),
        'avg_packet_size': np.random.normal(600, 150, n_normal),
        'bytes_per_sec': np.random.normal(1200, 300, n_normal),
        'packets_per_sec': np.random.normal(25, 8, n_normal),
        'tcp_flag_count': np.random.poisson(5, n_normal),
        'unique_dst_ports': np.random.poisson(3, n_normal),
        'inter_arrival_std': np.random.gamma(1, 10, n_normal),
    })
    normal['label'] = 0  # normal

    # ANOMALY traffic (port scans, DoS, data exfil mixed)
    anomaly = pd.DataFrame({
        'flow_duration_ms': np.random.gamma(5, 2000, n_anomaly),  # longer
        'packet_count': np.random.poisson(500, n_anomaly),  # more packets
        'avg_packet_size': np.random.normal(1400, 400, n_anomaly),  # bigger
        'bytes_per_sec': np.random.normal(8000, 2000, n_anomaly),  # high throughput
        'packets_per_sec': np.random.normal(150, 50, n_anomaly),  # bursts
        'tcp_flag_count': np.random.poisson(40, n_anomaly),  # unusual
        'unique_dst_ports': np.random.poisson(30, n_anomaly),  # port scan signature
        'inter_arrival_std': np.random.gamma(5, 50, n_anomaly),  # irregular
    })
    anomaly['label'] = 1

    df = pd.concat([normal, anomaly], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def generate_prediction_training_data(n=8000):
    """
    Features: time_of_day, day_of_week, current_load, device_count,
              is_exam_period, is_class_hour, historical_avg
    Target: failure_in_15min (0/1)
    """
    hours = np.random.randint(0, 24, n)
    days = np.random.randint(0, 7, n)
    device_count = np.random.poisson(400, n)
    is_exam = np.random.binomial(1, 0.15, n)
    is_class = ((hours >= 9) & (hours <= 17) & (days < 5)).astype(int)

    # Load correlates with class hours and exam periods
    base_load = 20 + is_class * 40 + is_exam * 30
    current_load = np.clip(base_load + np.random.normal(0, 10, n), 0, 100)

    historical_avg = base_load + np.random.normal(0, 5, n)

    # Failure likely when: load high + exam + many devices + specific hours
    failure_prob = (
        (current_load / 100) * 0.4 +
        is_exam * 0.25 +
        (device_count / 1000) * 0.2 +
        ((hours == 10) | (hours == 14)).astype(int) * 0.15
    )
    failure = (np.random.random(n) < failure_prob).astype(int)

    df = pd.DataFrame({
        'hour': hours,
        'day_of_week': days,
        'current_load_pct': current_load,
        'device_count': device_count,
        'is_exam_period': is_exam,
        'is_class_hour': is_class,
        'historical_avg_load': historical_avg,
        'failure_in_15min': failure
    })
    return df


def train_isolation_forest():
    print("\n" + "=" * 60)
    print("TRAINING: Isolation Forest (Anomaly Detection)")
    print("=" * 60)

    df = generate_anomaly_training_data()
    X = df.drop('label', axis=1)
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Train only on NORMAL data (unsupervised)
    X_train_normal = X_train[y_train == 0]

    model = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=150,
        max_samples='auto'
    )
    model.fit(X_train_normal)

    # Evaluate
    pred_test = model.predict(X_test)
    pred_test = np.where(pred_test == -1, 1, 0)  # -1 = anomaly, 1 = normal

    acc = accuracy_score(y_test, pred_test)
    cm = confusion_matrix(y_test, pred_test)
    tn, fp, fn, tp = cm.ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0

    metrics = {
        "model": "IsolationForest",
        "accuracy": round(acc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": round(fpr, 4),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        "features": list(X.columns),
        "training_samples": len(X_train_normal),
        "test_samples": len(X_test)
    }

    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"FPR:       {fpr:.4f}")
    print(f"Confusion Matrix: TN={tn} FP={fp} FN={fn} TP={tp}")

    joblib.dump(model, os.path.join(MODEL_DIR, "isolation_forest.pkl"))
    with open(os.path.join(MODEL_DIR, "isolation_forest_metrics.json"), 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[saved] {MODEL_DIR}/isolation_forest.pkl")
    return metrics


def train_random_forest():
    print("\n" + "=" * 60)
    print("TRAINING: Random Forest (Congestion/Failure Prediction)")
    print("=" * 60)

    df = generate_prediction_training_data()
    X = df.drop('failure_in_15min', axis=1)
    y = df['failure_in_15min']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    pred_test = model.predict(X_test)
    acc = accuracy_score(y_test, pred_test)
    cm = confusion_matrix(y_test, pred_test)
    tn, fp, fn, tp = cm.ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    # Feature importance
    importances = dict(zip(X.columns, [round(float(x), 4) for x in model.feature_importances_]))

    metrics = {
        "model": "RandomForestClassifier",
        "accuracy": round(acc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        "feature_importance": importances,
        "features": list(X.columns),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "prediction_horizon_min": 15
    }

    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"Confusion Matrix: TN={tn} FP={fp} FN={fn} TP={tp}")
    print("\nTop features:")
    for k, v in sorted(importances.items(), key=lambda x: -x[1])[:3]:
        print(f"  {k}: {v}")

    joblib.dump(model, os.path.join(MODEL_DIR, "random_forest.pkl"))
    with open(os.path.join(MODEL_DIR, "random_forest_metrics.json"), 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[saved] {MODEL_DIR}/random_forest.pkl")
    return metrics


if __name__ == "__main__":
    m1 = train_isolation_forest()
    m2 = train_random_forest()

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE — Review-ready metrics:")
    print("=" * 60)
    print(f"Isolation Forest: {m1['accuracy']*100:.1f}% accuracy, {m1['false_positive_rate']*100:.1f}% FPR")
    print(f"Random Forest:    {m2['accuracy']*100:.1f}% accuracy, 15-min prediction horizon")
