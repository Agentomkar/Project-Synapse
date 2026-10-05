# SYNAPSE — Packet Tracer Topology Blueprint

## 🎯 What this builds

A **working Packet Tracer simulation** of the SYNAPSE campus network:
- Redundant core (2 L3 switches with HSRP)
- 3 distribution switches (per building)
- 4 access switches with VLAN segmentation
- Firewall (ASA 5506 or server as pfSense substitute)
- Dual ISP routers
- 8 end-device clients (one per VLAN for testing)
- Server for the AI Orchestrator

**Time to build:** ~30 minutes copying configs.

---

## 📐 Visual Topology

```
                           ┌─────────────┐  ┌─────────────┐
                           │   ISP-1     │  │   ISP-2     │
                           │ 203.0.113.1 │  │ 198.51.100.1│
                           └──────┬──────┘  └──────┬──────┘
                                  │                 │
                                  └────────┬────────┘
                                           │
                                   ┌───────▼────────┐
                                   │  Firewall (FW) │  pfSense / ASA
                                   │  10.0.0.1      │
                                   └───────┬────────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      │                    │                    │
              ┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
              │   Core-SW-1   │────│   Core-SW-2   │    │  AI Server    │
              │   L3 Switch   │ ⇄  │   L3 Switch   │    │  10.99.0.100  │
              │  HSRP Active  │    │  HSRP Standby │    │  (Orchestrator│
              └───┬─────┬─────┘    └──┬────┬───────┘    └───────────────┘
                  │     │             │    │
          ┌───────┘     └──────┬──────┘    └───────┐
          │                    │                    │
    ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
    │ Dist-SW-A │        │ Dist-SW-B │        │ Dist-SW-C │
    │ Building A│        │ Building B│        │ Building C│
    └─┬───┬─┬───┘        └─┬───┬─────┘        └─┬───────┬─┘
      │   │ │              │   │                │       │
   ┌──▼┐ ┌▼─┐┌▼──┐       ┌─▼─┐┌▼──┐          ┌─▼──┐ ┌──▼─┐
   │AP1││A2││A3 │       │A4 ││A5 │          │CCTV│ │Exam│
   └───┘ └──┘└───┘       └───┘└───┘          └────┘ └────┘
   (Access Switches with endpoint clients)
```

---

## 🧩 Device Inventory

### Core Layer
| Device | Packet Tracer Model | Hostname | Role |
|---|---|---|---|
| Core-SW-1 | **3650-24PS** (Layer 3) | `Core-SW-1` | HSRP Active, Primary routing |
| Core-SW-2 | **3650-24PS** (Layer 3) | `Core-SW-2` | HSRP Standby, Redundancy |

### Distribution Layer
| Device | Model | Hostname | Building |
|---|---|---|---|
| Dist-SW-A | **2960-24TT** | `Dist-SW-A` | Admin Block |
| Dist-SW-B | **2960-24TT** | `Dist-SW-B` | Academic Block |
| Dist-SW-C | **2960-24TT** | `Dist-SW-C` | Lab/CCTV Block |

### Access Layer
| Device | Model | Hostname | Purpose |
|---|---|---|---|
| Access-A1 | **2960-24TT** | `Access-A1` | Admin/ERP devices |
| Access-A2 | **2960-24TT** | `Access-A2` | Faculty laptops |
| Access-B1 | **2960-24TT** | `Access-B1` | Student Wi-Fi + Classrooms |
| Access-B2 | **2960-24TT** | `Access-B2` | Online Exam terminals |
| Access-C1 | **2960-24TT** | `Access-C1` | CCTV + IoT Labs |
| Access-C2 | **2960-24TT** | `Access-C2` | Guest Wi-Fi |

### Security & External
| Device | Model | Hostname |
|---|---|---|
| Firewall | **ASA 5506-X** or Server (pfSense) | `FW` |
| ISP-1 | **1941 Router** | `ISP-1` |
| ISP-2 | **1941 Router** | `ISP-2` |

### Endpoints (one per VLAN for testing)
| Device | VLAN | IP | Purpose |
|---|---|---|---|
| PC-Admin | 10 | 10.10.0.50 | ERP access test |
| PC-Faculty | 20 | 10.20.0.50 | Faculty workstation |
| Laptop-Student | 30 | 10.30.0.100 | Student Wi-Fi client |
| Projector-Class | 40 | 10.40.0.50 | Smart classroom |
| Camera-CCTV | 50 | 10.50.0.50 | Surveillance |
| Sensor-IoT | 60 | 10.60.0.50 | IoT lab device |
| PC-Exam | 70 | 10.70.0.50 | Exam terminal |
| Phone-Guest | 80 | 10.80.0.50 | Guest access |
| **AI-Server** | 99 | 10.99.0.100 | **SYNAPSE Orchestrator** |

---

## 🌐 VLAN Plan

| VLAN | Name | Subnet | Gateway (HSRP VIP) | Purpose |
|---|---|---|---|---|
| 10 | ADMIN | 10.10.0.0/24 | 10.10.0.1 | Admin + ERP |
| 20 | FACULTY | 10.20.0.0/24 | 10.20.0.1 | Faculty |
| 30 | STUDENT | 10.30.0.0/24 | 10.30.0.1 | Student Wi-Fi |
| 40 | CLASSROOM | 10.40.0.0/24 | 10.40.0.1 | Smart classrooms |
| 50 | CCTV | 10.50.0.0/24 | 10.50.0.1 | Surveillance |
| 60 | IOT | 10.60.0.0/24 | 10.60.0.1 | IoT labs |
| 70 | EXAM | 10.70.0.0/24 | 10.70.0.1 | Online exams |
| 80 | GUEST | 10.80.0.0/24 | 10.80.0.1 | Guest Wi-Fi |
| 99 | MGMT | 10.99.0.0/24 | 10.99.0.1 | Management + AI Server |

**Core ↔ Firewall uplink:** `10.0.0.0/30` (point-to-point)
**ISP-1 ↔ Firewall:** `203.0.113.0/30`
**ISP-2 ↔ Firewall:** `198.51.100.0/30`

---

## 🔗 Cabling Plan

### Core
```
Core-SW-1 Gi0/1  ──── Gi0/1 Core-SW-2    (HSRP sync + L2 trunk)
Core-SW-1 Gi0/2  ──── Gi0/0 FW           (uplink to firewall)
Core-SW-2 Gi0/2  ──── Gi0/1 FW           (backup uplink)
```

### Core → Distribution
```
Core-SW-1 Gi0/3  ──── Gi0/1 Dist-SW-A
Core-SW-1 Gi0/4  ──── Gi0/1 Dist-SW-B
Core-SW-1 Gi0/5  ──── Gi0/1 Dist-SW-C
Core-SW-2 Gi0/3  ──── Gi0/2 Dist-SW-A
Core-SW-2 Gi0/4  ──── Gi0/2 Dist-SW-B
Core-SW-2 Gi0/5  ──── Gi0/2 Dist-SW-C
```

### Distribution → Access
```
Dist-SW-A Fa0/1  ──── Fa0/1 Access-A1
Dist-SW-A Fa0/2  ──── Fa0/1 Access-A2
Dist-SW-B Fa0/1  ──── Fa0/1 Access-B1
Dist-SW-B Fa0/2  ──── Fa0/1 Access-B2
Dist-SW-C Fa0/1  ──── Fa0/1 Access-C1
Dist-SW-C Fa0/2  ──── Fa0/1 Access-C2
```

### Endpoints (sample — add more as needed)
```
Access-A1 Fa0/5 ──── PC-Admin (VLAN 10)
Access-A2 Fa0/5 ──── PC-Faculty (VLAN 20)
Access-B1 Fa0/5 ──── Laptop-Student (VLAN 30)
Access-B1 Fa0/6 ──── Projector-Class (VLAN 40)
Access-B2 Fa0/5 ──── PC-Exam (VLAN 70)
Access-C1 Fa0/5 ──── Camera-CCTV (VLAN 50)
Access-C1 Fa0/6 ──── Sensor-IoT (VLAN 60)
Access-C2 Fa0/5 ──── Phone-Guest (VLAN 80)
Dist-SW-A Fa0/24 ──── AI-Server (VLAN 99)
```

### Firewall ↔ ISPs
```
FW Gi1/0 ──── Gi0/0 ISP-1
FW Gi1/1 ──── Gi0/0 ISP-2
```

---

## 🚀 Build Order

Follow **BUILD_GUIDE.md** for step-by-step clicks. In short:

1. **Place devices** on canvas per the diagram above
2. **Cable** everything (copper straight-through except Core↔Core which is crossover)
3. **Paste configs** into each device (from `configs/` folder) — CLI tab → Enable → Paste
4. **Save** as `synapse_campus.pkt`
5. **Test scenarios** (see TESTING.md)

Total time: ~30 min once you have the devices placed.

---

## 📁 Config Files

All CLI configs are in `configs/` — copy, paste, done.

| File | Target device |
|---|---|
| `core-sw-1.txt` | Core-SW-1 |
| `core-sw-2.txt` | Core-SW-2 |
| `dist-sw-a.txt` | Dist-SW-A |
| `dist-sw-b.txt` | Dist-SW-B |
| `dist-sw-c.txt` | Dist-SW-C |
| `access-a1.txt` through `access-c2.txt` | Access switches |
| `firewall.txt` | ASA or router stand-in |
| `isp-1.txt` + `isp-2.txt` | ISP routers |

Each file includes: hostname, VLANs, interfaces, trunks, HSRP (where applicable), ACLs, DHCP, security.
