"""Seed SYNAPSE database with realistic demo data for Review 2."""

from database import SessionLocal, init_db, Device, Anomaly, Prediction, ApprovalRequest, TrafficMetric, AuditLog
from datetime import datetime, timedelta
import random

random.seed(42)
init_db()
db = SessionLocal()

# Clear existing
db.query(AuditLog).delete()
db.query(TrafficMetric).delete()
db.query(ApprovalRequest).delete()
db.query(Prediction).delete()
db.query(Anomaly).delete()
db.query(Device).delete()
db.commit()

now = datetime.utcnow()

# ===== DEVICES (realistic campus mix) =====
device_types = {
    "student_laptop": {"vlan": 30, "role": "student", "count": 45},
    "faculty_laptop": {"vlan": 20, "role": "faculty", "count": 8},
    "admin_pc": {"vlan": 10, "role": "admin", "count": 4},
    "iot_sensor": {"vlan": 60, "role": "iot", "count": 12},
    "cctv_camera": {"vlan": 50, "role": "iot", "count": 15},
    "exam_terminal": {"vlan": 70, "role": "student", "count": 10},
    "guest_phone": {"vlan": 80, "role": "guest", "count": 6},
}

os_options = {
    "student_laptop": ["Windows 11", "macOS 14.5", "Ubuntu 22.04"],
    "faculty_laptop": ["Windows 11", "macOS 14.5"],
    "admin_pc": ["Windows 11", "Windows Server 2022"],
    "iot_sensor": ["Linux Embedded", "FreeRTOS"],
    "cctv_camera": ["Hikvision FW 5.6", "Dahua FW 2.800"],
    "exam_terminal": ["Windows 11 Secure Mode"],
    "guest_phone": ["Android 14", "iOS 17.5"]
}

devices_created = []
for dtype, meta in device_types.items():
    for i in range(meta["count"]):
        mac = ":".join([f"{random.randint(0,255):02X}" for _ in range(6)])
        ip = f"10.{meta['vlan']}.{random.randint(0,255)}.{random.randint(1,254)}"
        hostname = f"{dtype.replace('_', '-')}-{i+1:03d}"
        trust = round(random.uniform(70, 98), 1) if meta["role"] != "guest" else round(random.uniform(40, 70), 1)
        d = Device(
            mac_address=mac,
            ip_address=ip,
            hostname=hostname,
            device_type=dtype,
            vlan=meta["vlan"],
            os_fingerprint=random.choice(os_options[dtype]),
            first_seen=now - timedelta(days=random.randint(1, 90)),
            last_seen=now - timedelta(minutes=random.randint(0, 15)),
            trust_score=trust,
            status="active",
            user_role=meta["role"]
        )
        db.add(d)
        devices_created.append(d)

# A few SUSPICIOUS devices (low trust, flagged)
suspicious = [
    {"mac": "AA:BB:CC:DD:EE:01", "ip": "10.60.0.57", "hostname": "unknown-iot-001", "type": "iot_sensor", "vlan": 60, "role": "iot", "trust": 23.5, "status": "quarantined", "os": "Unknown"},
    {"mac": "AA:BB:CC:DD:EE:02", "ip": "10.30.5.199", "hostname": "rogue-laptop", "type": "student_laptop", "vlan": 30, "role": "student", "trust": 31.2, "status": "quarantined", "os": "Kali Linux 2024.2"},
    {"mac": "AA:BB:CC:DD:EE:03", "ip": "10.80.1.44", "hostname": "guest-unknown", "type": "guest_phone", "vlan": 80, "role": "guest", "trust": 42.0, "status": "active", "os": "Android (unverified)"},
]
for s in suspicious:
    db.add(Device(
        mac_address=s["mac"], ip_address=s["ip"], hostname=s["hostname"],
        device_type=s["type"], vlan=s["vlan"], os_fingerprint=s["os"],
        first_seen=now - timedelta(hours=random.randint(1, 12)),
        last_seen=now - timedelta(minutes=random.randint(0, 5)),
        trust_score=s["trust"], status=s["status"], user_role=s["role"]
    ))

db.commit()

# ===== ANOMALIES =====
anomaly_scenarios = [
    {"mac": "AA:BB:CC:DD:EE:01", "ip": "10.60.0.57", "type": "rogue_device", "severity": "high",
     "confidence": 0.89, "desc": "Unknown IoT device joined VLAN 60 without 802.1X auth. Nmap shows no matching fingerprint in baseline."},
    {"mac": "AA:BB:CC:DD:EE:02", "ip": "10.30.5.199", "type": "port_scan", "severity": "critical",
     "confidence": 0.94, "desc": "Device scanned 847 ports across 23 hosts in 45s. TCP SYN flags unusual."},
    {"mac": "AA:BB:CC:DD:EE:03", "ip": "10.80.1.44", "type": "mac_spoof", "severity": "medium",
     "confidence": 0.72, "desc": "MAC address matches a device previously seen on VLAN 20 (faculty). Possible impersonation."},
    {"mac": None, "ip": "10.40.2.88", "type": "dos", "severity": "high",
     "confidence": 0.87, "desc": "SYN flood pattern detected toward classroom projector. 15,000 pps for 30s."},
    {"mac": None, "ip": "10.30.9.34", "type": "data_exfil", "severity": "medium",
     "confidence": 0.68, "desc": "Unusual outbound traffic (420 MB in 10 min) to unlisted external IP after 11 PM."},
]
for a in anomaly_scenarios:
    db.add(Anomaly(
        device_mac=a["mac"] or "unknown",
        device_ip=a["ip"],
        anomaly_type=a["type"],
        severity=a["severity"],
        confidence=a["confidence"],
        description=a["desc"],
        detected_at=now - timedelta(minutes=random.randint(1, 180)),
        resolved=False,
        model_used="IsolationForest"
    ))

# A few resolved anomalies for history
for i in range(8):
    db.add(Anomaly(
        device_mac=f"11:22:33:44:55:{i:02X}",
        device_ip=f"10.30.{i}.{random.randint(1,254)}",
        anomaly_type=random.choice(["port_scan", "rogue_device", "mac_spoof"]),
        severity=random.choice(["low", "medium", "high"]),
        confidence=round(random.uniform(0.6, 0.95), 2),
        description="Previously detected and resolved by admin.",
        detected_at=now - timedelta(hours=random.randint(5, 72)),
        resolved=True,
        action_taken=random.choice(["quarantined", "blocked", "whitelisted"]),
        model_used="IsolationForest"
    ))

db.commit()

# ===== PREDICTIONS =====
predictions = [
    {"target": "AP-Block-A-03", "type": "ap", "pred": "congestion", "ttl": 12.5, "conf": 0.88, "load": 78,
     "action": "Reallocate 15% of load to AP-Block-A-02 (currently at 42% utilization)."},
    {"target": "VLAN-70-Exam", "type": "vlan", "pred": "overload", "ttl": 8.0, "conf": 0.92, "load": 65,
     "action": "Scheduled exam at 10 AM — pre-allocate +40% QoS priority to VLAN 70."},
    {"target": "Switch-Dist-B2", "type": "switch", "pred": "failure", "ttl": 24.0, "conf": 0.71, "load": 55,
     "action": "Temperature spike detected. Schedule maintenance window tonight 1-2 AM."},
    {"target": "ISP-Primary", "type": "isp", "pred": "congestion", "ttl": 18.0, "conf": 0.79, "load": 83,
     "action": "Shift non-critical traffic (guest VLAN) to ISP-Secondary preemptively."},
    {"target": "AP-Library-01", "type": "ap", "pred": "overload", "ttl": 5.5, "conf": 0.95, "load": 91,
     "action": "URGENT: Rate-limit guest VLAN on this AP; current load critical."},
]
for p in predictions:
    db.add(Prediction(
        target=p["target"],
        target_type=p["type"],
        prediction_type=p["pred"],
        time_to_event_min=p["ttl"],
        confidence=p["conf"],
        current_load_pct=p["load"],
        recommended_action=p["action"],
        predicted_at=now - timedelta(minutes=random.randint(0, 5)),
        model_used="RandomForest"
    ))

db.commit()

# ===== APPROVAL REQUESTS =====
approvals = [
    {"source_type": "anomaly", "action": "quarantine", "target": "AA:BB:CC:DD:EE:01",
     "reasoning": "Unknown IoT device, no baseline match. Isolation Forest confidence: 0.89. Nmap OS fingerprint failed."},
    {"source_type": "anomaly", "action": "block", "target": "AA:BB:CC:DD:EE:02",
     "reasoning": "Confirmed port scanning behavior. 847 ports scanned in 45s. Kali Linux fingerprint detected."},
    {"source_type": "prediction", "action": "qos_boost", "target": "VLAN-70-Exam",
     "reasoning": "Exam starting in 8 min. Historical overload probability: 92%. Pre-allocate +40% priority."},
    {"source_type": "prediction", "action": "reroute", "target": "ISP-Primary → ISP-Secondary (guest traffic)",
     "reasoning": "Primary ISP at 83% utilization, trending up. Shift guest VLAN to prevent exam disruption."},
]
for a in approvals:
    db.add(ApprovalRequest(
        source_type=a["source_type"],
        action_type=a["action"],
        target=a["target"],
        reasoning=a["reasoning"],
        source=f"auto-{random.randint(1000,9999)}",
        status="pending",
        created_at=now - timedelta(minutes=random.randint(0, 30))
    ))

# A few decided (for history)
for i in range(6):
    decided = random.choice(["approved", "rejected"])
    db.add(ApprovalRequest(
        source_type=random.choice(["anomaly", "prediction"]),
        action_type=random.choice(["quarantine", "block", "qos_boost", "reroute"]),
        target=f"device-{i:03d}",
        reasoning="Previous admin decision for model retraining.",
        source=f"auto-{random.randint(1000,9999)}",
        status=decided,
        created_at=now - timedelta(hours=random.randint(2, 48)),
        decided_at=now - timedelta(hours=random.randint(1, 47)),
        decided_by="admin@kalasalingam.ac.in"
    ))

db.commit()

# ===== TRAFFIC METRICS (last 24h, hourly) =====
vlans = [10, 20, 30, 40, 50, 60, 70, 80]
for h in range(24, 0, -1):
    ts = now - timedelta(hours=h)
    hour_of_day = ts.hour
    class_hour = 9 <= hour_of_day <= 17
    for v in vlans:
        base_bw = {10: 50, 20: 120, 30: 800, 40: 300, 50: 200, 60: 80, 70: 400, 80: 150}[v]
        multiplier = 1.5 if class_hour else 0.4
        bw = base_bw * multiplier * random.uniform(0.8, 1.2)
        db.add(TrafficMetric(
            timestamp=ts,
            vlan=v,
            bandwidth_mbps=round(bw, 1),
            packet_count=int(bw * 1000),
            latency_ms=round(random.uniform(5, 40) if v != 70 else random.uniform(5, 15), 1),
            packet_loss_pct=round(random.uniform(0, 0.5), 3),
            active_devices=int({10: 4, 20: 12, 30: 300, 40: 25, 50: 15, 60: 20, 70: 10, 80: 8}[v] * (multiplier if v != 10 else 1))
        ))

db.commit()

# ===== AUDIT LOG =====
events = [
    ("device_joined", "system", "New device laptop-032 joined VLAN 30 via 802.1X auth"),
    ("anomaly_detected", "IsolationForest", "Port scan detected from 10.30.5.199 (confidence: 0.94)"),
    ("admin_action", "admin@kalasalingam.ac.in", "Approved quarantine of MAC AA:BB:CC:DD:EE:02"),
    ("prediction_fired", "RandomForest", "AP-Library-01 predicted to overload in 5.5 min"),
    ("model_retrained", "system", "Isolation Forest retrained with 12 new admin decisions"),
    ("isp_failover", "system", "Shifted guest VLAN to ISP-Secondary (admin approved)"),
    ("device_quarantined", "admin@kalasalingam.ac.in", "Device 10.60.0.57 moved to quarantine VLAN 99"),
    ("qos_boost", "system", "VLAN 70 (Exam) priority boosted +40% for 10:00 exam window"),
]
for ev, actor, det in events:
    db.add(AuditLog(
        timestamp=now - timedelta(minutes=random.randint(5, 240)),
        event_type=ev,
        actor=actor,
        details=det
    ))

db.commit()
db.close()

print("✅ SYNAPSE database seeded successfully")
print(f"   Devices:     {sum(m['count'] for m in device_types.values()) + 3}")
print(f"   Anomalies:   13 (5 active, 8 resolved)")
print(f"   Predictions: 5 active")
print(f"   Approvals:   4 pending, 6 historical")
print(f"   Traffic:     192 hourly metrics (24h × 8 VLANs)")
print(f"   Audit:       8 events")
