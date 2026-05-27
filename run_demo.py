import os
import time
import json
import requests
import zipfile
import re
from io import BytesIO

# Dynamically resolve server address from .env if running on a grid
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
print(f"[demo] Using easycompute scheduler URL: {BASE_URL}")

def get_auth_token():
    print("[1/5] Logging in as researcher/submitter...")
    resp = requests.post(
        f"{BASE_URL}/auth/mock-login",
        json={"email": "researcher@campus.edu", "role": "submitter"},
        timeout=10
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Login failed: {resp.text}")
    data = resp.json()
    token = data["access_token"]
    print(f"      Success! User: {data['user']['email']} | Role: {data['user']['role']}")
    return token

def submit_job(token, job_type="csv"):
    print(f"\n[2/5] Submitting {job_type.upper()} Job to grid...")
    headers = {"Authorization": f"Bearer {token}"}
    
    if job_type == "csv":
        payload = {
            "image": "localhost:5000/easycompute-csv-job:latest",
            "cpu": 0.5,
            "memory": "512m",
            "gpu": False,
            "timeout_seconds": 300,
            "split_by": {
                "strategy": "row_range",
                "num_chunks": 2,
                "total_rows": 2000
            }
        }
    else:  # fractal
        payload = {
            "image": "localhost:5000/easycompute-fractal-job:latest",
            "cpu": 0.5,
            "memory": "512m",
            "gpu": False,
            "timeout_seconds": 300,
            "split_by": {
                "strategy": "row_range",  # Mandlebrot rows split
                "num_chunks": 3,
                "total_rows": 1200
            }
        }
    
    resp = requests.post(f"{BASE_URL}/jobs", json=payload, headers=headers, timeout=10)
    if resp.status_code != 200:
        raise RuntimeError(f"Submission failed: {resp.text}")
    
    data = resp.json()
    job_id = data["job_id"]
    print(f"      Job Submitted Successfully!")
    print(f"      Parent Job ID: {job_id}")
    print(f"      Split into {data['total_chunks']} parallel chunks")
    return job_id

def monitor_job(token, job_id):
    print("\n[3/5] Monitoring job and streaming logs in real time...")
    headers = {"Authorization": f"Bearer {token}"}
    
    seen_logs = set()
    completed = False
    
    while not completed:
        resp = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=headers, timeout=5)
        if resp.status_code != 200:
            print(f"Failed to fetch status: {resp.text}")
            time.sleep(2)
            continue
            
        job_details = resp.json()
        status = job_details.get("status")
        chunks = job_details.get("chunks", [])
        
        print(f"\n      --- Status Update (Job: {job_id[:8]}) ---")
        print(f"      Parent Status: {status.upper()}")
        for chunk in chunks:
            node_str = f"on node {chunk['node_id'][:8]}" if chunk['node_id'] else "waiting for node"
            print(f"        * Chunk {chunk['chunk_index']}: {chunk['status'].upper()} ({node_str})")
            
        # Try fetching child logs from DB
        child_ids = []
        try:
            import psycopg2
            # Connect using dynamic SERVER_IP
            db_host = "localhost" if SERVER_IP == "localhost" else SERVER_IP
            conn = psycopg2.connect(f"postgresql://admin:secret@{db_host}:5432/easycompute")
            cur = conn.cursor()
            cur.execute("SELECT id, chunk_index FROM jobs WHERE parent_id=%s", (job_id,))
            child_ids = cur.fetchall()
            cur.close()
            conn.close()
        except Exception:
            pass

        # Print new logs for each child job
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
            print(f"\n      Job completed with status: {status.upper()}")
            break
            
        time.sleep(2)
        
    return status == "done"

def stitch_fractal_slices(results_dir, job_id):
    try:
        from PIL import Image
    except ImportError:
        print("Installing Pillow to stitch fractal image slices...")
        import subprocess
        subprocess.check_call(["pip", "install", "Pillow", "--quiet"])
        from PIL import Image
        
    print("Stitching fractal slices into a unified masterpiece...")
    slice_files = []
    
    # Scan the extracted directory for image files prefixed by chunk index
    for fname in os.listdir(results_dir):
        # Match chunk index prefix and filename e.g. 0_slice_0.png
        m = re.match(r"(\d+)_slice_\1\.png", fname)
        if m:
            chunk_idx = int(m.group(1))
            slice_files.append((chunk_idx, os.path.join(results_dir, fname)))
        else:
            # Fallback match: slice_x.png
            m2 = re.search(r"slice_(\d+)", fname)
            if m2:
                chunk_idx = int(m2.group(1))
                slice_files.append((chunk_idx, os.path.join(results_dir, fname)))
                
    # Deduplicate slices
    seen = set()
    deduped_slices = []
    for idx, path in slice_files:
        if idx not in seen:
            seen.add(idx)
            deduped_slices.append((idx, path))
            
    deduped_slices.sort(key=lambda x: x[0])
    
    if not deduped_slices:
        print("      No fractal slices found to stitch. Check if the worker agents completed their job.")
        return
        
    # Open images and build composite
    images = []
    for idx, path in deduped_slices:
        try:
            images.append(Image.open(path))
            print(f"      Loaded slice {idx} from {os.path.basename(path)}")
        except Exception as e:
            print(f"      Error loading slice {idx}: {e}")
            
    if not images:
        return
        
    widths, heights = zip(*(img.size for img in images))
    total_width = max(widths)
    total_height = sum(heights)
    
    new_im = Image.new('RGB', (total_width, total_height))
    
    y_offset = 0
    for img in images:
        new_im.paste(img, (0, y_offset))
        y_offset += img.size[1]
        
    output_image_path = os.path.join(results_dir, f"fractal_masterpiece_{job_id[:8]}.png")
    new_im.save(output_image_path)
    print(f"\n🌌 [SUCCESS] Stitched {len(images)} slices successfully!")
    print(f"💾 Masterpiece saved to: {os.path.abspath(output_image_path)}")

def download_and_extract_results(token, job_id, job_type="csv"):
    print(f"\n[4/5] Downloading consolidated results for job {job_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.get(f"{BASE_URL}/jobs/{job_id}/results", headers=headers, timeout=20)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to download results: {resp.status_code} {resp.text}")
        
    print("[5/5] Extracting and parsing metrics...")
    zip_data = BytesIO(resp.content)
    
    results_dir = "./results_demo"
    os.makedirs(results_dir, exist_ok=True)
    zip_path = os.path.join(results_dir, f"results_{job_id[:8]}.zip")
    with open(zip_path, "wb") as f:
        f.write(resp.content)
    print(f"      Saved zip file to: {zip_path}")
    
    with zipfile.ZipFile(zip_data) as z:
        z.extractall(path=results_dir)
        print(f"      Extracted files to: {results_dir}")
        
        print("\n--- RESULTS ANALYSIS SUMMARY ---")
        for name in z.namelist():
            print(f"File found in ZIP: {name}")
            if name.endswith("metrics.json"):
                try:
                    filepath = os.path.join(results_dir, name)
                    with open(filepath, "r") as f:
                        metrics = json.load(f)
                    print(f"\n  Metrics for chunk {metrics.get('chunk_index', 0)}:")
                    if "rows_processed" in metrics:
                        print(f"    - Rows Processed: {metrics.get('rows_processed')}")
                        print(f"    - Value Mean:     {metrics.get('mean'):.4f}")
                        print(f"    - Value Std:      {metrics.get('std'):.4f}")
                        print(f"    - Value Min:      {metrics.get('min'):.4f}")
                        print(f"    - Value Max:      {metrics.get('max'):.4f}")
                    elif "rendered_rows" in metrics:
                        print(f"    - Rendered Rows:  {metrics.get('rendered_rows')}")
                        print(f"    - Dimensions:     {metrics.get('width')}x{metrics.get('height')}")
                        print(f"    - Status:         {metrics.get('status')}")
                except Exception as e:
                    print(f"  Error reading {name}: {e}")
        print("---------------------------------")
        
        if job_type == "fractal":
            try:
                stitch_fractal_slices(results_dir, job_id)
            except Exception as e:
                print(f"Failed to stitch fractal: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="easycompute Job Submitter Demo")
    parser.add_argument(
        "--job",
        choices=["csv", "fractal"],
        default="csv",
        help="Type of demo job to run (default: csv)"
    )
    args = parser.parse_args()
    
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary for database integration...")
        import subprocess
        subprocess.check_call(["pip", "install", "psycopg2-binary", "--quiet"])
        
    try:
        token = get_auth_token()
        job_id = submit_job(token, job_type=args.job)
        success = monitor_job(token, job_id)
        if success:
            download_and_extract_results(token, job_id, job_type=args.job)
        else:
            print("Job failed or expired.")
    except Exception as e:
        print(f"\nError occurred: {e}")
