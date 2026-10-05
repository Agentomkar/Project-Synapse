from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./synapse.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String, unique=True, index=True)
    ip_address = Column(String, index=True)
    hostname = Column(String)
    device_type = Column(String)  # laptop, phone, iot, cctv, unknown
    vlan = Column(Integer)
    os_fingerprint = Column(String, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    trust_score = Column(Float, default=50.0)  # 0-100
    status = Column(String, default="active")  # active, quarantined, blocked
    user_role = Column(String)  # student, faculty, admin, iot, guest


class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    device_mac = Column(String, index=True)
    device_ip = Column(String)
    anomaly_type = Column(String)  # rogue_device, port_scan, dos, data_exfil, mac_spoof
    severity = Column(String)  # low, medium, high, critical
    confidence = Column(Float)  # 0-1
    description = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    action_taken = Column(String, nullable=True)
    model_used = Column(String, default="IsolationForest")


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    target = Column(String)  # AP-ID, Switch-ID, VLAN-ID
    target_type = Column(String)  # ap, switch, vlan, isp
    prediction_type = Column(String)  # congestion, failure, overload
    predicted_at = Column(DateTime, default=datetime.utcnow)
    time_to_event_min = Column(Float)  # minutes until predicted event
    confidence = Column(Float)
    current_load_pct = Column(Float)
    recommended_action = Column(Text)
    model_used = Column(String, default="RandomForest")


class ApprovalRequest(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String)  # anomaly_id or prediction_id
    source_type = Column(String)  # anomaly, prediction
    action_type = Column(String)  # quarantine, block, reroute, qos_boost
    target = Column(String)
    reasoning = Column(Text)
    status = Column(String, default="pending")  # pending, approved, rejected
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(String, nullable=True)


class TrafficMetric(Base):
    __tablename__ = "traffic_metrics"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    vlan = Column(Integer, index=True)
    bandwidth_mbps = Column(Float)
    packet_count = Column(Integer)
    latency_ms = Column(Float)
    packet_loss_pct = Column(Float)
    active_devices = Column(Integer)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String)
    actor = Column(String)  # admin username or 'system'
    details = Column(Text)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
