# 🌌 The Friendly Guide to easycompute

Welcome! If you are new to computers or have never coded before, **do not worry!** This guide is written especially for you. We will explain how this amazing system works using a simple real-world analogy and show you step-by-step how to run it on **3 computers** at home or in a lab.

---

## 🍞 The Great Cupcake Bakery Analogy

Imagine you want to start a bakery. A researcher comes to you with a massive order: they need **1,200 beautiful, hand-painted cupcakes** for a festival (this represents a heavy computational job, like rendering a massive fractal image). 

If you try to bake all 1,200 cupcakes alone, your oven will overheat, and it will take you days.

This is where **easycompute** comes in! It turns your friends' laptops into a **baking club**:

```
                  ┌───────────────────────┐
                  │      HEAD CHEF        │
                  │ (Computer 1 - Server) │
                  └───────────┬───────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
     ┌───────────────────┐         ┌───────────────────┐
     │ HELPER KITCHEN A  │         │ HELPER KITCHEN B  │
     │ (Computer 2 - Node)│        │ (Computer 3 - Node)│
     └───────────────────┘         └───────────────────┘
```

1. **The Head Chef (Computer 1 - Server):** This is the main kitchen. It receives the order, divides the ingredients into recipes, packs them into clean boxes, and waits for volunteers.
2. **The Helper Kitchens (Computers 2 & 3 - Node Agents):** These are your friends' kitchens. They connect to the Head Chef and say, *"Hey, my oven is empty right now, give me some baking work!"*
3. **The Dispatcher:** The Head Chef splits the 1,200 cupcake order into 3 equal batches of 400 cupcakes. It hands one batch box (Docker container) to Computer 2 and another to Computer 3, keeping one for themselves or distributing them automatically.
4. **Baking and Delivery:** Computers 2 and 3 bake their batches in their own ovens. Once finished, they package their cupcakes and ship them back to the Head Chef, who merges all the batches into one massive, gorgeous display and delivers it to the customer!

---

## 🛠️ Step 1: Getting Ready (Prerequisites)

Before starting, make sure all **3 computers** have these two helper tools installed:
1. **Python:** The basic language the programs speak. Download and install it from [python.org](https://www.python.org/downloads/) (Make sure to check the box that says **"Add Python to PATH"** during installation!).
2. **Docker Desktop:** The baking box provider. Download and install it from [docker.com](https://www.docker.com/products/docker-desktop/). Open Docker Desktop and leave it running in the background.

*All 3 computers must be connected to the **same Wi-Fi network** (so they can speak to each other).*

---

## 🚀 Running on a Single Computer (Quick Test)

To test the system on just **1 computer** first, it is incredibly easy:
1. Open a command terminal (Search for **PowerShell** on Windows).
2. Navigate to the folder (e.g., `cd "D:\distributed system\easy-compute"`).
3. Run the magical control center:
   ```powershell
   python easy.py
   ```
4. Choose **Option 1** (`Full Cluster Setup`) to start the Head Chef's bakery.
5. Choose **Option 2** (`Start Worker Agent`) to register your laptop as a Helper Kitchen (a separate window will open!).
6. Choose **Option 4** (`Run Cosmic Fractal Mandelbrot Demo`) and watch your laptop process the math and stitch a beautiful Mandelbrot image!

---

## 🌐 Running on 3 Computers (The Campus/Home Grid)

Let's build a real distributed grid! We will use **Computer 1** as the Boss (Head Chef) and **Computers 2 & 3** as the Helpers.

### Step A: Find the "Home Address" of Computer 1

To let other computers connect to Computer 1, we must find its network address (called an **IP Address**):

*   **On Computer 1 (Windows):**
    1. Click the Windows Start Menu, type `cmd`, and press Enter.
    2. Type `ipconfig` and press Enter.
    3. Look for a line that says **IPv4 Address** (it will look like `192.168.1.15` or `172.22.208.1`). Write this number down! Let's call it your **IP Address**.

---

### Step B: Sync the Address in Configuration Files

We must tell all programs where to find the Head Chef.

1. **On Computer 1:**
   Open the file named `.env` in the main folder (`easy-compute/.env`) and update the `SERVER_IP` line with your address:
   ```env
   SERVER_IP=192.168.1.15
   ```
   *(Replace `192.168.1.15` with Computer 1's actual IP address you wrote down).*

2. **On Computer 2 and Computer 3 (The Helpers):**
   Copy the `easy-compute` folder onto Computers 2 and 3. Open the file named `.env` in their main folder, and also set the `SERVER_IP` line to Computer 1's IP address:
   ```env
   SERVER_IP=192.168.1.15
   ```

---

### Step C: Fire Up the Baking Grid!

Now we are ready to start! Follow these simple steps in order:

#### 1. Start the Head Chef (Computer 1)
On **Computer 1**, open PowerShell, navigate to the folder, and run:
```powershell
python easy.py
```
Select **Option 1** (`Full Cluster Setup`). This starts all the servers and compiles the cupcake boxes. Wait for the green success message!

#### 2. Start the Helper Kitchens (Computers 2 & 3)
On **Computer 2** and **Computer 3**, open PowerShell, navigate to their folders, and run:
```powershell
python easy.py
```
Select **Option 2** (`Start Worker Agent`). 
*   **What happens?** The script automatically connects to Computer 1, registers Computer 2/3 as active volunteer kitchens, and opens a separate window showing a heartbeat message: `"Waiting for jobs on node:...:queue"`. Your grid is now alive!

#### 3. Dispatch the Job (Computer 1)
Go back to **Computer 1**, look at your menu, and select **Option 4** (`Run Cosmic Fractal Mandelbrot Demo`).
*   **The Magic:** The Head Chef splits the fractal rendering task into **3 vertical canvas slices**. 
*   It automatically dispatches one slice to Computer 1, one slice to Computer 2, and one slice to Computer 3.
*   Watch the terminals on Computers 2 and 3! You will see them start processing their slice and stream logs back to Computer 1 in real-time.
*   Once all 3 computers finish baking their slices, the Head Chef automatically downloads all three `.png` image slices, installs Pillow, and stitches them vertically into a single gorgeous, high-resolution master painting: `fractal_masterpiece_[id].png` located inside the `results_demo` folder!

---

## 🧹 Cleaning Up

When you are done playing, go to Computer 1, and in the `easy.py` menu, select **Option 5** (`Shutdown & Clean Grid Cluster`). This stops all background servers and cleans up any temporary disk storage.

Congratulations! You have just successfully built and operated your very first **mini-supercomputer grid!** 🌌🚀
