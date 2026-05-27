import os
import sys
import time
import json
import subprocess
import shutil

# Console Coloring Utilities
def print_title(text):
    print("\n\033[95m" + "=" * 60)
    print(f"🌌 {text:^56} 🌌")
    print("=" * 60 + "\033[0m")

def print_header(text):
    print(f"\n\033[96m▶ {text}\033[0m")

def print_success(text):
    print(f"\033[92m✔ {text}\033[0m")

def print_warning(text):
    print(f"\033[93m⚠ {text}\033[0m")

def print_error(text):
    print(f"\033[91m✖ {text}\033[0m")

def print_bullet(text):
    print(f"  ▪ {text}")

# Dynamically resolve server IP from main .env
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

def load_env(env_file):
    env = {}
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env

def save_to_env(env_file, key, value):
    lines = []
    found = False
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if line.strip().startswith(f"{key}="):
                    lines.append(f"{key}={value}\n")
                    found = True
                else:
                    lines.append(line)
    if not found:
        lines.append(f"{key}={value}\n")
    with open(env_file, "w") as f:
        f.writelines(lines)

def sync_server_ip():
    global SERVER_IP
    detected_ip = "localhost"
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Connect to a public DNS address to discover the active default gateway IP
        s.connect(("8.8.8.8", 80))
        detected_ip = s.getsockname()[0]
    except Exception:
        try:
            detected_ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            detected_ip = "localhost"
    finally:
        s.close()
        
    if detected_ip in ("127.0.0.1", "localhost"):
        # No active LAN network connection, default to localhost or configured IP
        return
        
    configured_ip = ""
    if os.path.exists(".env"):
        env = load_env(".env")
        configured_ip = env.get("SERVER_IP", "")
        
    if configured_ip != detected_ip:
        print_warning(f"IP Mismatch Detected! Current network IP is {detected_ip}, but configured IP was '{configured_ip}'.")
        print_header("Synchronizing configuration files to use active IP...")
        
        # 1. Update main .env
        save_to_env(".env", "SERVER_IP", detected_ip)
        save_to_env(".env", "CORS_ORIGINS", f"http://localhost:3000,http://{detected_ip}:3000")
        save_to_env(".env", "SCHEDULER_URL", f"http://{detected_ip}:8000")
        save_to_env(".env", "DOCKER_REGISTRY", f"{detected_ip}:5000")
        save_to_env(".env", "VITE_API_URL", f"http://{detected_ip}:8000")
        save_to_env(".env", "VITE_WS_URL", f"ws://{detected_ip}:8000")
        
        # 2. Update agent/.env
        agent_env = os.path.join("agent", ".env")
        if os.path.exists(agent_env):
            save_to_env(agent_env, "SERVER_IP", detected_ip)
            save_to_env(agent_env, "SCHEDULER_URL", f"http://{detected_ip}:8000")
            save_to_env(agent_env, "REDIS_URL", f"redis://{detected_ip}:6380/0")
            save_to_env(agent_env, "DOCKER_REGISTRY", f"{detected_ip}:5000")
            save_to_env(agent_env, "CORS_ORIGINS", f"http://localhost:3000,http://{detected_ip}")
            
        SERVER_IP = detected_ip
        print_success(f"Configurations synchronized with your active network IP: {detected_ip}!")
        print_bullet("Important: Re-run Option 1 to rebuild the cluster with the updated IP!")

def check_docker():
    print_header("Checking Docker Environment...")
    try:
        subprocess.run(["docker", "info"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print_success("Docker is running successfully!")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("Docker is NOT running or not installed. Please open Docker Desktop first!")
        return False

def get_compose_command():
    try:
        subprocess.run(["docker", "compose", "version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return ["docker", "compose"]
    except (subprocess.CalledProcessError, FileNotFoundError):
        try:
            subprocess.run(["docker-compose", "version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return ["docker-compose"]
        except (subprocess.CalledProcessError, FileNotFoundError):
            return None

def start_cluster():
    if not check_docker():
        return False
    
    compose_cmd = get_compose_command()
    if not compose_cmd:
        print_error("Could not find 'docker compose' or 'docker-compose' command.")
        return False
    
    print_header("Launching Campus Grid Infrastructure (building static assets)...")
    try:
        # Use --build to force rebuild of compiled frontend assets if IP changed
        subprocess.run(compose_cmd + ["up", "-d", "--build"], check=True)
        print_success("Containers started and built successfully!")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to bring up docker containers: {e}")
        return False
    
    print_header("Waiting for Central Scheduler API to become healthy...")
    backend_url = f"http://{SERVER_IP}:8000/health"
    print_bullet(f"Polling backend: {backend_url}")
    
    max_retries = 15
    import urllib.request
    for i in range(max_retries):
        try:
            with urllib.request.urlopen(backend_url, timeout=2) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    if data.get("status") == "ok":
                        print_success("Central Scheduler is online and healthy! 🎉")
                        return True
        except Exception:
            pass
        print_bullet(f"Backend not ready yet. Retrying in 2 seconds... ({i+1}/{max_retries})")
        time.sleep(2)
        
    print_error("Scheduler API failed to start within the timeout period.")
    return False

def build_and_push_demo_images():
    print_header("Building and Registering Demo Computational Packages...")
    registry = "localhost:5000"
    
    # CSV Job
    print_bullet("Building CSV processing job...")
    csv_image = f"{registry}/easycompute-csv-job:latest"
    try:
        subprocess.run(["docker", "build", "-t", csv_image, "./demo/csv"], check=True)
        print_success("CSV image built successfully!")
        
        print_bullet("Pushing CSV image to local container registry...")
        subprocess.run(["docker", "push", csv_image], check=True)
        print_success("CSV image published to grid registry!")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to package CSV job: {e}")
        return False
        
    # Fractal Job
    print_bullet("Building Cosmic Fractal Mandelbrot job...")
    fractal_image = f"{registry}/easycompute-fractal-job:latest"
    try:
        subprocess.run(["docker", "build", "-t", fractal_image, "./demo/fractal"], check=True)
        print_success("Fractal image built successfully!")
        
        print_bullet("Pushing Fractal image to local container registry...")
        subprocess.run(["docker", "push", fractal_image], check=True)
        print_success("Fractal image published to grid registry!")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to package Fractal job: {e}")
        return False
        
    print_success("All compute job packages successfully distributed to local registry!")
    return True

def auto_provision_and_launch_agent():
    print_header("Provisioning Node Agent Credentials...")
    
    login_url = f"http://{SERVER_IP}:8000/auth/mock-login"
    import urllib.request
    try:
        req = urllib.request.Request(
            login_url,
            data=json.dumps({"email": "contributor@campus.edu", "role": "contributor"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                res_data = json.loads(response.read().decode())
                jwt_token = res_data["access_token"]
                print_success("JIT Contributor token provisioned successfully!")
            else:
                raise RuntimeError("Failed to fetch mock login token")
    except Exception as e:
        print_error(f"Error provisioning contributor token from backend: {e}")
        print_warning("Make sure the cluster is running (Option 1).")
        return False
        
    agent_env = os.path.join("agent", ".env")
    if not os.path.exists(agent_env):
        if os.path.exists(os.path.join("agent", ".env.example")):
            shutil.copy2(os.path.join("agent", ".env.example"), agent_env)
            print_bullet("Created agent/.env from template.")
        else:
            with open(agent_env, "w") as f:
                f.write("# easycompute Agent Env\n")
                
    save_to_env(agent_env, "USER_TOKEN", jwt_token)
    save_to_env(agent_env, "SCHEDULER_URL", f"http://{SERVER_IP}:8000")
    save_to_env(agent_env, "REDIS_URL", f"redis://{SERVER_IP}:6380/0")
    save_to_env(agent_env, "DOCKER_REGISTRY", f"{SERVER_IP}:5000")
    save_to_env(agent_env, "NODE_ID", "")
    save_to_env(agent_env, "NODE_TOKEN", "")
    
    print_success("Agent configuration synced with main cluster!")

    venv_dir = os.path.join("agent", "venv")
    pip_path = os.path.join(venv_dir, "Scripts", "pip.exe") if os.name == 'nt' else os.path.join(venv_dir, "bin", "pip")
    python_path = os.path.join(venv_dir, "Scripts", "python.exe") if os.name == 'nt' else os.path.join(venv_dir, "bin", "python")
    
    if not os.path.exists(venv_dir):
        print_bullet("Virtual environment not found. Initializing Python virtual env...")
        try:
            subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
            print_success("Virtual env created.")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to create virtual environment: {e}")
            return False
            
    print_bullet("Installing/Verifying Agent dependencies...")
    try:
        subprocess.run([pip_path, "install", "-r", os.path.join("agent", "requirements.txt"), "--quiet"], check=True)
        print_success("Dependencies up-to-date!")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install dependencies: {e}")
        return False

    print_header("Spawning Worker Agent Daemon...")
    if os.name == 'nt':
        powershell_cmd = f"Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd agent; .\\venv\\Scripts\\python.exe agent.py'"
        try:
            subprocess.Popen(["powershell.exe", "-Command", powershell_cmd])
            print_success("Worker Node Agent launched in a separate window! Keep it running.")
            print_bullet("Watch the separate window to see registration and job telemetry.")
        except Exception as e:
            print_error(f"Failed to spawn separate powershell terminal: {e}")
            print_warning("Running inline instead...")
            subprocess.Popen([python_path, os.path.join("agent", "agent.py")])
    else:
        subprocess.Popen([python_path, os.path.join("agent", "agent.py")])
        print_success("Worker Node Agent launched in background daemon mode!")
        
    return True

def run_demo(job_type):
    print_header(f"Triggering {job_type.upper()} Job Dispatch Pipeline...")
    demo_script = "run_demo.py"
    try:
        subprocess.run([sys.executable, demo_script, "--job", job_type], check=True)
        print_success(f"Demo {job_type.upper()} Job finished successfully!")
    except subprocess.CalledProcessError:
        print_error(f"Demo {job_type.upper()} Job run encountered errors.")

def stop_and_cleanup():
    compose_cmd = get_compose_command()
    if not compose_cmd:
        print_error("Could not find 'docker compose' or 'docker-compose' command.")
        return
        
    print_header("Shutting down easycompute Grid Cluster...")
    try:
        subprocess.run(compose_cmd + ["down", "-v"], check=True)
        print_success("Grid components stopped and volumes pruned.")
    except subprocess.CalledProcessError as e:
        print_error(f"Docker compose down failed: {e}")
        
    if os.path.exists("results_demo"):
        try:
            shutil.rmtree("results_demo")
            print_success("Cleaned temporary results folder.")
        except Exception:
            pass

def interactive_menu():
    if os.name == 'nt':
        os.system('color')
        
    # Run automatic IP sync at startup to catch local network changes
    sync_server_ip()
        
    while True:
        print_title("easycompute Grid Orchestrator")
        print("\033[93mCurrent Server Address: \033[92m" + SERVER_IP + "\033[0m")
        print("\n  \033[96m1.\033[0m 🚀 \033[1mFull Cluster Setup\033[0m (Compose Up + Rebuild + Publish Demo Images)")
        print("  \033[96m2.\033[0m 💻 \033[1mStart Worker Agent\033[0m (Auto-provision JWT Token + Launch Node Daemon)")
        print("  \033[96m3.\033[0m 📊 \033[1mRun CSV Data Processing Demo\033[0m (Distribute 2000 rows across grid)")
        print("  \033[96m4.\033[0m 🎨 \033[1mRun Cosmic Fractal Mandelbrot Demo\033[0m (Stitch parallel slices into a PNG!)")
        print("  \033[96m5.\033[0m 🛑 \033[1mShutdown & Clean Grid Cluster\033[0m")
        print("  \033[96m6.\033[0m 🚪 \033[1mExit\033[0m")
        
        try:
            choice = input("\nSelect an option (1-6): ").strip()
        except KeyboardInterrupt:
            print("\n")
            break
            
        if choice == "1":
            if start_cluster():
                build_and_push_demo_images()
        elif choice == "2":
            auto_provision_and_launch_agent()
        elif choice == "3":
            run_demo("csv")
        elif choice == "4":
            run_demo("fractal")
        elif choice == "5":
            stop_and_cleanup()
        elif choice == "6":
            print_success("Thank you for computing with easycompute! Keep styling the future. 🌌")
            break
        else:
            print_error("Invalid selection. Please choose a number between 1 and 6.")
            
        time.sleep(1)

if __name__ == "__main__":
    interactive_menu()
