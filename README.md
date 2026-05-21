# 🌌 easycompute

> **Building a supercomputer out of idle distributed hardware.**

easycompute is a high-performance distributed computing platform designed to harness the collective idle power of students' laptops across a university campus. It allows researchers and students to submit heavy computational workloads (Python jobs, ML training, data processing) packaged as **Docker containers**, which are then intelligently dispatched to available laptops (nodes) in the network.

---

## 📋 Table of Contents

- [Development Philosophy](#-development-philosophy)
- [Technology Stack](#-technology-stack)
- [For Students: Creating a Job](#-for-students-creating-a-job)
  - [Create your Compute Job](#1-create-your-compute-job)
  - [Package with Docker](#2-package-with-docker)
  - [Deploy to Grid](#3-deploy-to-grid)
- [For Contributors: Connect your Node](#-for-contributors-connect-your-node)
  - [Prerequisites](#prerequisites)
  - [Setup Instructions](#setup-instructions)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🚀 Development Philosophy

The development of easycompute was driven by a single problem: **expensive cloud compute vs. wasted local hardware.** While students have powerful GPUs and multi-core CPUs in their backpacks, they rarely use them at 100% capacity. easycompute bridges this gap by providing:

- **Zero-Trust Isolation**: Jobs run in secure Docker sandboxes with no access to the host filesystem.
- **Resilient Scheduling**: A custom "Round-Robin with Penalty" load balancer ensures jobs are spread across the grid even if one node is significantly more powerful.
- **Real-Time Telemetry**: Live log streaming and resource monitoring (CPU/RAM/GPU) for every dispatched chunk.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Core API** | FastAPI (Python) — High performance, asynchronous orchestration |
| **Frontend** | React 18 + Vite + Tailwind CSS — A premium, dark-mode dashboard |
| **Message Broker** | Upstash Redis — Handles job dispatch queues and real-time log tailing |
| **Persistence** | PostgreSQL (Neon.tech) — Stores job states, node telemetry, and user data |
| **Node Agent** | Python daemon + Docker SDK + psutil — Monitors host health and manages container lifecycles |

---

## 🎓 For Students: Creating a Job

Researchers and students can submit jobs to the grid by packaging them as Docker images.

### 1. Create your Compute Job

Write your Python script and a `Dockerfile`.

```python
# example_job.py
import os
import pandas as pd

# Load your data and process it
df = pd.read_csv("data.csv")
result = df.describe()

# Save result to /output - easycompute will automatically collect this!
os.makedirs("/output", exist_ok=True)
result.to_csv("/output/results.csv")
```

### 2. Package with Docker

> **📦 Pre-built Example Images**
>
> To get started quickly, you can reference or pull the following pre-built easycompute job images:
>
> | Image | Description |
> |---|---|
> | `madhavkochhar/easycompute-csv-job:latest` | Simple data manipulation and statistics |
> | `madhavkochhar/easycompute-sklearn-job:latest` | Classic Machine Learning classification |
> | `madhavkochhar/easycompute-pytorch-job:latest` | Heavy-duty Deep Learning and GPU testing |

Build and push your own image to a registry (like Docker Hub):

```bash
# Build
docker build -t your-username/easycompute-job:v1 .

# Push
docker push your-username/easycompute-job:v1
```

### 3. Deploy to Grid

1. Navigate to the **Submit Job** tab in the Dashboard.
2. Enter your Image Name (`your-username/easycompute-job:v1`).
3. Set your **Distributed Splitting** value (e.g., "2 Chunks") to run your job in parallel across 2 laptops!
4. Hit **Submit** and watch the grid take over.

---

## 💻 For Contributors: Connect your Node

Contribute your idle CPU/GPU and earn power credits while supporting campus research.

### Prerequisites

- **Python 3.10+** installed.
- **Docker Desktop** running and active.
- **User Token**: Copy your unique token from the "Contribute" page on the dashboard.

### Setup Instructions

**1. Clone the Agent Code:**
```bash
git clone https://github.com/Madhav-Kochhar7/easycompute.git
cd easycompute/agent
```

**2. Get JWT Token:**

Open the deployed software through the following link and copy your private JWT token from the **Contribute Node** page on the dashboard.
```env
https://campus-grid.netlify.app/
```

**3. Initialize Environment:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**4. Configure Connection:**

Create a `.env` file in the `agent/` folder:
```env
SCHEDULER_URL=https://easycompute-api.onrender.com
USER_TOKEN=YOUR_PRIVATE_JWT_HERE
```
> Your token can be copied from the **Contribute Node** page on the dashboard.

**4. Start the Agent:**
```powershell
py agent.py
```

Your laptop will now appear as **"Online"** in the Global Node Pool and start receiving job chunks!

---

## 🔮 Future Enhancements

> [!IMPORTANT]
> The following features are currently on the roadmap for the Next Major Release.

### 🛡️ Verified Academic Authentication

We plan to implement **SSO / Microsoft Graph integration** that restricts account creation to valid university email domains (e.g., `@university.edu`). This ensures the grid remains a private, academic resource.

### 💳 Merit-Based Payment Gateway

To incentivize high-uptime contributors, we are developing a **Payment Integrity Layer**.

- **Earn Credits**: Contributors get value based on CPU-seconds and RAM-hours provided.
- **Payouts**: Integration with Stripe/Razorpay to allow researchers to "rent" the grid, with proceeds distributed back to student contributors.

---

## 📜 License

Developed by the easycompute team. Distributed under the **MIT License**.
