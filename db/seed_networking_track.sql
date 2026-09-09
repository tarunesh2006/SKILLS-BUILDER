-- ============================================================================
--  Networking track - full content + assessments
--  Source: user-supplied 7-part networking syllabus (LAN/topologies/media/
--          devices; OSI & TCP/IP; addressing & subnetting; core protocols;
--          switching & advanced LAN; security; modern & cloud networking).
--
--  Loads 7 modules, ~29 text lessons (4-5 per module) and 3 auto-graded MCQ
--  assessments for the separate Test module. Networking is a non-coding track,
--  so assessments are multiple choice, not judge-run code.
--
--  RE-RUNNABLE: deletes existing modules and tests for the Networking track
--  first (cascades to its module quizzes, progress and submissions). Safe for
--  a dev/staging database. After running this, RE-RUN
--  db/seed_networking_module_quizzes.sql too.
--
--  Usage:
--    docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 \
--      learning_platform < db/seed_networking_track.sql
-- ============================================================================
SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES,STRICT_TRANS_TABLES';
USE learning_platform;

SET @n     := (SELECT id FROM tracks WHERE slug = 'networking');
SET @admin := (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1);

DELETE FROM tests   WHERE track_id = @n;
DELETE FROM modules WHERE track_id = @n;

-- ============================================================================
--  MODULES
-- ============================================================================
INSERT INTO modules (track_id, title, summary, sort_order) VALUES
(@n, 'Module 1: Networking Basics and Fundamentals',
     'Network types (LAN/MAN/WAN/WLAN), topologies, transmission media, and the core devices - hub, switch, router, firewall.', 1),
(@n, 'Module 2: Network Models',
     'The OSI 7-layer model, the TCP/IP 4-layer model, and how data is encapsulated and decapsulated as it moves between layers.', 2),
(@n, 'Module 3: Addressing and Subnetting',
     'IPv4 addressing and header, classful vs classless (CIDR), subnetting and VLSM, and IPv6.', 3),
(@n, 'Module 4: Core Protocols and Services',
     'Ethernet and MAC, IP/ARP/ICMP, routing protocols (RIP/OSPF/EIGRP/BGP), TCP vs UDP, and application services (DNS/DHCP/HTTP/FTP/SMTP).', 4),
(@n, 'Module 5: Switching and Advanced LAN',
     'VLANs and trunking, inter-VLAN routing, Spanning Tree Protocol, and NAT/PAT.', 5),
(@n, 'Module 6: Network Security',
     'Access Control Lists, firewalls/IDS/IPS, VPNs, and switch-port protections (port security, DHCP snooping).', 6),
(@n, 'Module 7: Modern and Cloud Networking',
     'SDN and NFV, cloud networking models, IoT and 5G slicing, and a structured troubleshooting method.', 7);

-- ============================================================================
--  LESSONS
-- ============================================================================

-- ---- Module 1: Networking Basics and Fundamentals -----------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'What a Network Is, and Network Types',
'A **computer network** is two or more devices connected so they can share
data and resources (files, printers, an internet link).

Networks are classified by the area they cover:

| Type | Scope | Example |
|------|-------|---------|
| **LAN** (Local Area Network) | one building or site | an office floor, a home |
| **WLAN** (Wireless LAN) | a LAN over Wi-Fi instead of cables | a cafe hotspot |
| **MAN** (Metropolitan Area Network) | a city | a campus network across town |
| **WAN** (Wide Area Network) | country / global | the internet, a company''s branch links |

A LAN is usually owned and managed by one organisation and uses high-speed,
low-latency links. A WAN crosses public infrastructure, is slower and more
expensive per bit, and is often leased from a service provider.', 1
FROM modules WHERE track_id = @n AND title = 'Module 1: Networking Basics and Fundamentals';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Network Topologies',
'**Topology** is the shape of the connections between devices.

- **Bus** -- every device taps a single shared cable. Cheap, but one cable
  fault breaks the whole segment and only one device can transmit at a time.
- **Ring** -- each device connects to two neighbours forming a loop; data
  travels around the ring. A single break can bring it down unless it is a
  dual ring.
- **Star** -- every device has its own link to a central hub or switch. The
  most common LAN layout today: one link failing affects only that device,
  and the switch gives each device dedicated bandwidth.
- **Mesh** -- devices interconnect with many redundant paths. **Full mesh**
  connects every node to every other (`n(n-1)/2` links) -- very resilient
  but expensive, so it is used between core routers and in WANs.

Real networks are usually **hybrid**: star-wired LANs joined by a partial
mesh of routers.', 2
FROM modules WHERE track_id = @n AND title = 'Module 1: Networking Basics and Fundamentals';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Transmission Media',
'Media is what actually carries the signal.

| Medium | Signal | Typical use | Notes |
|--------|--------|-------------|-------|
| **Twisted-pair copper** (UTP/STP, e.g. Cat 6) | electrical | LAN cabling to the desk | cheap, easy; ~100 m limit; prone to EMI |
| **Coaxial** | electrical | older LANs, cable broadband | better shielding than UTP |
| **Fiber optic** | light | backbones, long links, data centres | huge bandwidth, immune to EMI, long distance; more costly to terminate |
| **Wireless** (Wi-Fi, cellular, microwave) | radio | mobility, hard-to-cable areas | shared medium, interference, security concerns |

Fiber comes in **single-mode** (one light path, long distance) and
**multi-mode** (several paths, shorter runs, cheaper optics).

Key trade-off: copper is cheap and simple for short runs; fiber wins on
distance, bandwidth, and noise immunity; wireless wins on mobility at the
cost of shared, less predictable bandwidth.', 3
FROM modules WHERE track_id = @n AND title = 'Module 1: Networking Basics and Fundamentals';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Network Devices: Hub, Switch, Router, Firewall',
'> "Describe the function and operation of a hub, a switch and a router."
> -- *Cisco Networking Fundamentals*

- **Hub** -- a Layer 1 device. It repeats every incoming bit out of **all**
  other ports. All ports share one collision domain, so it is effectively a
  multi-port repeater. Obsolete, replaced by switches.
- **Switch** -- a Layer 2 device. It learns which **MAC address** lives on
  which port (building a MAC address table) and forwards each frame only to
  the port for its destination. Each port is its own collision domain, so
  devices get dedicated bandwidth and can send at the same time.
- **Router** -- a Layer 3 device. It connects **different networks** and
  forwards packets between them based on the destination **IP address** and
  its routing table. Routers separate broadcast domains and are where WAN
  links, NAT, and most filtering happen.
- **Firewall** -- inspects traffic against a rule set (by address, port,
  protocol, or application) and permits or denies it. It enforces the
  security boundary between zones such as inside, DMZ, and internet.

Rule of thumb: **switch within a network, route between networks, firewall
at the edge.**', 4
FROM modules WHERE track_id = @n AND title = 'Module 1: Networking Basics and Fundamentals';

-- ---- Module 2: Network Models -----------------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Why Layered Models',
'Networking is complex, so it is split into **layers**. Each layer does one
job and offers a service to the layer above, using the service of the layer
below. A layer only needs to agree with the **same layer** on the other
device (its *peer*).

Benefits:

- **Interoperability** -- vendors can build a Layer 2 switch or a Layer 7
  web server independently, as long as they follow the standard.
- **Modularity** -- you can swap Wi-Fi for Ethernet at Layer 1-2 without
  touching TCP or HTTP above.
- **Troubleshooting** -- you can test layer by layer: is the link up
  (L1)? do I have an IP and a route (L3)? does the port respond (L4)?

Two models matter: the 7-layer **OSI** reference model (teaching and
troubleshooting vocabulary) and the 4-layer **TCP/IP** model (what the
internet actually runs).', 1
FROM modules WHERE track_id = @n AND title = 'Module 2: Network Models';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The OSI 7-Layer Model',
'From bottom to top -- *"Please Do Not Throw Sausage Pizza Away"*:

| # | Layer | Job | Unit | Examples |
|---|-------|-----|------|----------|
| 7 | Application | interface to the app | data | HTTP, DNS, SMTP |
| 6 | Presentation | format, encrypt, compress | data | TLS, JPEG, ASCII |
| 5 | Session | set up / manage dialogues | data | RPC, NetBIOS |
| 4 | Transport | end-to-end delivery, ports | segment | TCP, UDP |
| 3 | Network | logical addressing, routing | packet | IP, ICMP, OSPF |
| 2 | Data Link | local delivery on one link, MAC | frame | Ethernet, Wi-Fi, ARP |
| 1 | Physical | bits on the wire / air | bits | cables, connectors, radio |

Layer 2 is often split into **LLC** (talks to Layer 3) and **MAC**
(controls access to the medium).

Remember which device works where: hub = L1, switch = L2, router = L3,
firewall = L3-L7.', 2
FROM modules WHERE track_id = @n AND title = 'Module 2: Network Models';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The TCP/IP 4-Layer Model',
'The internet was built on the **TCP/IP** model, which collapses OSI into
four layers:

| TCP/IP layer | Covers OSI | Protocols |
|--------------|-----------|-----------|
| **Application** | 5, 6, 7 | HTTP, DNS, DHCP, SMTP, FTP |
| **Transport** | 4 | TCP, UDP |
| **Internet** | 3 | IP, ICMP, ARP (often shown here) |
| **Network Access** (Link) | 1, 2 | Ethernet, Wi-Fi, PPP |

Some texts use a 5-layer version that keeps Physical and Data Link
separate.

Mapping: the OSI *Network* layer = the TCP/IP *Internet* layer; OSI layers
5-7 all live in the single TCP/IP *Application* layer.', 3
FROM modules WHERE track_id = @n AND title = 'Module 2: Network Models';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Encapsulation and Decapsulation',
'As data goes **down** the stack on the sender, each layer wraps it in that
layer''s header (and Layer 2 also adds a trailer). This is
**encapsulation**:

```
Application:  [ data ]
Transport:    [ TCP hdr | data ]                 -> segment
Network:      [ IP hdr  | TCP hdr | data ]       -> packet
Data Link:    [ Eth hdr | IP hdr  | TCP hdr | data | Eth trailer ]  -> frame
Physical:      1010110101...                     -> bits
```

At each hop the frame is rebuilt (new Layer 2 addresses), but the IP packet
inside is carried unchanged end to end.

On the receiver the reverse happens -- **decapsulation**: each layer strips
its header, checks it, and hands the payload up. A wrong checksum, address,
or port causes the frame/packet/segment to be dropped at that layer.', 4
FROM modules WHERE track_id = @n AND title = 'Module 2: Network Models';

-- ---- Module 3: Addressing and Subnetting -----------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'IPv4 Addresses and the IPv4 Header',
'An **IPv4 address** is 32 bits, written as four dotted decimal *octets*:
`192.168.10.25`. Each octet is 0-255.

Every address has a **network part** and a **host part**, split by the
**subnet mask** (e.g. `255.255.255.0` or `/24`). Devices on the same subnet
can talk directly at Layer 2; anything else goes via the **default
gateway** (a router).

Special ranges:

| Range | Meaning |
|-------|---------|
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | private (RFC 1918) |
| `127.0.0.0/8` | loopback |
| `169.254.0.0/16` | link-local (APIPA, DHCP failed) |
| `.255` (all host bits 1) | directed broadcast |

The **IPv4 header** carries, among other fields: version, header length,
**TTL** (hop limit; decremented by each router, packet dropped at 0),
**protocol** (6 = TCP, 17 = UDP, 1 = ICMP), header checksum, and the source
and destination addresses.', 1
FROM modules WHERE track_id = @n AND title = 'Module 3: Addressing and Subnetting';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Classful vs Classless (CIDR) Addressing',
'**Classful** addressing (historical) fixed the network/host split by the
first bits of the address:

| Class | First octet | Default mask | Networks / hosts |
|-------|-------------|--------------|------------------|
| A | 1-126 | /8 | few nets, ~16M hosts each |
| B | 128-191 | /16 | ~65k hosts each |
| C | 192-223 | /24 | 254 hosts each |
| D | 224-239 | -- | multicast |
| E | 240-255 | -- | experimental |

This wasted huge amounts of space (a site needing 300 hosts had to take a
whole Class B).

**CIDR** (Classless Inter-Domain Routing) drops classes and lets the mask
be **any length**, written as a `/prefix`. `192.168.8.0/22` means the first
22 bits are the network. CIDR also enables **route summarisation** -- many
small routes advertised as one larger prefix.', 2
FROM modules WHERE track_id = @n AND title = 'Module 3: Addressing and Subnetting';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Subnetting and VLSM',
'**Subnetting** borrows bits from the host part to create more, smaller
networks.

For a `/n` prefix:

- addresses in the block = `2^(32-n)`
- usable hosts = `2^(32-n) - 2` (subtract the network and broadcast address)
- block size in the last changing octet = `256 - mask_octet`

Example -- split `192.168.1.0/24` into four `/26` subnets:

| Subnet | Range | Broadcast | Usable hosts |
|--------|-------|-----------|--------------|
| `192.168.1.0/26` | .1 - .62 | .63 | 62 |
| `192.168.1.64/26` | .65 - .126 | .127 | 62 |
| `192.168.1.128/26` | .129 - .190 | .191 | 62 |
| `192.168.1.192/26` | .193 - .254 | .255 | 62 |

**VLSM** (Variable Length Subnet Masking) uses *different* masks in the
same network so each subnet is only as big as it needs to be -- e.g. a
point-to-point router link gets a `/30` (2 usable hosts), a user LAN gets a
`/24`. Always allocate the **largest** subnets first.', 3
FROM modules WHERE track_id = @n AND title = 'Module 3: Addressing and Subnetting';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'IPv6 Addressing',
'**IPv6** is 128 bits, written as eight groups of four hex digits:
`2001:0db8:0000:0000:0000:0000:0000:0001`. Rules to shorten it:

- drop leading zeros in a group: `0db8` -> `db8`
- replace **one** run of all-zero groups with `::` :
  `2001:db8::1`

Key points vs IPv4:

| | IPv4 | IPv6 |
|-|------|------|
| size | 32 bit | 128 bit |
| notation | dotted decimal | colon hex |
| broadcast | yes | **no** -- uses multicast |
| address config | manual / DHCP | SLAAC (auto), DHCPv6 |
| header | variable, checksum | fixed 40 bytes, no checksum |
| NAT | common | rarely needed |

Common IPv6 types: **global unicast** (`2000::/3`, routable),
**link-local** (`fe80::/10`, one link only, always present), **unique
local** (`fc00::/7`, private), **multicast** (`ff00::/8`). A host typically
holds several IPv6 addresses at once.', 4
FROM modules WHERE track_id = @n AND title = 'Module 3: Addressing and Subnetting';

-- ---- Module 4: Core Protocols and Services --------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The Link Layer: Ethernet and MAC Addresses',
'**Ethernet** is the dominant LAN technology at Layers 1-2. Data travels in
**frames**:

```
[ Dest MAC (6B) | Src MAC (6B) | Type/Len (2B) | Payload (46-1500B) | FCS (4B) ]
```

A **MAC address** is 48 bits, shown as `00:1A:2B:3C:4D:5E`. The first 24
bits are the **OUI** (vendor); it is burned into the NIC and is meant to be
globally unique. `FF:FF:FF:FF:FF:FF` is the broadcast MAC.

Switch operation:

1. **Learn** -- record the source MAC + incoming port in the MAC table.
2. **Forward** -- if the destination MAC is known, send only out that port.
3. **Flood** -- if unknown (or broadcast/multicast), send out all ports
   except the one it came in on.
4. **Age** -- remove entries not seen for a while (default ~300 s).

Modern switch ports are **full-duplex**, so CSMA/CD collision handling is
no longer needed on them.', 1
FROM modules WHERE track_id = @n AND title = 'Module 4: Core Protocols and Services';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The Network Layer: IP, ARP, ICMP',
'- **IP** -- the connectionless, best-effort delivery service. It addresses
  and routes packets but makes no guarantee of delivery, order, or timing;
  that is left to TCP or the application.
- **ARP** (Address Resolution Protocol) -- maps a known **IP** to the
  **MAC** on the local link. The host broadcasts *"who has 192.168.1.1?"*
  and the owner replies with its MAC. Results are cached in the ARP table.
- **RARP** -- the old reverse (MAC -> IP); replaced by BOOTP, then DHCP.
- **ICMP** -- the control and error-reporting protocol for IP. It carries
  messages like *destination unreachable*, *time exceeded* (TTL hit 0), and
  *echo request/reply*. **ping** uses echo; **traceroute** sends packets
  with increasing TTL and reads the *time exceeded* replies to map each hop.

When a host sends to a remote network it ARPs for the **gateway''s** MAC,
not the final destination''s.', 2
FROM modules WHERE track_id = @n AND title = 'Module 4: Core Protocols and Services';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Routing Protocols: RIP, OSPF, EIGRP, BGP',
'A router picks the best path from its **routing table**, which is filled by
directly connected networks, static routes, and dynamic routing protocols.

| Protocol | Type | Metric | Scope |
|----------|------|--------|-------|
| **RIP** | distance-vector | hop count (max 15) | small networks; simple, slow to converge |
| **OSPF** | link-state | cost (from bandwidth) | enterprise interior; fast, scalable, open standard |
| **EIGRP** | advanced distance-vector | bandwidth + delay | Cisco interior; fast convergence |
| **BGP** | path-vector | policy / AS-path | **the** protocol between ISPs; runs the internet |

**IGP vs EGP**: RIP/OSPF/EIGRP are *interior* gateway protocols (inside one
organisation / autonomous system). **BGP** is the *exterior* protocol that
exchanges routes **between** autonomous systems.

**Administrative distance** breaks ties when several sources offer a route:
connected 0, static 1, EIGRP 90, OSPF 110, RIP 120 -- lower wins.', 3
FROM modules WHERE track_id = @n AND title = 'Module 4: Core Protocols and Services';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'The Transport Layer: TCP and UDP',
'Both use **port numbers** (0-65535) to identify the application; a
connection is identified by the 4-tuple *src IP : src port -> dst IP : dst
port*.

**TCP** -- reliable, connection-oriented, ordered:

- **3-way handshake** to open: `SYN` -> `SYN, ACK` -> `ACK`.
- **Sequence / acknowledgement numbers** track every byte; lost segments
  are retransmitted.
- **Flow control** -- the receiver advertises a *window* so a fast sender
  cannot overrun it.
- **Congestion control** -- slow start / congestion avoidance back off when
  the network drops packets.
- Used by HTTP(S), SSH, SMTP, FTP.

**UDP** -- connectionless, no handshake, no retransmission, no ordering.
Tiny 8-byte header, very low overhead. The app handles any reliability it
needs. Used by DNS queries, DHCP, VoIP, video streaming, gaming.

Choose TCP when every byte must arrive; choose UDP when speed and low
latency matter more than the odd lost packet.', 4
FROM modules WHERE track_id = @n AND title = 'Module 4: Core Protocols and Services';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Application-Layer Services',
'| Service | Port | Transport | Purpose |
|---------|------|-----------|---------|
| **DNS** | 53 | UDP (TCP for big replies) | name -> IP resolution |
| **DHCP** | 67/68 | UDP | hands out IP, mask, gateway, DNS automatically |
| **HTTP** | 80 | TCP | web pages |
| **HTTPS** | 443 | TCP + TLS | encrypted web |
| **FTP** | 21 (control), 20 (data) | TCP | file transfer |
| **SMTP** | 25 (587 submit) | TCP | sending email |

**DHCP** uses the **DORA** exchange: *Discover* (broadcast) -> *Offer* ->
*Request* -> *Acknowledge*. The lease has a finite time and is renewed.

**DNS** resolution walks the hierarchy: resolver -> root -> TLD (`.com`) ->
authoritative server for the domain; answers are cached with a TTL.

**HTTPS** = HTTP inside a **TLS** session that authenticates the server (via
its certificate) and encrypts the traffic.', 5
FROM modules WHERE track_id = @n AND title = 'Module 4: Core Protocols and Services';

-- ---- Module 5: Switching and Advanced LAN --------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'VLANs and Trunking',
'A **VLAN** (Virtual LAN) splits one physical switch into several logical
broadcast domains. Ports in VLAN 10 cannot reach ports in VLAN 20 without a
router, even on the same switch. VLANs group users by function (staff,
guests, voice, servers) rather than by location, and they contain
broadcasts.

- An **access port** belongs to exactly one VLAN and connects to an end
  device.
- A **trunk port** carries **many** VLANs between switches (or to a router).
  Frames on a trunk are **tagged** with a 4-byte **802.1Q** header holding
  the VLAN ID. The **native VLAN** is the one left untagged on a trunk.

Best practice: put unused ports in an unused VLAN and shut them, and do not
use VLAN 1 for user traffic.', 1
FROM modules WHERE track_id = @n AND title = 'Module 5: Switching and Advanced LAN';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Inter-VLAN Routing',
'VLANs isolate traffic, so something at **Layer 3** must route between them.
Three ways:

1. **Router with one interface per VLAN** -- simple, but needs a physical
   port per VLAN; does not scale.
2. **Router-on-a-stick** -- one physical link to the switch, carrying a
   trunk, split into **subinterfaces** (`Gi0/0.10`, `Gi0/0.20`), each with
   an IP that is the gateway for its VLAN.
3. **Layer 3 switch with SVIs** -- the switch itself routes. Each VLAN gets
   a **Switched Virtual Interface** (`interface vlan 10`) with an IP.
   Fast (done in hardware) and the usual choice in campus networks.

Every host still points its default gateway at the Layer 3 address for its
own VLAN.', 2
FROM modules WHERE track_id = @n AND title = 'Module 5: Switching and Advanced LAN';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Spanning Tree Protocol (STP)',
'Redundant links between switches are good for resilience but create
**Layer 2 loops**: broadcasts circle forever, MAC tables thrash, and the
network melts down (a *broadcast storm*). There is no TTL in an Ethernet
frame to stop it.

**STP** (IEEE 802.1D) prevents this by building a loop-free tree:

1. Elect one **root bridge** (lowest bridge ID = priority + MAC).
2. Every other switch picks its lowest-cost **root port** toward the root.
3. Each segment picks one **designated port**.
4. Any remaining port is put in **blocking** -- it carries no data but
   listens for changes.

If an active link fails, a blocked port is unblocked to restore
connectivity. Classic STP takes ~30-50 s to converge; **RSTP** (802.1w)
does it in a few seconds. **PortFast** skips the wait on access ports that
connect to end devices only.', 3
FROM modules WHERE track_id = @n AND title = 'Module 5: Switching and Advanced LAN';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'NAT and PAT',
'Private RFC 1918 addresses are not routable on the internet. **NAT**
(Network Address Translation) rewrites the source IP of outgoing packets to
a public address, and reverses it on the replies.

- **Static NAT** -- one private IP <-> one public IP (e.g. to publish a
  server).
- **Dynamic NAT** -- private IPs are mapped to a pool of public IPs, first
  come first served.
- **PAT** (Port Address Translation, "NAT overload") -- **many** private
  IPs share **one** public IP; the router also rewrites the source **port**
  and keeps a translation table to tell the flows apart. This is what a home
  router does.

NAT conserves public addresses and hides the internal structure, but it
breaks end-to-end addressing and complicates protocols that carry IPs in
their payload. IPv6''s huge address space removes most of the need for it.', 4
FROM modules WHERE track_id = @n AND title = 'Module 5: Switching and Advanced LAN';

-- ---- Module 6: Network Security -----------------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Access Control Lists (ACLs)',
'An **ACL** is an ordered list of permit/deny rules a router or switch
applies to traffic on an interface, per direction.

- **Standard ACL** -- filters on **source IP** only. Place it **close to the
  destination** so you do not block traffic too early.
- **Extended ACL** -- filters on source **and** destination IP, protocol,
  and port. Place it **close to the source** to drop unwanted traffic
  before it crosses the network.

How it is evaluated:

1. Rules are checked **top-down**; the **first match wins** and the rest are
   skipped.
2. There is an **implicit `deny any`** at the end -- if nothing matches,
   the packet is dropped.
3. Order matters: put specific rules before general ones.

Uses: restrict management access, block known-bad ranges, enforce
segmentation between VLANs, and select traffic for NAT or QoS.', 1
FROM modules WHERE track_id = @n AND title = 'Module 6: Network Security';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Firewalls, IDS, and IPS',
'- **Firewall** -- the policy enforcement point between zones (inside, DMZ,
  outside).
  - *Stateless* / packet filter -- checks each packet against rules in
    isolation.
  - *Stateful* -- tracks connections, so return traffic for an allowed
    outbound flow is permitted automatically.
  - *Next-generation (NGFW)* -- adds application awareness, user identity,
    and integrated IPS.
- **IDS** (Intrusion Detection System) -- watches a **copy** of the traffic
  (via a SPAN port or tap) and **alerts** on suspicious patterns. It is
  out-of-band, so it cannot stop an attack, only report it.
- **IPS** (Intrusion Prevention System) -- sits **inline** in the traffic
  path and can **drop** malicious packets in real time. The cost is that it
  adds latency and a failure can break connectivity.

Detection methods: **signature-based** (matches known attack patterns) and
**anomaly-based** (flags deviation from a learned baseline).', 2
FROM modules WHERE track_id = @n AND title = 'Module 6: Network Security';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Virtual Private Networks (VPNs)',
'A **VPN** carries private traffic across a public network inside an
encrypted **tunnel**, giving confidentiality, integrity, and authentication.

- **Site-to-site VPN** -- two routers/firewalls join two offices; users are
  unaware of it. Usually **IPsec**.
- **Remote-access VPN** -- a client on a laptop connects back to the
  corporate network. Usually **SSL/TLS VPN** (works through browsers and
  NAT) or IPsec.

**IPsec** components: **IKE** negotiates keys; **ESP** encrypts and
authenticates the payload; **AH** authenticates only (rarely used). Modes:
**transport** (protects the payload, host-to-host) and **tunnel**
(protects the whole original packet, gateway-to-gateway).

A VPN protects data **in transit**; it does not by itself protect the
endpoints.', 3
FROM modules WHERE track_id = @n AND title = 'Module 6: Network Security';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Port Security and DHCP Snooping',
'Switch-level protections against LAN attacks:

- **Port security** -- limits how many (and optionally which) MAC addresses
  a port will accept. Exceeding the limit triggers a violation action:
  *protect* (drop silently), *restrict* (drop + log), or *shutdown*
  (err-disable the port). Stops MAC flooding and rogue hubs/switches.
- **DHCP snooping** -- the switch marks uplink ports as **trusted** and
  access ports as **untrusted**, then drops DHCP **server** messages
  (OFFER/ACK) arriving on untrusted ports. Defeats a rogue DHCP server. It
  also builds a binding table of *MAC + IP + port + VLAN*.
- **Dynamic ARP Inspection (DAI)** -- uses that binding table to drop
  spoofed ARP replies, stopping ARP poisoning / man-in-the-middle.
- **BPDU Guard** -- shuts a PortFast access port if it receives STP BPDUs,
  stopping someone plugging in a switch to hijack the spanning tree.', 4
FROM modules WHERE track_id = @n AND title = 'Module 6: Network Security';

-- ---- Module 7: Modern and Cloud Networking ------------------------
INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'SDN and NFV',
'Traditionally every switch/router runs its own control logic. Two ideas
change that:

- **SDN** (Software-Defined Networking) **separates the control plane from
  the data plane**. A central **controller** has the whole-network view and
  programs the forwarding tables of the devices (e.g. via **OpenFlow** or
  vendor APIs). Benefits: central policy, automation, faster change; the
  devices become simpler "forwarders".
- **NFV** (Network Function Virtualization) runs network functions --
  firewall, load balancer, router, WAN optimiser -- as **software on
  general-purpose servers or VMs** instead of dedicated appliances. You can
  spin one up, scale it, or move it like any other workload.

They are complementary: SDN is about *who decides* forwarding; NFV is about
*what hardware* the functions run on. Together they underpin cloud and
carrier networks and **intent-based networking**.', 1
FROM modules WHERE track_id = @n AND title = 'Module 7: Modern and Cloud Networking';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Cloud Networking Basics',
'**Cloud service models:**

| Model | You manage | Provider manages | Example |
|-------|-----------|------------------|---------|
| **IaaS** | OS, apps, data | compute, storage, network | VMs, virtual networks |
| **PaaS** | apps, data | runtime, OS, infra | managed databases, app platforms |
| **SaaS** | just your data/config | everything else | webmail, CRM |

**Deployment models:** public, private, hybrid, multi-cloud.

**Cloud network building blocks:** a **VPC/VNet** (your isolated address
space), **subnets** per tier, **security groups** (stateful, instance-level
firewalls), **route tables**, an **internet gateway** / **NAT gateway**,
**load balancers**, and **VPN or dedicated interconnect** back to
on-premises.

Cloud shifts networking toward **software and API-driven** configuration --
you describe the network in code and the provider builds it.', 2
FROM modules WHERE track_id = @n AND title = 'Module 7: Modern and Cloud Networking';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'IoT Networking and 5G Slicing',
'**IoT** (Internet of Things) connects large numbers of small,
low-power devices. Its networking needs differ from a PC LAN:

- low power and low data rate, sometimes battery life measured in years
- lightweight protocols: **MQTT** and **CoAP** at the application layer;
  **6LoWPAN** to run IPv6 over low-power radios
- access technologies: Zigbee, Bluetooth LE, LoRaWAN, NB-IoT, Wi-Fi
- an **IoT gateway** aggregates local devices and bridges them to the
  cloud; **edge computing** processes data near the source to cut latency
  and bandwidth

**5G network slicing** lets one physical 5G network be partitioned into
multiple **virtual networks**, each tuned for a purpose: a
high-bandwidth slice for video, an ultra-low-latency slice for industrial
control, a massive-device slice for IoT sensors -- each with its own SLA.', 3
FROM modules WHERE track_id = @n AND title = 'Module 7: Modern and Cloud Networking';

INSERT INTO lessons (module_id, title, body_md, sort_order)
SELECT id, 'Network Troubleshooting Tools and Method',
'**A structured method** (bottom-up along the OSI layers):

1. **Physical** -- link light, cable, correct port, interface not shut.
2. **Data link** -- correct VLAN, duplex/speed match, MAC table, no errors.
3. **Network** -- right IP/mask/gateway, `ping` the gateway, then a remote
   host; check the routing table and TTL.
4. **Transport** -- is the port open? firewall/ACL in the way?
5. **Application** -- DNS resolving? service actually running?

**Tools:**

| Tool | Tells you |
|------|-----------|
| `ping` | is the host reachable, and round-trip time |
| `traceroute` / `tracert` | the path and where it breaks |
| `ipconfig` / `ifconfig` / `ip` | local address, mask, gateway |
| `nslookup` / `dig` | DNS resolution |
| `arp -a` | IP-to-MAC cache |
| `netstat` / `ss` | local ports and connections |
| Wireshark / `tcpdump` | the actual packets on the wire |
| show commands (`show ip route`, `show interfaces`) | device state |

Always **change one thing at a time** and re-test.', 4
FROM modules WHERE track_id = @n AND title = 'Module 7: Modern and Cloud Networking';

-- ============================================================================
--  ASSESSMENTS  (Test module - multiple choice, admin-gated)
-- ============================================================================

-- ---- Assessment 1: Fundamentals and Models (Modules 1-2) ---------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@n, 'Networking Assessment 1: Fundamentals and Models',
'Multiple choice. One correct answer per question.', 25, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which network type typically spans a single building and is managed by one organisation?', 10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'WAN', 0, 1), (@i, 'LAN', 1, 2), (@i, 'MAN', 0, 3), (@i, 'The internet', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'In a star topology, what happens when one end-device link fails?', 10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'The whole network goes down', 0, 1),
(@i, 'Only that device loses connectivity', 1, 2),
(@i, 'Traffic reverses around a ring', 0, 3),
(@i, 'All devices must re-negotiate speed', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'At which OSI layer does a router primarily operate?', 10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'Layer 1 - Physical', 0, 1),
(@i, 'Layer 2 - Data Link', 0, 2),
(@i, 'Layer 3 - Network', 1, 3),
(@i, 'Layer 4 - Transport', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'A switch forwards a frame whose destination MAC is not in its table by...', 10, 4);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'dropping it', 0, 1),
(@i, 'flooding it out every port except the one it arrived on', 1, 2),
(@i, 'sending it to the default gateway', 0, 3),
(@i, 'returning it to the sender', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Encapsulation adds a Layer 2 header and trailer to produce a...', 10, 5);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'segment', 0, 1), (@i, 'packet', 0, 2), (@i, 'frame', 1, 3), (@i, 'datagram', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which TCP/IP layer corresponds to OSI layers 5, 6 and 7 combined?', 10, 6);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'Network Access', 0, 1), (@i, 'Internet', 0, 2),
(@i, 'Transport', 0, 3), (@i, 'Application', 1, 4);

-- ---- Assessment 2: Addressing and Subnetting (Module 3) ---------------
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@n, 'Networking Assessment 2: Addressing and Subnetting',
'Multiple choice. Work the subnetting questions on paper.', 30, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'How many usable host addresses are in a /26 subnet?', 10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, '64', 0, 1), (@i, '62', 1, 2), (@i, '30', 0, 3), (@i, '126', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which address range is private (RFC 1918)?', 10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, '8.8.8.0/24', 0, 1), (@i, '172.16.0.0/12', 1, 2),
(@i, '169.254.0.0/16', 0, 3), (@i, '127.0.0.0/8', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'What is the network address of the host 192.168.1.130/26?', 10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, '192.168.1.0', 0, 1), (@i, '192.168.1.64', 0, 2),
(@i, '192.168.1.128', 1, 3), (@i, '192.168.1.192', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which mask would you assign to a point-to-point link between two routers to waste no addresses?', 10, 4);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, '/24', 0, 1), (@i, '/28', 0, 2), (@i, '/30', 1, 3), (@i, '/32', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which statement about IPv6 is correct?', 10, 5);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'It is 64 bits long', 0, 1),
(@i, 'It has no broadcast; it uses multicast instead', 1, 2),
(@i, 'Its header contains a checksum', 0, 3),
(@i, 'It always requires NAT to reach the internet', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'CIDR notation /22 means the subnet mask is...', 10, 6);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, '255.255.252.0', 1, 1), (@i, '255.255.255.0', 0, 2),
(@i, '255.255.0.0', 0, 3), (@i, '255.255.254.0', 0, 4);

-- ---- Assessment 3: Protocols, Switching and Security (Modules 4-6) ----
INSERT INTO tests (track_id, title, instructions, duration_minutes, is_published, created_by)
VALUES (@n, 'Networking Assessment 3: Protocols, Switching and Security',
'Multiple choice. One correct answer per question.', 30, 1, @admin);
SET @t := LAST_INSERT_ID();

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which protocol maps a known IP address to a MAC address on the local link?', 10, 1);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'ICMP', 0, 1), (@i, 'ARP', 1, 2), (@i, 'DNS', 0, 3), (@i, 'DHCP', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which is the correct TCP connection-establishment sequence?', 10, 2);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'SYN, ACK, FIN', 0, 1),
(@i, 'SYN -> SYN,ACK -> ACK', 1, 2),
(@i, 'ACK -> SYN -> ACK', 0, 3),
(@i, 'SYN -> ACK -> SYN', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'Which service uses UDP port 53 for normal queries?', 10, 3);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'HTTP', 0, 1), (@i, 'SMTP', 0, 2), (@i, 'DNS', 1, 3), (@i, 'FTP', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'What is the main purpose of the Spanning Tree Protocol?', 10, 4);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'Encrypt switch-to-switch traffic', 0, 1),
(@i, 'Prevent Layer 2 loops on redundant links', 1, 2),
(@i, 'Assign IP addresses to hosts', 0, 3),
(@i, 'Route between VLANs', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'A home router lets many internal devices share one public IP using...', 10, 5);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'static NAT', 0, 1), (@i, 'PAT (NAT overload)', 1, 2),
(@i, 'DHCP', 0, 3), (@i, 'a trunk port', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'How does an IPS differ from an IDS?', 10, 6);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'An IPS only logs; an IDS blocks', 0, 1),
(@i, 'An IPS sits inline and can drop malicious traffic; an IDS only alerts', 1, 2),
(@i, 'They are the same thing', 0, 3),
(@i, 'An IDS encrypts traffic; an IPS does not', 0, 4);

INSERT INTO test_items (test_id, type, prompt_md, points, sort_order) VALUES
(@t, 'mcq', 'At the end of every ACL there is an implicit...', 10, 7);
SET @i := LAST_INSERT_ID();
INSERT INTO test_item_options (item_id, label, is_correct, sort_order) VALUES
(@i, 'permit any', 0, 1), (@i, 'deny any', 1, 2),
(@i, 'log any', 0, 3), (@i, 'nothing', 0, 4);

-- ============================================================================
--  Recompute cached point totals
-- ============================================================================
UPDATE tests t
   SET total_points = (SELECT COALESCE(SUM(points), 0) FROM test_items WHERE test_id = t.id)
 WHERE t.track_id = @n;

SELECT
  (SELECT COUNT(*) FROM modules WHERE track_id = @n)                            AS modules,
  (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id
     WHERE m.track_id = @n)                                                     AS lessons,
  (SELECT COUNT(*) FROM tests WHERE track_id = @n)                              AS assessments,
  (SELECT COUNT(*) FROM test_items ti JOIN tests te ON te.id = ti.test_id
     WHERE te.track_id = @n)                                                    AS questions,
  (SELECT COUNT(*) FROM test_item_options o JOIN test_items ti ON ti.id = o.item_id
     JOIN tests te ON te.id = ti.test_id WHERE te.track_id = @n)                AS options;
