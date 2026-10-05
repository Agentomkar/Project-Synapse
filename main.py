"""
SYNAPSE Backend API
AI-powered Network Decision Support System for Smart Campus
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from datetime import datetime, timedelta
import joblib
import json
import os
import numpy as np

from database import (
    get_db, init_db, Device, Anomaly, Prediction,
    ApprovalRequest, TrafficMetric, AuditLog
)

init_db()

app = FastAPI(
    title="SYNAPSE API",
    description="AI-powered Network Decision Support System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
isolation_model = None
random_forest_model = None
isolation_metrics = {}
rf_metrics = {}

try:
    isolation_model = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
    random_forest_model = joblib.load(os.path.join(MODEL_DIR, "random_forest.pkl"))
    with open(os.path.join(MODEL_DIR, "isolation_forest_metrics.json")) as f:
        isolation_metrics = json.load(f)
    with open(os.path.join(MODEL_DIR, "random_forest_metrics.json")) as f:
        rf_metrics = json.load(f)
except Exception as e:
    print(f"Warning: model load failed — {e}. Run `python ml/train.py` first.")


# ==================== ROOT ====================
@app.get("/")
def root():
    return {
        "name": "SYNAPSE",
        "description": "AI-powered Network Decision Support System",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


# ==================== OVERVIEW ====================
@app.get("/api/overview")
def overview(db: Session = Depends(get_db)):
    """Dashboard overview — KPIs for the main screen."""
    total_devices = db.query(Device).count()
    active_devices = db.query(Device).filter(Device.status == "active").count()
    quarantined = db.query(Device).filter(Device.status == "quarantined").count()
    active_anomalies = db.query(Anomaly).filter(Anomaly.resolved == False).count()
    critical_anomalies = db.query(Anomaly).filter(
        Anomaly.resolved == False, Anomaly.severity == "critical"
    ).count()
    pending_approvals = db.query(ApprovalRequest).filter(
        ApprovalRequest.status == "pending"
    ).count()
    predictions_count = db.query(Prediction).count()

    # Avg trust score
    avg_trust = db.query(func.avg(Device.trust_score)).scalar() or 0

    # Current total bandwidth (sum of latest per VLAN)
    latest_time = db.query(func.max(TrafficMetric.timestamp)).scalar()
    total_bw = db.query(func.sum(TrafficMetric.bandwidth_mbps)).filter(
        TrafficMetric.timestamp == latest_time
    ).scalar() or 0

    return {
        "total_devices": total_devices,
        "active_devices": active_devices,
        "quarantined_devices": quarantined,
        "active_anomalies": active_anomalies,
        "critical_anomalies": critical_anomalies,
        "pending_approvals": pending_approvals,
        "active_predictions": predictions_count,
        "avg_trust_score": round(float(avg_trust), 1),
        "total_bandwidth_mbps": round(float(total_bw), 1),
        "network_health": "operational" if critical_anomalies == 0 else "warning",
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== DEVICES ====================
@app.get("/api/devices")
def list_devices(
    status: str = None,
    vlan: int = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    q = db.query(Device)
    if status:
        q = q.filter(Device.status == status)
    if vlan:
        q = q.filter(Device.vlan == vlan)
    devices = q.order_by(desc(Device.trust_score)).limit(limit).all()

    return [{
        "id": d.id,
        "mac_address": d.mac_address,
        "ip_address": d.ip_address,
        "hostname": d.hostname,
        "device_type": d.device_type,
        "vlan": d.vlan,
        "os_fingerprint": d.os_fingerprint,
        "trust_score": d.trust_score,
        "status": d.status,
        "user_role": d.user_role,
        "last_seen": d.last_seen.isoformat() if d.last_seen else None,
        "first_seen": d.first_seen.isoformat() if d.first_seen else None,
    } for d in devices]


@app.get("/api/devices/stats")
def device_stats(db: Session = Depends(get_db)):
    """Device distribution by VLAN, type, status, trust bucket."""
    by_vlan = db.query(Device.vlan, func.count(Device.id)).group_by(Device.vlan).all()
    by_type = db.query(Device.device_type, func.count(Device.id)).group_by(Device.device_type).all()
    by_status = db.query(Device.status, func.count(Device.id)).group_by(Device.status).all()

    # Trust distribution
    devices = db.query(Device).all()
    trust_buckets = {"high (80-100)": 0, "medium (50-80)": 0, "low (0-50)": 0}
    for d in devices:
        if d.trust_score >= 80:
            trust_buckets["high (80-100)"] += 1
        elif d.trust_score >= 50:
            trust_buckets["medium (50-80)"] += 1
        else:
            trust_buckets["low (0-50)"] += 1

    return {
        "by_vlan": [{"vlan": v, "count": c} for v, c in by_vlan],
        "by_type": [{"type": t, "count": c} for t, c in by_type],
        "by_status": [{"status": s, "count": c} for s, c in by_status],
        "trust_distribution": [{"bucket": k, "count": v} for k, v in trust_buckets.items()]
    }


# ==================== ANOMALIES ====================
@app.get("/api/anomalies")
def list_anomalies(
    resolved: bool = None,
    severity: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(Anomaly)
    if resolved is not None:
        q = q.filter(Anomaly.resolved == resolved)
    if severity:
        q = q.filter(Anomaly.severity == severity)
    items = q.order_by(desc(Anomaly.detected_at)).limit(limit).all()

    return [{
        "id": a.id,
        "device_mac": a.device_mac,
        "device_ip": a.device_ip,
        "anomaly_type": a.anomaly_type,
        "severity": a.severity,
        "confidence": a.confidence,
        "description": a.description,
        "detected_at": a.detected_at.isoformat(),
        "resolved": a.resolved,
        "action_taken": a.action_taken,
        "model_used": a.model_used,
    } for a in items]


@app.get("/api/anomalies/stats")
def anomaly_stats(db: Session = Depends(get_db)):
    by_severity = db.query(Anomaly.severity, func.count(Anomaly.id)).group_by(Anomaly.severity).all()
    by_type = db.query(Anomaly.anomaly_type, func.count(Anomaly.id)).group_by(Anomaly.anomaly_type).all()

    # Last 24h hourly
    now = datetime.utcnow()
    hourly = []
    for h in range(23, -1, -1):
        start = now - timedelta(hours=h + 1)
        end = now - timedelta(hours=h)
        count = db.query(Anomaly).filter(
            Anomaly.detected_at >= start, Anomaly.detected_at < end
        ).count()
        hourly.append({"hour": start.strftime("%H:00"), "count": count})

    return {
        "by_severity": [{"severity": s, "count": c} for s, c in by_severity],
        "by_type": [{"type": t, "count": c} for t, c in by_type],
        "hourly_last_24h": hourly
    }


# ==================== PREDICTIONS ====================
@app.get("/api/predictions")
def list_predictions(db: Session = Depends(get_db)):
    items = db.query(Prediction).order_by(Prediction.time_to_event_min).all()
    return [{
        "id": p.id,
        "target": p.target,
        "target_type": p.target_type,
        "prediction_type": p.prediction_type,
        "time_to_event_min": p.time_to_event_min,
        "confidence": p.confidence,
        "current_load_pct": p.current_load_pct,
        "recommended_action": p.recommended_action,
        "predicted_at": p.predicted_at.isoformat(),
        "model_used": p.model_used,
    } for p in items]


# ==================== APPROVALS (Human-in-the-loop) ====================
@app.get("/api/approvals")
def list_approvals(status: str = "pending", db: Session = Depends(get_db)):
    q = db.query(ApprovalRequest)
    if status:
        q = q.filter(ApprovalRequest.status == status)
    items = q.order_by(desc(ApprovalRequest.created_at)).all()

    return [{
        "id": a.id,
        "source_type": a.source_type,
        "action_type": a.action_type,
        "target": a.target,
        "reasoning": a.reasoning,
        "status": a.status,
        "created_at": a.created_at.isoformat(),
        "decided_at": a.decided_at.isoformat() if a.decided_at else None,
        "decided_by": a.decided_by,
    } for a in items]


class ApprovalDecision(BaseModel):
    decision: str  # "approved" or "rejected"
    admin: str = "admin@kalasalingam.ac.in"


@app.post("/api/approvals/{approval_id}/decide")
def decide_approval(approval_id: int, decision: ApprovalDecision, db: Session = Depends(get_db)):
    a = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not a:
        raise HTTPException(404, "Approval not found")
    if a.status != "pending":
        raise HTTPException(400, f"Already {a.status}")

    a.status = decision.decision
    a.decided_at = datetime.utcnow()
    a.decided_by = decision.admin

    # Log the decision for model retraining
    db.add(AuditLog(
        event_type="admin_action",
        actor=decision.admin,
        details=f"{decision.decision.upper()}: {a.action_type} on {a.target}"
    ))
    db.commit()
    return {"status": "ok", "approval_id": approval_id, "decision": decision.decision}


# ==================== TRAFFIC ====================
@app.get("/api/traffic/timeseries")
def traffic_timeseries(hours: int = 24, db: Session = Depends(get_db)):
    """Hourly bandwidth per VLAN for the last N hours."""
    since = datetime.utcnow() - timedelta(hours=hours)
    rows = db.query(TrafficMetric).filter(TrafficMetric.timestamp >= since).order_by(TrafficMetric.timestamp).all()

    # Group by timestamp
    grouped = {}
    for r in rows:
        ts = r.timestamp.strftime("%H:00")
        if ts not in grouped:
            grouped[ts] = {"time": ts}
        grouped[ts][f"vlan_{r.vlan}"] = r.bandwidth_mbps

    return list(grouped.values())


@app.get("/api/traffic/current")
def traffic_current(db: Session = Depends(get_db)):
    """Latest metrics per VLAN."""
    latest = db.query(func.max(TrafficMetric.timestamp)).scalar()
    rows = db.query(TrafficMetric).filter(TrafficMetric.timestamp == latest).all()
    return [{
        "vlan": r.vlan,
        "bandwidth_mbps": r.bandwidth_mbps,
        "latency_ms": r.latency_ms,
        "packet_loss_pct": r.packet_loss_pct,
        "active_devices": r.active_devices,
    } for r in rows]


# ==================== AUDIT LOG ====================
@app.get("/api/audit")
def audit_log(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [{
        "id": r.id,
        "timestamp": r.timestamp.isoformat(),
        "event_type": r.event_type,
        "actor": r.actor,
        "details": r.details,
    } for r in rows]


# ==================== ML METRICS ====================
@app.get("/api/ml/metrics")
def ml_metrics():
    """Model performance metrics for the Methodology slide."""
    return {
        "isolation_forest": isolation_metrics,
        "random_forest": rf_metrics
    }


# ==================== LIVE ANOMALY SCORING ====================
class AnomalyScoreRequest(BaseModel):
    flow_duration_ms: float
    packet_count: int
    avg_packet_size: float
    bytes_per_sec: float
    packets_per_sec: float
    tcp_flag_count: int
    unique_dst_ports: int
    inter_arrival_std: float


@app.post("/api/ml/score-anomaly")
def score_anomaly(req: AnomalyScoreRequest):
    """Live anomaly scoring — demo endpoint."""
    if isolation_model is None:
        raise HTTPException(503, "Model not loaded")
    features = np.array([[
        req.flow_duration_ms, req.packet_count, req.avg_packet_size,
        req.bytes_per_sec, req.packets_per_sec, req.tcp_flag_count,
        req.unique_dst_ports, req.inter_arrival_std
    ]])
    pred = isolation_model.predict(features)[0]
    score = float(isolation_model.score_samples(features)[0])
    is_anomaly = pred == -1

    confidence = min(abs(score) * 2, 1.0)

    return {
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": round(score, 4),
        "confidence": round(confidence, 4),
        "verdict": "ANOMALY DETECTED" if is_anomaly else "NORMAL",
        "model": "IsolationForest",
    }


class PredictionRequest(BaseModel):
    hour: int
    day_of_week: int
    current_load_pct: float
    device_count: int
    is_exam_period: int
    is_class_hour: int
    historical_avg_load: float


@app.post("/api/ml/predict-failure")
def predict_failure(req: PredictionRequest):
    """15-minute congestion/failure prediction."""
    if random_forest_model is None:
        raise HTTPException(503, "Model not loaded")
    features = np.array([[
        req.hour, req.day_of_week, req.current_load_pct,
        req.device_count, req.is_exam_period, req.is_class_hour,
        req.historical_avg_load
    ]])
    pred = random_forest_model.predict(features)[0]
    proba = random_forest_model.predict_proba(features)[0]

    return {
        "failure_predicted": bool(pred),
        "failure_probability": round(float(proba[1]), 4),
        "normal_probability": round(float(proba[0]), 4),
        "verdict": "FAILURE RISK HIGH" if pred else "NORMAL OPERATION",
        "horizon_minutes": 15,
        "model": "RandomForestClassifier",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
