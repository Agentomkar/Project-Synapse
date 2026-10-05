# 🛠️ Packet Tracer — Step-by-Step Build Guide

## ⏱️ Total time: ~30 minutes

**You'll need:** Cisco Packet Tracer 8.0+ installed.

---

## STEP 1 — Open Packet Tracer and set up the canvas (2 min)

1. File → New
2. File → Save As → `synapse_campus.pkt` (so you don't lose work)
3. Set zoom to ~75% so you can see the whole layout

---

## STEP 2 — Place all devices (10 min)

Click & drag each device from the bottom toolbar onto the canvas. Position them like this:

### Row 1 (top) — External
- **ISP-1** → Routers → `1941`
- **ISP-2** → Routers → `1941`

### Row 2 — Perimeter
- **FW** → Routers → `2911` (easier than ASA for demo)

### Row 3 — Core
- **Core-SW-1** → Switches → `3650-24PS`
- **Core-SW-2** → Switches → `3650-24PS`

### Row 4 — Distribution
- **Dist-SW-A**, **Dist-SW-B**, **Dist-SW-C** → Switches → `2960-24TT`

### Row 5 — Access
- **Access-A1, A2, B1, B2, C1, C2** → Switches → `2960-24TT`

### Row 6 (bottom) — Endpoints
- **PC-Admin** → End Devices → PC
- **PC-Faculty** → End Devices → PC
- **Laptop-Student** → End Devices → Laptop
- **Projector-Class** → End Devices → PC (renamed)
- **PC-Exam** → End Devices → PC
- **Camera-CCTV** → End Devices → PC (renamed)
- **Sensor-IoT** → End Devices → IoT device OR PC
- **Phone-Guest** → End Devices → Smartphone
- **AI-Server** → End Devices → Server

**Right-click → Rename** each device to match the names above.

---

## STEP 3 — Cable everything (8 min)

Click the lightning bolt (Connections) and use **Copper Straight-Through** for all except the Core↔Core link (use **Copper Crossover** or Straight — Packet Tracer 8+ auto-detects).

Click device A → pick port → click device B → pick port.

### Core layer cables
| From | Port | To | Port |
|---|---|---|---|
| Core-SW-1 | Gi0/1 | Core-SW-2 | Gi0/1 |
| Core-SW-1 | Gi0/2 | FW (Router) | Gi0/0 |
| Core-SW-2 | Gi0/2 | FW (Router) | Gi0/1 |

### Core → Distribution
| From | Port | To | Port |
|---|---|---|---|
| Core-SW-1 | Gi0/3 | Dist-SW-A | Gi0/1 |
| Core-SW-1 | Gi0/4 | Dist-SW-B | Gi0/1 |
| Core-SW-1 | Gi0/5 | Dist-SW-C | Gi0/1 |
| Core-SW-2 | Gi0/3 | Dist-SW-A | Gi0/2 |
| Core-SW-2 | Gi0/4 | Dist-SW-B | Gi0/2 |
| Core-SW-2 | Gi0/5 | Dist-SW-C | Gi0/2 |

### Distribution → Access
| From | Port | To | Port |
|---|---|---|---|
| Dist-SW-A | Fa0/1 | Access-A1 | Fa0/1 |
| Dist-SW-A | Fa0/2 | Access-A2 | Fa0/1 |
| Dist-SW-B | Fa0/1 | Access-B1 | Fa0/1 |
| Dist-SW-B | Fa0/2 | Access-B2 | Fa0/1 |
| Dist-SW-C | Fa0/1 | Access-C1 | Fa0/1 |
| Dist-SW-C | Fa0/2 | Access-C2 | Fa0/1 |

### Endpoints
| From | Port | To | Port |
|---|---|---|---|
| Access-A1 | Fa0/5 | PC-Admin | Fa0 |
| Access-A2 | Fa0/5 | PC-Faculty | Fa0 |
| Access-B1 | Fa0/5 | Laptop-Student | Fa0 |
| Access-B1 | Fa0/11 | Projector-Class | Fa0 |
| Access-B2 | Fa0/5 | PC-Exam | Fa0 |
| Access-C1 | Fa0/5 | Camera-CCTV | Fa0 |
| Access-C1 | Fa0/15 | Sensor-IoT | Fa0 |
| Access-C2 | Fa0/5 | Phone-Guest | Fa0 |
| Dist-SW-A | Fa0/24 | AI-Server | Fa0 |

### Firewall → ISPs
| From | Port | To | Port |
|---|---|---|---|
| FW | Gi1/0 | ISP-1 | Gi0/0 |
| FW | Gi1/1 | ISP-2 | Gi0/0 |

> 💡 FW is a 2911 router — it only has Gi0/0 and Gi0/1 by default. Click FW → **Physical** tab → power off → drag an **HWIC-2T** module into one of the slots to get more interfaces. Or re-cable to use Gi0/0 for Core link and Gi0/1 for ISP-1, then add ISP-2 later.
>
> **Simpler alternative:** Use a 2960 switch between FW and the two ISPs so you only need 1 port on FW.

---

## STEP 4 — Paste configs (10 min)

For each switch/router:

1. Click the device
2. Go to **CLI** tab
3. Press **Enter** to get the prompt
4. Open the matching config file from `configs/` (e.g., `core-sw-1.txt`)
5. **Copy ALL text** from that file
6. **Paste** into the CLI
7. Wait for it to finish (you'll see the final `write memory` success)

**Order to configure (important for dependencies):**
1. ISP-1 → `isp-1.txt`
2. ISP-2 → `isp-2.txt`
3. FW → `firewall.txt`
4. Core-SW-1 → `core-sw-1.txt`
5. Core-SW-2 → `core-sw-2.txt`
6. Dist-SW-A → `dist-sw-a.txt`
7. Dist-SW-B → `dist-sw-b.txt`
8. Dist-SW-C → `dist-sw-c.txt`
9. Access-A1 → `access-a1.txt`
10. Access-A2 → `access-a2.txt`
11. Access-B1 → `access-b1.txt`
12. Access-B2 → `access-b2.txt`
13. Access-C1 → `access-c1.txt`
14. Access-C2 → `access-c2.txt`

---

## STEP 5 — Configure endpoints (3 min)

Click each PC/device → **Desktop** tab → **IP Configuration** → **DHCP** (since the Core switches are DHCP servers).

OR set static IPs:

| Device | IP | Subnet | Gateway |
|---|---|---|---|
| PC-Admin | 10.10.0.50 | 255.255.255.0 | 10.10.0.1 |
| PC-Faculty | 10.20.0.50 | 255.255.255.0 | 10.20.0.1 |
| Laptop-Student | 10.30.0.100 | 255.255.255.0 | 10.30.0.1 |
| Projector-Class | 10.40.0.50 | 255.255.255.0 | 10.40.0.1 |
| Camera-CCTV | 10.50.0.50 | 255.255.255.0 | 10.50.0.1 |
| Sensor-IoT | 10.60.0.50 | 255.255.255.0 | 10.60.0.1 |
| PC-Exam | 10.70.0.50 | 255.255.255.0 | 10.70.0.1 |
| Phone-Guest | 10.80.0.50 | 255.255.255.0 | 10.80.0.1 |
| AI-Server | 10.99.0.100 | 255.255.255.0 | 10.99.0.1 |

**AI-Server:** Also enable the HTTP service — Server → Services → HTTP → ON → paste a simple page like "SYNAPSE Orchestrator Online" (this lets you show it in demo).

---

## STEP 6 — Save & Test (2 min)

1. **File → Save** (`Ctrl+S`)
2. See **TESTING.md** for verification scenarios.

---

## ✅ Quick sanity check

Run these on **Core-SW-1** CLI after full build:

```
show vlan brief           ← Should show all 9 VLANs
show standby brief        ← Should show "Active" for every VLAN
show ip interface brief   ← Should show all SVIs as "up/up"
show ip route             ← Should show all 9 directly connected networks + default route
```

Ping tests:
- From PC-Admin → `ping 10.10.0.1` (its gateway) → should work
- From PC-Admin → `ping 10.99.0.100` (AI-Server) → should work (same L3 reachable)
- From Laptop-Student → `ping 10.10.0.50` (Admin PC) → **should be BLOCKED** (ACL working)
- From Phone-Guest → `ping 10.10.0.50` → **should be BLOCKED** (Guest isolation)
- From PC-Exam → `ping 10.99.0.100` → should work (whitelist)
- From PC-Exam → `ping 8.8.8.8` → **should be BLOCKED** (exam whitelist)

---

## 🎥 Demo recording tip

Before the review:
1. Take **screenshots** of each verification output
2. Record a **short screen capture** showing the ping tests
3. Save a backup copy of the `.pkt` file to USB + cloud

If Packet Tracer crashes on review day, you have the screenshots.

---

## 📎 Troubleshooting

**"Interface won't come up"**
→ Both sides need `no shutdown`. Check Core-SW's trunk + the connected Access switch.

**"VLAN interface shows down/down"**
→ No active ports in that VLAN. Add a device or configure a port in that VLAN first.

**"HSRP not showing Active/Standby"**
→ Wait 30 seconds after boot. Then `show standby brief`.

**"DHCP not giving IPs"**
→ Make sure the Access switch Fa0/1 has `ip dhcp snooping trust`.

**"Ping blocked where it shouldn't be"**
→ `show access-lists` on Core-SW-1 — check your ACL isn't too restrictive.

**"FW config paste fails"**
→ If you used ASA instead of 2911, the syntax is different. Use 2911 — simpler for Packet Tracer.
