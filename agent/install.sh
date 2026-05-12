# CampusGrid
# -------------------------------
#!/bin/bash
# CampusGrid Node Agent Installer
# -------------------------------
# This script automates the installation of the CampusGrid node agent on Linux systems.
# It checks for Docker, installs Python dependencies, downloads the agent source 
# code, configures environment variables, and (optionally) sets up a systemd service.

set -e

echo "========================================="
echo "  CampusGrid Node Agent Installer"
echo "========================================="

# --- Step 1: Docker Installation ---
# The agent requires Docker to run sandboxed jobs.
if ! command -v docker &>/dev/null; then
  echo "[install] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "[install] Docker installed."
fi

# --- Step 2: Python Dependencies ---
# Install core libraries required by the agent script.
echo "[install] Installing Python dependencies..."
pip3 install requests psutil docker redis python-dotenv --quiet

# --- Step 3: Agent Source Code ---
# Download the latest version of the agent files from the repository.
echo "[install] Downloading agent..."
mkdir -p ~/campusgrid-agent

BASE_URL="https://raw.githubusercontent.com/your-org/campusgrid/main/agent"
for f in agent.py docker_runner.py heartbeat.py result_collector.py gpu_detect.py config.py; do
  curl -fsSL "$BASE_URL/$f" -o ~/campusgrid-agent/$f
  echo "  Downloaded $f"
done

# --- Step 4: Configuration ---
# Prompt the user for the scheduler URL and their personal access token.
# These are stored in a .env file for the agent to use.
read -p "Enter scheduler URL [https://campusgrid.onrender.com]: " SCHED
SCHED=${SCHED:-https://campusgrid.onrender.com}
read -p "Enter your access token (from the dashboard): " TOKEN

cat > ~/campusgrid-agent/.env <<EOF
SCHEDULER_URL=${SCHED}
USER_TOKEN=${TOKEN}
NODE_ID=
NODE_TOKEN=
REDIS_URL=redis://localhost:6379/0
EOF

echo "[install] Configuration saved."

# --- Step 5: Persistence (systemd) ---
# If the system supports systemd, create a service to keep the agent 
# running in the background and restart it on failure.
if command -v systemctl &>/dev/null; then
  sudo tee /etc/systemd/system/campusgrid.service > /dev/null <<EOF
[Unit]
Description=CampusGrid Node Agent
After=network.target docker.service
Requires=docker.service

[Service]
ExecStart=/usr/bin/python3 /root/campusgrid-agent/agent.py
WorkingDirectory=/root/campusgrid-agent
EnvironmentFile=/root/campusgrid-agent/.env
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable campusgrid
  sudo systemctl start campusgrid
  echo ""
  echo "[install] Agent installed and running as systemd service."
  echo "  Check status: sudo systemctl status campusgrid"
  echo "  View logs:    sudo journalctl -u campusgrid -f"
else
  # Fallback for systems without systemd
  echo ""
  echo "[install] Done! Start the agent with:"
  echo "  cd ~/campusgrid-agent && python3 agent.py"
fi
