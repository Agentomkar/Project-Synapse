# 🧪 Testing & Demo Scenarios

Test scenarios to prove SYNAPSE's network works. Use these in your review demo.

---

## Scenario 1: Basic connectivity ✅
*"Does the network even work?"*

**From PC-Admin:**
```
ping 10.10.0.1    ← Gateway (should succeed)
ping 10.10.0.3    ← Core-SW-2 SVI (should succeed)
ping 10.99.0.100  ← AI-Server (should succeed via Core routing)
ping 8.8.8.8      ← Internet (should succeed via NAT)
```

**Screenshot this.** Judges love seeing "Reply from…" lines.

---

## Scenario 2: VLAN segmentation 🔒
*"Can students access admin ERP?"*

**From Laptop-Student (VLAN 30):**
```
ping 10.10.0.50   ← Admin PC
```
**Expected:** `Request timed out` or `Destination host unreachable`

**Why:** ACL `STUDENT_ISOLATION` on Core-SW-1 blocks this.

**Also test:**
```
ping 10.20.0.50   ← Faculty PC (should be blocked)
ping 10.30.0.1    ← Own gateway (should succeed)
```

---

## Scenario 3: Guest isolation 🚫
*"Can guests reach internal services?"*

**From Phone-Guest (VLAN 80):**
```
ping 10.10.0.50   ← Admin (BLOCKED)
ping 10.20.0.50   ← Faculty (BLOCKED)
ping 10.70.0.50   ← Exam terminals (BLOCKED)
ping 8.8.8.8      ← Internet (ALLOWED — guest gets internet only)
```

**Why:** `GUEST_ISOLATION` ACL blocks all internal 10.0.0.0/8 from guest.

---

## Scenario 4: Exam terminal whitelist 📝
*"Can students take the exam without accessing random internet during it?"*

**From PC-Exam (VLAN 70):**
```
ping 10.99.0.100  ← AI-Server / Exam server (ALLOWED)
ping 8.8.8.8      ← Random internet (BLOCKED)
ping 10.30.0.100  ← Student VLAN (BLOCKED)
```

**Why:** `EXAM_WHITELIST` ACL only permits VLAN 99 (exam server) + HTTPS to specific hosts.

---

## Scenario 5: CCTV lockdown 📷
*"Can CCTV cameras be used as attack vector?"*

**From Camera-CCTV (VLAN 50):**
```
ping 10.99.0.100  ← NVR/AI-Server (ALLOWED)
ping 10.10.0.50   ← Admin (BLOCKED)
ping 8.8.8.8      ← Internet (BLOCKED)
```

**Why:** `CCTV_LOCKDOWN` ACL permits only VLAN 99, denies everything else.
*This matters because compromised CCTV cameras are a top IoT attack vector in real breaches (Mirai botnet).*

---

## Scenario 6: HSRP failover ⚡
*"What if the primary core switch fails?"*

1. Open **Core-SW-1** → CLI → `show standby brief`
   - Verify it says **Active** for all VLANs
2. **From PC-Admin:**
   ```
   ping 10.99.0.100 -t   (continuous ping — in real Packet Tracer, use simulation mode)
   ```
3. **Click Core-SW-1 → power it off** (Physical tab → power button)
4. Watch the pings:
   - 2-3 might fail during convergence
   - Then they succeed again — through Core-SW-2
5. On **Core-SW-2** → `show standby brief`
   - Now says **Active** (it took over)
6. Power Core-SW-1 back on — it preempts and reclaims Active

**Screenshot before/after `show standby brief`.** This is a killer demo moment.

---

## Scenario 7: Port Security violation 🛡️
*"What if someone unplugs their PC and plugs in a different device?"*

1. **PC-Exam** connected to Access-B2 Fa0/5 (port-security max 1 sticky, violation=shutdown)
2. Disconnect PC-Exam cable
3. Plug a different PC into the same port
4. On Access-B2 CLI:
   ```
   show interface fa0/5     ← will show "err-disabled"
   show port-security       ← will show violation count = 1
   ```

**Why:** Attacker plugging in a rogue device gets instantly blocked. Admin must manually re-enable: `shutdown` then `no shutdown`.

---

## Scenario 8: DHCP snooping (bonus) 💧
*"What if someone sets up a rogue DHCP server?"*

1. Add another server device to Access-A1
2. Enable DHCP service on it with a bogus pool
3. Pings fail — the rogue DHCP responses are blocked
4. `show ip dhcp snooping` on Access-A1 shows trusted ports

**Why:** DHCP snooping only trusts the uplink port (Fa0/1 to Dist-SW-A). Any other port's DHCP replies are dropped.

---

## Scenario 9: Dual-ISP routing 🌐
*"What if ISP-1 goes down?"*

1. From any PC: `ping 8.8.8.8` → succeeds (via ISP-1)
2. Click **ISP-1** → power off
3. Wait 10 seconds for route convergence
4. `ping 1.1.1.1` → succeeds (via ISP-2 backup route)

**Why:** FW has two default routes — primary (203.0.113.1 metric 1) and backup (198.51.100.1 metric 20). When primary dies, backup kicks in.

---

## Scenario 10: End-to-end SYNAPSE integration 🧠
*"How does the AI orchestrator fit in?"*

The AI-Server at **10.99.0.100** represents the SYNAPSE backend running:
- FastAPI (port 8000)
- The React dashboard (port 5173)
- SQLite with the trained ML models

From **PC-Admin**:
1. Open web browser → `http://10.99.0.100`
2. See the SYNAPSE dashboard (in real deployment)
3. Admin can approve/reject AI recommendations

**In Packet Tracer:** You can only serve a static HTML page from the Server device, so put a short HTML like:
```html
<h1>SYNAPSE Orchestrator</h1>
<p>Status: Online · Monitoring 103 devices</p>
<p>Models: Isolation Forest (90.7%) + Random Forest (75.7%)</p>
```

**For the real demo:** Have your React dashboard open on your laptop in a browser tab — switch to it when showing the orchestrator layer.

---

## 📸 Must-have screenshots for Review 2

1. **Network topology** — full canvas screenshot
2. **`show vlan brief`** on Core-SW-1 — proves VLAN plan
3. **`show standby brief`** on Core-SW-1 showing all Active
4. **`show ip route`** on Core-SW-1
5. **Ping success** from PC-Admin → AI-Server
6. **Ping blocked** from Laptop-Student → PC-Admin (proves ACL works)
7. **Ping blocked** from Phone-Guest → anywhere internal
8. **HSRP failover** before/after (power off Core-SW-1 demo)
9. **Port security violation** screen

Put these 9 screenshots in your Review 2 deck — reviewers see concrete proof.

---

## 💡 Demo day tips

- **Rehearse the ping sequence 3 times.** Smooth demo > perfect network.
- **Pre-open all CLI tabs** you'll need — switching is slow in Packet Tracer during demo.
- **Keep this file open** on your phone or second screen for reference.
- **Backup .pkt file** to USB + Google Drive the night before.
- **If Packet Tracer crashes:** You have screenshots. Say "Here's the live state we captured yesterday" and keep going.
