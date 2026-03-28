"""Save test results to file"""
import urllib.request
import json

BASE = "http://localhost:8000"

def api_call(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    req.method = method
    r = urllib.request.urlopen(req)
    return r.status, json.loads(r.read())

results = []

status, data = api_call("GET", "/")
results.append(f"TEST 1 Health: {status} | Agents: {len(data['system']['agents'])} | Chunks: {data['system']['vector_db']['total_chunks']} | Schemes: {data['system']['vector_db']['total_schemes']}")

status, data = api_call("POST", "/chat", {"query": "Schemes for farmers in Tamil Nadu", "profile": {"age": 30, "occupation": "farmer", "state": "Tamil Nadu"}})
results.append(f"TEST 2 Chat-Farmer: {status} | Intent: {data['intent']} | Eligible: {data['eligible_count']}/{data['total_schemes']} | Compliance: {data['compliance_verified']}")
for s in data['schemes']:
    results.append(f"  >> {s['name']} | eligible={s.get('eligible')} | {s.get('eligibility_status','?')}")

status, data = api_call("POST", "/chat", {"query": "Am I eligible for PMAY?", "profile": {"age": 35, "income": 200000}})
results.append(f"TEST 3 PMAY: {status} | Intent: {data['intent']} | Eligible: {data['eligible_count']}/{data['total_schemes']}")
for s in data['schemes']:
    results.append(f"  >> {s['name']} | eligible={s.get('eligible')}")
    for r in s.get('eligibility_reasons', []):
        results.append(f"     {r['status']} {r['criterion']}: {r['detail']}")

status, data = api_call("GET", "/missed?age=30&income=200000&occupation=farmer&state=Tamil+Nadu")
results.append(f"TEST 4 Missed: {status} | Count: {data['count']}")
for s in data.get('missed_schemes', []):
    results.append(f"  >> {s['name']}")

status, data = api_call("GET", "/schemes")
results.append(f"TEST 5 All-Schemes: {status} | Total: {data['total']}")

status, data = api_call("POST", "/chat", {"query": "Tell me about XYZ nonexistent scheme", "profile": {}})
results.append(f"TEST 6 Compliance: {status} | Found: {data['total_schemes']} | Text: {data['text'][:150]}")

status, data = api_call("POST", "/whatsapp", {"text": "I am a 25 year old student from Kerala", "profile": {}})
results.append(f"TEST 7 WhatsApp: {status} | Has response: {bool(data.get('whatsapp_response'))}")

with open("test_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))
print("DONE - see test_output.txt")
