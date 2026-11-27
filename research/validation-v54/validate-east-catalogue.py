"""Check stable identifiers and unaffected territorial records after v54 export."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
out = Path(__file__).resolve().parent
baseline = json.loads((out / "east-integration-baseline.json").read_text())


def digest(value):
    text = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(text.encode()).hexdigest()


guide = json.loads((root / "dist/assets/data/castle-visit.json").read_text())
new_stops = ["almenara-bateria", "almenara-aljibes", "almenara-baluarte", "almenara-dependencias"]
expected_stops = list(baseline["stopIds"])
at = expected_stops.index("almenara") + 1
expected_stops[at:at] = new_stops
assert [stop["id"] for stop in guide["stops"]] == expected_stops, "Castle stop additions/order changed"
assert [region["id"] for region in guide["regions"]] == baseline["regionIds"], "Castle precinct IDs changed"
results = []
for name, previous in baseline["indices"].items():
    current = json.loads((root / "dist/assets/territory" / (name + ".json")).read_text())
    assert sorted(current) == sorted(previous["ids"]), f"Atlas destinations changed in {name}"
    for place, expected in previous["outsideCastleHashes"].items():
        assert digest(current[place]) == expected, f"Unrelated place changed: {name}/{place}"
    if name == "visit-stops":
        record = current["castle"]
        assert [stop["id"] for stop in record["stops"]] == expected_stops
        assert record["regions"] == [{"id": r["id"], "name": r["name"]} for r in guide["regions"]]
        for source, indexed in zip(guide["stops"], record["stops"]):
            assert source["title"] == indexed["title"], f"Stale indexed title: {source['id']}"
            assert source["coordinate"] == indexed["coordinate"], f"Stale indexed coordinates: {source['id']}"
    results.append({"file": name + ".json", "places": len(current), "unchangedOutsideCastle": len(previous["outsideCastleHashes"]), "castleSha256": digest(current["castle"])})

report = {"pass": True, "sourceCommit": baseline["sourceCommit"], "stops": len(guide["stops"]), "regions": len(guide["regions"]), "indices": results}
(out / "east-catalogue-qa.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False, indent=2))
