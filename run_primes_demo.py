import os
import time
import json
import requests
import zipfile
from io import BytesIO

# Dynamically resolve server IP
SERVER_IP = "localhost"
if os.path.exists(".env"):
    try:
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    if k.strip() == "SERVER_IP":
                        SERVER_IP = v.strip()
                        break
    except Exception:
        pass

BASE_URL = f"http://{SERVER_IP}:8000"
print(f"Connecting to easycompute Grid at: {BASE_URL}")

def run_primes():
    # 1. Log in as researcher
    print("\n[1/4] Logging in as submitter...")
    resp = requests.post(
        f"{BASE_URL}/auth/mock-login",
        json={"email": "researcher@campus.edu", "role": "submitter"},
        timeout=10
    ).json()
    token = resp["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Submit the custom prime counter job sharding 100,000 numbers into 3 chunks
    print("\n[2/4] Submitting Distributed Prime Counter Job to the grid...")
    payload = {
        "image": "localhost:5000/my-prime-job:latest",
        "cpu": 0.5,
        "memory": "512m",
        "gpu": False,
        "timeout_seconds": 300,
        "split_by": {
            "strategy": "row_range",
            "num_chunks": 3,
            "total_rows": 100000
        }
    }
    
    submit_resp = requests.post(f"{BASE_URL}/jobs", json=payload, headers=headers, timeout=10).json()
    job_id = submit_resp["job_id"]
    print(f"      Job Submitted! Parent Job ID: {job_id}")
    print(f"      Sharding 100,000 numbers across {submit_resp['total_chunks']} chunks in parallel...")

    # 3. Monitor execution and stream live worker logs
    print("\n[3/4] Monitoring live grid execution...")
    completed = False
    seen_logs = set()
    while not completed:
        status_resp = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=headers, timeout=5).json()
        status = status_resp["status"]
        chunks = status_resp.get("chunks", [])
        
        print(f"      Parent Status: {status.upper()}")
        for chunk in chunks:
            node = f"on node {chunk['node_id'][:8]}" if chunk['node_id'] else "waiting for node"
            print(f"        * Chunk {chunk['chunk_index']}: {chunk['status'].upper()} ({node})")
            
        # Get child logs
        child_ids = []
        try:
            import psycopg2
            db_host = "localhost" if SERVER_IP == "localhost" else SERVER_IP
            conn = psycopg2.connect(f"postgresql://admin:secret@{db_host}:5432/easycompute")
            cur = conn.cursor()
            cur.execute("SELECT id, chunk_index FROM jobs WHERE parent_id=%s", (job_id,))
            child_ids = cur.fetchall()
            cur.close()
            conn.close()
        except Exception:
            pass

        for cid, cidx in child_ids:
            resp_logs = requests.get(f"{BASE_URL}/jobs/{cid}/logs", headers=headers, timeout=5)
            if resp_logs.status_code == 200:
                lines = resp_logs.json().get("lines", [])
                for line in lines:
                    log_key = f"{cid}:{line}"
                    if log_key not in seen_logs:
                        print(f"        [Chunk {cidx} Log] {line}")
                        seen_logs.add(log_key)
                        
        if status in ("done", "failed", "expired"):
            completed = True
            break
        time.sleep(2)

    if status != "done":
        print(f"\n✖ Job completed with status: {status.upper()}")
        return

    # 4. Download and extract final merged result
    print("\n[4/4] Downloading consolidated prime count results...")
    results_dir = "./results_primes"
    os.makedirs(results_dir, exist_ok=True)
    
    download_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/results", headers=headers, timeout=20)
    zip_data = BytesIO(download_resp.content)
    
    with zipfile.ZipFile(zip_data) as z:
        z.extractall(path=results_dir)
        print(f"      Successfully extracted results to: {results_dir}")
        print("\n🏆 --- PRIMES GRID RESULTS SUMMARY ---")
        for fname in os.listdir(results_dir):
            if fname.endswith("metrics.json"):
                with open(os.path.join(results_dir, fname), "r") as f:
                    metrics = json.load(f)
                print(f"  Chunk {metrics.get('chunk_index', 0)} ({metrics.get('start_range')} - {metrics.get('end_range')}):")
                print(f"    - Primes Count: {metrics.get('primes_count')}")
        print("--------------------------------------")

if __name__ == "__main__":
    run_primes()
