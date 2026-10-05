# 🌐 SYNAPSE — Packet Tracer Simulation

Everything you need to build the SYNAPSE campus network in Cisco Packet Tracer.

## 📁 What's here

| File | Purpose |
|---|---|
| `TOPOLOGY.md` | Complete network blueprint — devices, VLANs, subnets, cabling |
| `BUILD_GUIDE.md` | **Step-by-step** instructions to build in Packet Tracer (~30 min) |
| `TESTING.md` | 10 demo scenarios + expected results for review day |
| `topology-diagram.svg` | Visual topology diagram (open in any browser) |
| `configs/` | Ready-to-paste CLI configs for every device (11 files) |

## ⚡ Quick start

1. Open **Packet Tracer**
2. Follow **BUILD_GUIDE.md** — place devices, cable them, paste configs
3. Save as `synapse_campus.pkt`
4. Run tests from **TESTING.md** to verify
5. Take screenshots → add to Review 2 deck

## 🎯 What you get

A fully functional simulation of:
- ✅ **9 VLANs** (Admin, Faculty, Student, Classroom, CCTV, IoT, Exam, Guest, Mgmt)
- ✅ **Redundant L3 core** with HSRP (failover in <5 sec)
- ✅ **3-tier hierarchy** (Core → Dist → Access)
- ✅ **Inter-VLAN ACLs** (Student can't reach Admin, Guest isolated, Exam whitelist, CCTV lockdown)
- ✅ **Dual-ISP failover** with floating static routes
- ✅ **L2 security** (port-security, DHCP snooping, DAI, BPDU guard, storm control)
- ✅ **DHCP** per VLAN
- ✅ **NAT** at firewall for internet access
- ✅ **AI Orchestrator** placement (SYNAPSE server on VLAN 99)

## 🔑 Default credentials

| Role | Username | Password |
|---|---|---|
| Enable (switches) | — | `SynapseCore2026!` (Core), `SynapseDist2026!` (Dist), `SynapseAccess2026!` (Access) |
| Firewall | admin | `SynapseAdmin2026!` |
| SSH | admin | `SynapseAdmin2026!` |

**For a real deployment, change these.** For the review demo, they're fine.

## 📸 Screenshot checklist for Review 2

See `TESTING.md` → "Must-have screenshots" section. The 9 must-haves:
1. Full topology canvas
2. `show vlan brief` on Core-SW-1
3. `show standby brief` showing HSRP Active
4. `show ip route` on Core-SW-1
5. Ping success PC-Admin → AI-Server
6. Ping blocked Laptop-Student → PC-Admin
7. Ping blocked Phone-Guest → anywhere internal
8. HSRP failover demo (before/after Core-SW-1 power off)
9. Port security violation showing err-disabled port

## 💡 Pro tip for the review

Reviewers often ask: *"Why these specific VLANs and not fewer?"*

**Answer:** Each VLAN maps to a **distinct security risk profile**:
- VLAN 50 (CCTV) — IoT devices are top attack vectors (Mirai)
- VLAN 70 (Exam) — academic integrity + traffic isolation during exams
- VLAN 80 (Guest) — unknown users, must be fully isolated
- VLAN 60 (IoT Labs) — experimental devices, risky by nature
- VLAN 10 vs 20 — least privilege (admin ≠ faculty)

This shows you understand **defense in depth**, not just segmentation for its own sake.

## 🤔 FAQ

**Q: Can I just upload my .pkt file somewhere?**
A: Yes — once you build it following `BUILD_GUIDE.md`, save the `.pkt` and share it however you want.

**Q: Why not use GNS3 or EVE-NG?**
A: Packet Tracer is standard for undergrad reviews. Simpler, free, works offline.

**Q: Does this replace the React dashboard?**
A: No — they complement each other. Packet Tracer shows the **physical network**; the React dashboard shows the **AI orchestrator** running on top. In your demo, switch between them.

**Q: Can I simplify to fewer devices for a 5-min demo?**
A: Yes — the minimum viable topology is: 1 Core + 1 Dist + 1 Access + 2 PCs on different VLANs. But the full topology is more impressive and shows all your work.
