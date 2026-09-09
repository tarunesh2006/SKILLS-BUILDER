-- ============================================================================
--  Networking track - per-module "Check Your Understanding" quizzes
--
--  Part of COURSE DELIVERY: 5 MCQs per module, shown on the module page,
--  retakeable, immediate feedback. Passing (with every lesson opened) marks
--  the module complete.
--
--  RE-RUNNABLE: deletes existing module quizzes for the Networking track.
--  Run this AFTER db/seed_networking_track.sql.
--
--  Usage:
--    docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 \
--      learning_platform < db/seed_networking_module_quizzes.sql
-- ============================================================================
SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES,STRICT_TRANS_TABLES';
USE learning_platform;

SET @n := (SELECT id FROM tracks WHERE slug = 'networking');

DELETE mq FROM module_quizzes mq
  JOIN modules m ON m.id = mq.module_id
 WHERE m.track_id = @n;

-- ===========================================================================
-- Module 1: Networking Basics and Fundamentals
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 1 Quiz: Networking Basics'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 1:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which network type typically spans a city?', 'mcq',
        'LAN = one site, MAN = a metropolitan area / city, WAN = country or global.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'LAN', 0, 1), (@qq, 'MAN', 1, 2), (@qq, 'WAN', 0, 3), (@qq, 'WLAN', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In a star topology, one end-device cable is cut. What is the effect?', 'mcq',
        'Each device has its own link to the central switch, so only that device is affected.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The whole segment goes down', 0, 1),
(@qq, 'Only that one device loses connectivity', 1, 2),
(@qq, 'Traffic loops back around a ring', 0, 3),
(@qq, 'Every device must renegotiate its speed', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which transmission medium is immune to electromagnetic interference and best for long, high-bandwidth backbones?', 'mcq',
        'Fiber carries light, not electrical signals, so EMI does not affect it, and it supports long distances and huge bandwidth.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Twisted-pair copper', 0, 1), (@qq, 'Coaxial cable', 0, 2),
(@qq, 'Fiber optic', 1, 3), (@qq, 'Wi-Fi', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How does a hub handle an incoming frame?', 'mcq',
        'A hub is a Layer 1 repeater: it sends every bit out of all other ports, and all ports share one collision domain.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Sends it only to the destination port', 0, 1),
(@qq, 'Repeats it out of every other port', 1, 2),
(@qq, 'Looks up the destination IP in a routing table', 0, 3),
(@qq, 'Drops it unless the MAC is known', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which device forwards traffic based on MAC addresses and gives each port its own collision domain?', 'mcq',
        'A switch is a Layer 2 device that learns MAC-to-port mappings and forwards each frame only where it needs to go.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Hub', 0, 1), (@qq, 'Switch', 1, 2), (@qq, 'Router', 0, 3), (@qq, 'Firewall', 0, 4);

-- ===========================================================================
-- Module 2: Network Models
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 2 Quiz: Network Models'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 2:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which OSI layer is responsible for logical addressing and routing between networks?', 'mcq',
        'Layer 3, the Network layer, handles IP addressing and routing. Its PDU is the packet.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Layer 2 - Data Link', 0, 1), (@qq, 'Layer 3 - Network', 1, 2),
(@qq, 'Layer 4 - Transport', 0, 3), (@qq, 'Layer 7 - Application', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'End-to-end delivery, port numbers, and (for TCP) reliability belong to which OSI layer?', 'mcq',
        'The Transport layer (4) - TCP and UDP live here.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Session (5)', 0, 1), (@qq, 'Transport (4)', 1, 2),
(@qq, 'Network (3)', 0, 3), (@qq, 'Data Link (2)', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How many layers does the TCP/IP model have?', 'mcq',
        'Four: Application, Transport, Internet, Network Access. OSI layers 5-7 all map to the single TCP/IP Application layer.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '3', 0, 1), (@qq, '4', 1, 2), (@qq, '5', 0, 3), (@qq, '7', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'The protocol data unit at the Data Link layer is called a...', 'mcq',
        'Segment (L4) -> packet (L3) -> frame (L2) -> bits (L1).', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'segment', 0, 1), (@qq, 'packet', 0, 2), (@qq, 'frame', 1, 3), (@qq, 'bit stream', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Decapsulation - stripping headers layer by layer - happens on which device?', 'mcq',
        'The sender encapsulates going down the stack; the receiver decapsulates going up.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The sender', 0, 1), (@qq, 'The receiver', 1, 2),
(@qq, 'Every switch on the path', 0, 3), (@qq, 'Only routers', 0, 4);

-- ===========================================================================
-- Module 3: Addressing and Subnetting
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 3 Quiz: Addressing and Subnetting'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 3:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How many usable host addresses does a /24 subnet provide?', 'mcq',
        '2^(32-24) - 2 = 256 - 2 = 254 (subtracting the network and broadcast addresses).', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '256', 0, 1), (@qq, '254', 1, 2), (@qq, '255', 0, 3), (@qq, '252', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which of these is a private (RFC 1918) address block?', 'mcq',
        'The private ranges are 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '10.0.0.0/8', 1, 1), (@qq, '127.0.0.0/8', 0, 2),
(@qq, '169.254.0.0/16', 0, 3), (@qq, '8.8.8.0/24', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the network address that the host 192.168.1.100/26 belongs to?', 'mcq',
        'A /26 has a block size of 64. The subnets are .0, .64, .128, .192; .100 falls in the .64 subnet.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '192.168.1.0', 0, 1), (@qq, '192.168.1.64', 1, 2),
(@qq, '192.168.1.96', 0, 3), (@qq, '192.168.1.128', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does VLSM allow you to do?', 'mcq',
        'Variable Length Subnet Masking uses different mask lengths within the same network so each subnet is only as big as it needs to be.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Use one fixed mask for the whole network', 0, 1),
(@qq, 'Use different mask lengths for different subnets in one network', 1, 2),
(@qq, 'Convert IPv4 addresses to IPv6', 0, 3),
(@qq, 'Disable subnetting entirely', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How long is an IPv6 address?', 'mcq',
        'IPv6 is 128 bits, written as eight groups of four hex digits.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '32 bits', 0, 1), (@qq, '64 bits', 0, 2),
(@qq, '128 bits', 1, 3), (@qq, '256 bits', 0, 4);

-- ===========================================================================
-- Module 4: Core Protocols and Services
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 4 Quiz: Core Protocols and Services'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 4:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does ARP resolve?', 'mcq',
        'ARP maps a known IP address to the MAC address on the local link.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'A hostname to an IP address', 0, 1),
(@qq, 'An IP address to a MAC address', 1, 2),
(@qq, 'A MAC address to a switch port', 0, 3),
(@qq, 'A port number to a service', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which transport protocol is connectionless, has an 8-byte header, and does no retransmission?', 'mcq',
        'UDP - low overhead, no handshake; used by DNS, DHCP, VoIP, streaming.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'TCP', 0, 1), (@qq, 'UDP', 1, 2), (@qq, 'IP', 0, 3), (@qq, 'ICMP', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which routing protocol runs between autonomous systems and effectively runs the internet?', 'mcq',
        'BGP is the exterior gateway protocol; RIP, OSPF and EIGRP are interior.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'RIP', 0, 1), (@qq, 'OSPF', 0, 2), (@qq, 'EIGRP', 0, 3), (@qq, 'BGP', 1, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'When a packet''s TTL reaches 0, the router...', 'mcq',
        'It drops the packet and sends back an ICMP "time exceeded" message - which is how traceroute works.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'forwards it anyway', 0, 1),
(@qq, 'drops it and sends an ICMP time-exceeded message', 1, 2),
(@qq, 'buffers it until the TTL resets', 0, 3),
(@qq, 'returns it to the source unchanged', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the correct order of the DHCP DORA process?', 'mcq',
        'Discover (client broadcast) -> Offer -> Request -> Acknowledge.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Discover, Offer, Request, Acknowledge', 1, 1),
(@qq, 'Offer, Discover, Acknowledge, Request', 0, 2),
(@qq, 'Request, Offer, Discover, Acknowledge', 0, 3),
(@qq, 'Discover, Request, Offer, Acknowledge', 0, 4);

-- ===========================================================================
-- Module 5: Switching and Advanced LAN
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 5 Quiz: Switching and Advanced LAN'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 5:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does a trunk port do?', 'mcq',
        'A trunk carries traffic for many VLANs between switches, tagging each frame with an 802.1Q VLAN ID.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Carries a single VLAN to one end device', 0, 1),
(@qq, 'Carries multiple VLANs, tagged with 802.1Q', 1, 2),
(@qq, 'Blocks all VLAN traffic', 0, 3),
(@qq, 'Routes between VLANs', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Two hosts in different VLANs on the same switch need to communicate. What is required?', 'mcq',
        'VLANs are separate broadcast domains; a Layer 3 device (router or Layer 3 switch) must route between them.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Nothing - same switch means they can already talk', 0, 1),
(@qq, 'A Layer 3 device to route between the VLANs', 1, 2),
(@qq, 'A crossover cable between the hosts', 0, 3),
(@qq, 'Spanning Tree Protocol', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'To break a Layer 2 loop, STP puts a redundant port into which state?', 'mcq',
        'Blocking - the port carries no user data but still listens for topology changes so it can take over if a link fails.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Forwarding', 0, 1), (@qq, 'Blocking', 1, 2),
(@qq, 'Trunking', 0, 3), (@qq, 'Err-disabled', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How does PAT let many internal hosts share one public IP?', 'mcq',
        'PAT (NAT overload) rewrites the source port as well as the address, and keeps a table to map replies back to the right host.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It assigns each host a public IP from a pool', 0, 1),
(@qq, 'It also translates the source port and tracks the mapping', 1, 2),
(@qq, 'It tunnels the traffic with IPsec', 0, 3),
(@qq, 'It uses a separate VLAN per host', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'An access port belongs to how many VLANs?', 'mcq',
        'Exactly one. Only trunk ports carry multiple VLANs.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Zero', 0, 1), (@qq, 'Exactly one', 1, 2),
(@qq, 'Up to two', 0, 3), (@qq, 'All of them', 0, 4);

-- ===========================================================================
-- Module 6: Network Security
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 6 Quiz: Network Security'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 6:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A standard ACL filters traffic based on...', 'mcq',
        'Standard ACLs match on source IP only. Extended ACLs add destination, protocol and port.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'source IP address only', 1, 1),
(@qq, 'source and destination IP, protocol and port', 0, 2),
(@qq, 'MAC address', 0, 3),
(@qq, 'application content', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How is an ACL evaluated?', 'mcq',
        'Top-down, first match wins, and there is an implicit "deny any" at the end.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'All rules are applied and the most specific wins', 0, 1),
(@qq, 'Top-down; the first matching rule is applied and the rest are skipped', 1, 2),
(@qq, 'Bottom-up; the last matching rule wins', 0, 3),
(@qq, 'Rules are applied in random order', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the key difference between an IDS and an IPS?', 'mcq',
        'An IPS sits inline and can drop malicious traffic; an IDS watches a copy and only raises alerts.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'An IDS blocks traffic; an IPS only logs', 0, 1),
(@qq, 'An IPS is inline and can block; an IDS only detects and alerts', 1, 2),
(@qq, 'They are identical', 0, 3),
(@qq, 'An IPS is hardware; an IDS is always software', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A site-to-site VPN between two office routers most commonly uses...', 'mcq',
        'IPsec (with IKE for key exchange and ESP for encryption) is the usual site-to-site technology.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'IPsec', 1, 1), (@qq, 'HTTP', 0, 2), (@qq, 'STP', 0, 3), (@qq, 'ARP', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'DHCP snooping drops DHCP server messages (OFFER/ACK) that arrive on...', 'mcq',
        'Access ports are untrusted; a legitimate DHCP server should only be reachable via a trusted uplink port.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'trusted uplink ports', 0, 1),
(@qq, 'untrusted access ports', 1, 2),
(@qq, 'the switch management VLAN', 0, 3),
(@qq, 'trunk ports only', 0, 4);

-- ===========================================================================
-- Module 11: Modern and Cloud Networking
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 11 Quiz: Modern and Cloud Networking'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 11:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'The core idea of SDN is to...', 'mcq',
        'SDN separates the control plane (decision-making) from the data plane (forwarding) and centralises control in a controller.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'separate the control plane from the data plane', 1, 1),
(@qq, 'replace all routers with hubs', 0, 2),
(@qq, 'encrypt every link by default', 0, 3),
(@qq, 'remove the need for IP addressing', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'NFV (Network Function Virtualization) means...', 'mcq',
        'Running firewalls, load balancers, routers, etc. as software on general-purpose servers instead of dedicated appliances.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'running network functions as software on standard servers', 1, 1),
(@qq, 'a new cabling standard', 0, 2),
(@qq, 'a routing protocol for data centres', 0, 3),
(@qq, 'virtual LAN tagging', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In the IaaS cloud model, what does the customer manage?', 'mcq',
        'IaaS: the provider runs the compute/storage/network infrastructure; the customer manages the OS, applications and data.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Nothing - it is fully managed', 0, 1),
(@qq, 'The operating system, applications and data', 1, 2),
(@qq, 'Only the physical hardware', 0, 3),
(@qq, 'The provider''s data centre network', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does 5G network slicing provide?', 'mcq',
        'One physical 5G network is partitioned into multiple virtual networks, each tuned (bandwidth, latency, device density) with its own SLA.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Multiple virtual networks on one physical network, each with its own SLA', 1, 1),
(@qq, 'Faster download of large files only', 0, 2),
(@qq, 'A way to split a fiber cable', 0, 3),
(@qq, 'Encryption of all cellular traffic', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A user reports "no network at all". Following a structured method, what do you check first?', 'mcq',
        'Work bottom-up: start at Layer 1 - link light, cable, correct port, interface not administratively down.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'DNS resolution', 0, 1),
(@qq, 'The physical link - cable, port, link light', 1, 2),
(@qq, 'The BGP routing table', 0, 3),
(@qq, 'The application logs', 0, 4);

-- ===========================================================================
-- Module 7: Wireless Networking
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 7 Quiz: Wireless Networking'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 7:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Wi-Fi uses which media-access method?', 'mcq',
        'A radio cannot listen while transmitting, so 802.11 uses CSMA/CA (collision avoidance) with ACKs, not CSMA/CD.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'CSMA/CD', 0, 1), (@qq, 'CSMA/CA', 1, 2),
(@qq, 'Token passing', 0, 3), (@qq, 'Full-duplex switching', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'How many non-overlapping channels does the 2.4 GHz band offer?', 'mcq',
        'Only three: channels 1, 6 and 11. The 5 GHz band has many more.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '1', 0, 1), (@qq, '3', 1, 2), (@qq, '11', 0, 3), (@qq, '24', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which wireless security standard uses the SAE handshake and mandatory Protected Management Frames?', 'mcq',
        'WPA3. WEP and WPA are obsolete; WPA2 uses AES-CCMP but the older 4-way handshake.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'WEP', 0, 1), (@qq, 'WPA', 0, 2), (@qq, 'WPA2', 0, 3), (@qq, 'WPA3', 1, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In a large campus WLAN, lightweight access points get their configuration and RF settings from...', 'mcq',
        'A Wireless LAN Controller (WLC), which the APs reach over CAPWAP.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'each other via a mesh', 0, 1),
(@qq, 'a Wireless LAN Controller (WLC)', 1, 2),
(@qq, 'the DHCP server', 0, 3),
(@qq, 'individual manual configuration', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'A received signal strength of -85 dBm indicates...', 'mcq',
        'Wi-Fi RSSI is negative; closer to 0 is stronger. -30 to -50 is excellent, around -67 is the target for voice, and -80 or below is unreliable.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'an excellent signal', 0, 1),
(@qq, 'a weak, unreliable signal', 1, 2),
(@qq, 'interference-free operation', 0, 3),
(@qq, 'a wired connection', 0, 4);

-- ===========================================================================
-- Module 8: WAN Technologies and Connectivity
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 8 Quiz: WAN Technologies'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 8:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the demarcation point (demarc) on a WAN link?', 'mcq',
        'It is where the service provider''s responsibility ends and the customer''s begins.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The customer''s core switch', 0, 1),
(@qq, 'The boundary between the provider and the customer', 1, 2),
(@qq, 'The DNS server', 0, 3),
(@qq, 'The default gateway', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which serial-link authentication method sends no password over the wire?', 'mcq',
        'CHAP uses a challenge-response exchange; PAP sends the password in clear text.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'PAP', 0, 1), (@qq, 'CHAP', 1, 2), (@qq, 'HDLC', 0, 3), (@qq, 'None - PPP has no authentication', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In an MPLS network, core (P) routers forward traffic based on...', 'mcq',
        'The MPLS label pushed at the edge, not a full destination-IP lookup.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'the destination IP address', 0, 1),
(@qq, 'a short label', 1, 2),
(@qq, 'the source MAC address', 0, 3),
(@qq, 'the TCP port', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the defining feature of SD-WAN?', 'mcq',
        'A central controller and policy-based, application-aware path selection across several transports (MPLS, broadband, LTE) at once.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It replaces all routers with switches', 0, 1),
(@qq, 'Central control and application-aware use of multiple transports', 1, 2),
(@qq, 'It only works over satellite', 0, 3),
(@qq, 'It removes the need for encryption', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which WAN access technology shares bandwidth with other subscribers in the neighbourhood?', 'mcq',
        'Cable (DOCSIS) is a shared medium; a dedicated leased line is not.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'A dedicated leased line', 0, 1),
(@qq, 'Cable broadband', 1, 2),
(@qq, 'A point-to-point fiber link', 0, 3),
(@qq, 'An MPLS L3 VPN', 0, 4);

-- ===========================================================================
-- Module 9: Network Services, QoS and Management
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 9 Quiz: Services, QoS and Management'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 9:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Why does accurate NTP matter across a network?', 'mcq',
        'Correlated log timestamps, certificate validity, Kerberos, and scheduled jobs all depend on synchronised clocks.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It speeds up routing convergence', 0, 1),
(@qq, 'Logs, certificates and authentication all rely on synchronised time', 1, 2),
(@qq, 'It assigns IP addresses', 0, 3),
(@qq, 'It is only needed on wireless networks', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which DNS record maps a name to an IPv6 address?', 'mcq',
        'AAAA maps name -> IPv6. A is name -> IPv4; PTR is the reverse; MX points to mail servers.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'A', 0, 1), (@qq, 'AAAA', 1, 2), (@qq, 'CNAME', 0, 3), (@qq, 'MX', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which SNMP version should you use because it adds authentication and encryption?', 'mcq',
        'SNMPv3. v1 and v2c authenticate only with a plaintext community string.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'SNMPv1', 0, 1), (@qq, 'SNMPv2c', 0, 2), (@qq, 'SNMPv3', 1, 3), (@qq, 'They are all equally secure', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What problem do HSRP and VRRP solve?', 'mcq',
        'They remove the default gateway as a single point of failure by sharing one virtual IP/MAC between two routers.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Slow DNS resolution', 0, 1),
(@qq, 'A single default gateway being a single point of failure', 1, 2),
(@qq, 'IP address exhaustion', 0, 3),
(@qq, 'Wi-Fi interference', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In QoS, what is the difference between policing and shaping?', 'mcq',
        'Policing drops (or re-marks) traffic above the rate immediately; shaping buffers it and releases it smoothly.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'They are the same thing', 0, 1),
(@qq, 'Policing drops excess traffic; shaping buffers and smooths it', 1, 2),
(@qq, 'Shaping drops packets; policing encrypts them', 0, 3),
(@qq, 'Both only apply to wireless links', 0, 4);

-- ===========================================================================
-- Module 10: Network Design and High Availability
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 10 Quiz: Design and High Availability'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 10:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In the hierarchical campus model, which layer performs inter-VLAN routing and applies policy/ACLs?', 'mcq',
        'The distribution layer aggregates access switches and does the routing and policy; the core just forwards fast.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Access', 0, 1), (@qq, 'Distribution', 1, 2),
(@qq, 'Core', 0, 3), (@qq, 'Physical', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What does EtherChannel (LACP) provide?', 'mcq',
        'It bundles several physical links into one logical link with load balancing and fast failover, and STP treats it as one link.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'Encryption between switches', 0, 1),
(@qq, 'One logical link from several physical links, load-balanced', 1, 2),
(@qq, 'Automatic IP addressing', 0, 3),
(@qq, 'VLAN tagging', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Why is spine-leaf preferred in modern data centres?', 'mcq',
        'Every server is exactly two hops from any other, giving predictable low latency for heavy east-west (server-to-server) traffic, and it scales by adding leaves or spines.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It uses only one cable per rack', 0, 1),
(@qq, 'It gives predictable low latency for east-west traffic and scales out easily', 1, 2),
(@qq, 'It removes the need for switches', 0, 3),
(@qq, 'It relies on spanning tree for load balancing', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is the maximum length of a horizontal copper cable run under the structured-cabling standard (permanent link)?', 'mcq',
        '90 m permanent link plus up to 10 m of patch cords = 100 m total channel.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '55 m', 0, 1), (@qq, '90 m', 1, 2), (@qq, '150 m', 0, 3), (@qq, '300 m', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which PoE standard delivers the most power to a device?', 'mcq',
        '802.3bt (PoE++) provides up to ~71 W at the device; 802.3af gives ~13 W and 802.3at ~25 W.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, '802.3af (PoE)', 0, 1), (@qq, '802.3at (PoE+)', 0, 2),
(@qq, '802.3bt (PoE++)', 1, 3), (@qq, 'They all deliver the same', 0, 4);

-- ===========================================================================
-- Module 12: Network Automation and Programmability
-- ===========================================================================
INSERT INTO module_quizzes (module_id, title)
SELECT id, 'Module 12 Quiz: Automation and Programmability'
  FROM modules WHERE track_id = @n AND title LIKE 'Module 12:%';
SET @q := LAST_INSERT_ID();

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Which HTTP verb does a REST API use to read a resource?', 'mcq',
        'GET reads; POST creates; PUT/PATCH update; DELETE removes.', 1);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'GET', 1, 1), (@qq, 'POST', 0, 2), (@qq, 'PUT', 0, 3), (@qq, 'DELETE', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'What is YANG?', 'mcq',
        'YANG is a language for defining a data model - the exact structure and types of a device''s configuration and state - used by NETCONF and RESTCONF.', 2);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'A transport protocol like SSH', 0, 1),
(@qq, 'A data-modelling language for device config and state', 1, 2),
(@qq, 'A Python automation library', 0, 3),
(@qq, 'A cabling standard', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'Ansible is described as "agentless". What does that mean?', 'mcq',
        'It needs no software installed on the managed devices - it connects over existing SSH or an API.', 3);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'It cannot make configuration changes', 0, 1),
(@qq, 'No software has to be installed on the managed devices', 1, 2),
(@qq, 'It only works on Cisco equipment', 0, 3),
(@qq, 'It runs entirely in the cloud', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In "Infrastructure as Code" for networks, where does the source of truth for configuration live?', 'mcq',
        'In a version-control repository (Git), so every change is a reviewed, revertible commit with history.', 4);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'On each device''s running config', 0, 1),
(@qq, 'In a Git repository', 1, 2),
(@qq, 'In an SNMP MIB', 0, 3),
(@qq, 'In the DHCP server', 0, 4);

INSERT INTO module_quiz_questions (quiz_id, prompt_md, type, explanation_md, sort_order)
VALUES (@q, 'In a controller-based (SDN) network, which API does an operator or app use to express intent to the controller?', 'mcq',
        'The northbound API. The controller then uses southbound protocols (NETCONF, OpenFlow, vendor APIs) to configure the devices.', 5);
SET @qq := LAST_INSERT_ID();
INSERT INTO module_quiz_options (question_id, label, is_correct, sort_order) VALUES
(@qq, 'The southbound API', 0, 1),
(@qq, 'The northbound API', 1, 2),
(@qq, 'SNMP traps', 0, 3),
(@qq, 'Spanning Tree', 0, 4);


-- ===========================================================================
SELECT
  (SELECT COUNT(*) FROM module_quizzes mq JOIN modules m ON m.id = mq.module_id
     WHERE m.track_id = @n)                                                     AS quizzes,
  (SELECT COUNT(*) FROM module_quiz_questions qq
     JOIN module_quizzes mq ON mq.id = qq.quiz_id
     JOIN modules m ON m.id = mq.module_id WHERE m.track_id = @n)               AS questions,
  (SELECT COUNT(*) FROM module_quiz_options o
     JOIN module_quiz_questions qq ON qq.id = o.question_id
     JOIN module_quizzes mq ON mq.id = qq.quiz_id
     JOIN modules m ON m.id = mq.module_id WHERE m.track_id = @n)               AS options;
