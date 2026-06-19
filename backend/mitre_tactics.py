"""Static MITRE ATT&CK tactic lookup for SERAi kill-chain visualisation.

Maps technique IDs (Txxxx) to the most relevant MITRE ATT&CK tactic (TAxxxx).
The mapping is intentionally compact — a single technique often appears in
multiple tactics, but for the kill-chain we only need the *primary* one.

Sources: MITRE ATT&CK v14 (Enterprise). Mapping is curated for the most
common techniques SERAi analyses are likely to encounter.
"""

# Format: technique_id_prefix (e.g. "T1566") -> (tactic_id, tactic_name)
# Using the leading numeric prefix so subtechniques (T1566.001) resolve too.
TECHNIQUE_TO_TACTIC: dict[str, tuple[str, str]] = {
    # Reconnaissance (TA0043)
    "T1595": ("TA0043", "Reconnaissance"),
    "T1592": ("TA0043", "Reconnaissance"),
    "T1589": ("TA0043", "Reconnaissance"),
    "T1590": ("TA0043", "Reconnaissance"),
    "T1591": ("TA0043", "Reconnaissance"),
    "T1583": ("TA0043", "Reconnaissance"),
    "T1584": ("TA0043", "Reconnaissance"),
    "T1585": ("TA0043", "Reconnaissance"),
    "T1586": ("TA0043", "Reconnaissance"),
    "T1587": ("TA0043", "Reconnaissance"),
    "T1588": ("TA0043", "Reconnaissance"),
    "T1650": ("TA0043", "Reconnaissance"),

    # Resource Development (TA0042)
    "T1652": ("TA0042", "Resource Development"),

    # Initial Access (TA0001)
    "T1189": ("TA0001", "Initial Access"),
    "T1190": ("TA0001", "Initial Access"),
    "T1133": ("TA0001", "Initial Access"),
    "T1200": ("TA0001", "Initial Access"),
    "T1566": ("TA0001", "Initial Access"),
    "T1091": ("TA0001", "Initial Access"),
    "T1195": ("TA0001", "Initial Access"),
    "T1199": ("TA0001", "Initial Access"),
    "T1078": ("TA0001", "Initial Access"),

    # Execution (TA0002)
    "T1059": ("TA0002", "Execution"),
    "T1203": ("TA0002", "Execution"),
    "T1559": ("TA0002", "Execution"),
    "T1106": ("TA0002", "Execution"),
    "T1053": ("TA0002", "Execution"),
    "T1129": ("TA0002", "Execution"),
    "T1072": ("TA0002", "Execution"),
    "T1204": ("TA0002", "Execution"),

    # Persistence (TA0003)
    "T1098": ("TA0003", "Persistence"),
    "T1197": ("TA0003", "Persistence"),
    "T1547": ("TA0003", "Persistence"),
    "T1037": ("TA0003", "Persistence"),
    "T1176": ("TA0003", "Persistence"),
    "T1554": ("TA0003", "Persistence"),
    "T1136": ("TA0003", "Persistence"),
    "T1543": ("TA0003", "Persistence"),
    "T1546": ("TA0003", "Persistence"),
    "T1574": ("TA0003", "Persistence"),
    "T1525": ("TA0003", "Persistence"),
    "T1556": ("TA0003", "Persistence"),
    "T1133": ("TA0003", "Persistence"),
    "T1505": ("TA0003", "Persistence"),
    "T1207": ("TA0003", "Persistence"),
    "T1108": ("TA0003", "Persistence"),

    # Privilege Escalation (TA0004)
    "T1068": ("TA0004", "Privilege Escalation"),
    "T1611": ("TA0004", "Privilege Escalation"),
    "T1058": ("TA0004", "Privilege Escalation"),
    "T1548": ("TA0004", "Privilege Escalation"),
    "T1134": ("TA0004", "Privilege Escalation"),
    "T1484": ("TA0004", "Privilege Escalation"),
    "T1612": ("TA0004", "Privilege Escalation"),

    # Defense Evasion (TA0005)
    "T1027": ("TA0005", "Defense Evasion"),
    "T1036": ("TA0005", "Defense Evasion"),
    "T1553": ("TA0005", "Defense Evasion"),
    "T1564": ("TA0005", "Defense Evasion"),
    "T1570": ("TA0005", "Defense Evasion"),
    "T1112": ("TA0005", "Defense Evasion"),
    "T1601": ("TA0005", "Defense Evasion"),
    "T1222": ("TA0005", "Defense Evasion"),
    "T1562": ("TA0005", "Defense Evasion"),
    "T1070": ("TA0005", "Defense Evasion"),
    "T1497": ("TA0005", "Defense Evasion"),
    "T1542": ("TA0005", "Defense Evasion"),
    "T1563": ("TA0004", "Privilege Escalation"),  # also DE, but primary is PE
    "T1574": ("TA0003", "Persistence"),

    # Credential Access (TA0006)
    "T1110": ("TA0006", "Credential Access"),
    "T1555": ("TA0006", "Credential Access"),
    "T1212": ("TA0006", "Credential Access"),
    "T1187": ("TA0006", "Credential Access"),
    "T1606": ("TA0006", "Credential Access"),
    "T1056": ("TA0006", "Credential Access"),
    "T1556": ("TA0006", "Credential Access"),
    "T1040": ("TA0006", "Credential Access"),
    "T1558": ("TA0006", "Credential Access"),
    "T1539": ("TA0006", "Credential Access"),
    "T1552": ("TA0006", "Credential Access"),
    "T1557": ("TA0006", "Credential Access"),

    # Discovery (TA0007)
    "T1087": ("TA0007", "Discovery"),
    "T1010": ("TA0007", "Discovery"),
    "T1217": ("TA0007", "Discovery"),
    "T1069": ("TA0007", "Discovery"),
    "T1082": ("TA0007", "Discovery"),
    "T1083": ("TA0007", "Discovery"),
    "T1046": ("TA0007", "Discovery"),
    "T1135": ("TA0007", "Discovery"),
    "T1040": ("TA0007", "Discovery"),
    "T1201": ("TA0007", "Discovery"),
    "T1120": ("TA0007", "Discovery"),
    "T1063": ("TA0007", "Discovery"),
    "T1210": ("TA0007", "Discovery"),
    "T1222": ("TA0007", "Discovery"),

    # Lateral Movement (TA0008)
    "T1210": ("TA0008", "Lateral Movement"),
    "T1534": ("TA0008", "Lateral Movement"),
    "T1570": ("TA0008", "Lateral Movement"),
    "T1563": ("TA0008", "Lateral Movement"),
    "T1021": ("TA0008", "Lateral Movement"),
    "T1091": ("TA0008", "Lateral Movement"),
    "T1077": ("TA0008", "Lateral Movement"),

    # Collection (TA0009)
    "T1560": ("TA0009", "Collection"),
    "T1123": ("TA0009", "Collection"),
    "T1119": ("TA0009", "Collection"),
    "T1115": ("TA0009", "Collection"),
    "T1530": ("TA0009", "Collection"),
    "T1213": ("TA0009", "Collection"),
    "T1005": ("TA0009", "Collection"),
    "T1039": ("TA0009", "Collection"),
    "T1025": ("TA0009", "Collection"),
    "T1074": ("TA0009", "Collection"),
    "T1114": ("TA0009", "Collection"),
    "T1056": ("TA0009", "Collection"),

    # Command and Control (TA0011)
    "T1071": ("TA0011", "Command and Control"),
    "T1092": ("TA0011", "Command and Control"),
    "T1132": ("TA0011", "Command and Control"),
    "T1008": ("TA0011", "Command and Control"),
    "T1105": ("TA0011", "Command and Control"),
    "T1104": ("TA0011", "Command and Control"),
    "T1090": ("TA0011", "Command and Control"),
    "T1571": ("TA0011", "Command and Control"),
    "T1572": ("TA0011", "Command and Control"),
    "T1573": ("TA0011", "Command and Control"),
    "T1095": ("TA0011", "Command and Control"),
    "T1574": ("TA0011", "Command and Control"),
    "T1219": ("TA0011", "Command and Control"),
    "T1205": ("TA0011", "Command and Control"),
    "T1102": ("TA0011", "Command and Control"),

    # Exfiltration (TA0010)
    "T1041": ("TA0010", "Exfiltration"),
    "T1048": ("TA0010", "Exfiltration"),
    "T1011": ("TA0010", "Exfiltration"),
    "T1052": ("TA0010", "Exfiltration"),
    "T1567": ("TA0010", "Exfiltration"),
    "T1029": ("TA0010", "Exfiltration"),
    "T1537": ("TA0010", "Exfiltration"),

    # Impact (TA0040)
    "T1531": ("TA0040", "Impact"),
    "T1485": ("TA0040", "Impact"),
    "T1486": ("TA0040", "Impact"),
    "T1490": ("TA0040", "Impact"),
    "T1499": ("TA0040", "Impact"),
    "T1491": ("TA0040", "Impact"),
    "T1492": ("TA0040", "Impact"),
    "T1493": ("TA0040", "Impact"),
    "T1494": ("TA0040", "Impact"),
    "T1495": ("TA0040", "Impact"),
    "T1496": ("TA0040", "Impact"),
    "T1498": ("TA0040", "Impact"),
    "T1529": ("TA0040", "Impact"),
}

# Ordered list of all MITRE ATT&CK Enterprise tactics in kill-chain order.
TACTICS_ORDERED: list[dict] = [
    {"id": "TA0043", "short": "Recon",       "name": "Reconnaissance",         "color": "#60a5fa"},
    {"id": "TA0042", "short": "Resource Dev","name": "Resource Development",   "color": "#818cf8"},
    {"id": "TA0001", "short": "Initial",     "name": "Initial Access",         "color": "#f97316"},
    {"id": "TA0002", "short": "Execution",   "name": "Execution",              "color": "#fbbf24"},
    {"id": "TA0003", "short": "Persist",     "name": "Persistence",            "color": "#a3e635"},
    {"id": "TA0004", "short": "PrivEsc",     "name": "Privilege Escalation",   "color": "#facc15"},
    {"id": "TA0005", "short": "Defense Ev",  "name": "Defense Evasion",        "color": "#94a3b8"},
    {"id": "TA0006", "short": "CredAccess",  "name": "Credential Access",      "color": "#fb7185"},
    {"id": "TA0007", "short": "Discovery",   "name": "Discovery",              "color": "#22d3ee"},
    {"id": "TA0008", "short": "Lateral",     "name": "Lateral Movement",       "color": "#c084fc"},
    {"id": "TA0009", "short": "Collect",     "name": "Collection",             "color": "#34d399"},
    {"id": "TA0011", "short": "C2",          "name": "Command and Control",    "color": "#f472b6"},
    {"id": "TA0010", "short": "Exfil",       "name": "Exfiltration",           "color": "#fb923c"},
    {"id": "TA0040", "short": "Impact",      "name": "Impact",                 "color": "#ef4444"},
]


def infer_tactic(technique_id: str) -> tuple[str, str] | None:
    """Return (tactic_id, tactic_name) for a technique ID like 'T1566.001' or 'T1566'.

    Strips any sub-technique suffix and looks up the leading prefix. Falls back to
    Initial Access if the technique is not in our static map.
    """
    if not technique_id:
        return None
    tid = technique_id.strip().upper()
    # Direct lookup (catches subtechniques like T1566.001 if explicitly mapped)
    if tid in TECHNIQUE_TO_TACTIC:
        return TECHNIQUE_TO_TACTIC[tid]
    # Strip sub-technique
    base = tid.split(".")[0]
    if base in TECHNIQUE_TO_TACTIC:
        return TECHNIQUE_TO_TACTIC[base]
    return None


def tactic_index(tactic_id: str) -> int:
    for i, t in enumerate(TACTICS_ORDERED):
        if t["id"] == tactic_id:
            return i
    return -1
