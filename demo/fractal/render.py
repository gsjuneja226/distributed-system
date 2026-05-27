import os
import json
from PIL import Image

# 1. Read sharding parameters from the easycompute scheduler
chunk = int(os.environ.get("CHUNK_INDEX", 0))
total = int(os.environ.get("CHUNK_TOTAL", 1))

# 2. Configure Canvas Resolution
width, height = 1200, 1200
max_iter = 256

# Calculate vertical slice boundaries for this specific computer
slice_height = height // total
y_start = chunk * slice_height
y_end = (chunk + 1) * slice_height

print(f"--- 🎨 Fractal Painter Node {chunk}/{total} Activated ---")
print(f"🎨 Rendering Rows: {y_start} to {y_end} ({slice_height} horizontal lines)")

# Create an RGB image buffer for this node's slice
img = Image.new("RGB", (width, slice_height))

# Mandelbrot mathematical coordinate boundaries
x_min, x_max = -2.0, 0.5
y_min, y_max = -1.25, 1.25

# 3. Calculate escape velocity for every pixel in this slice
for y_local in range(slice_height):
    y_global = y_start + y_local
    # Map vertical pixel to complex plane
    cy = y_min + (y_global / height) * (y_max - y_min)
    
    for x in range(width):
        # Map horizontal pixel to complex plane
        cx = x_min + (x / width) * (x_max - x_min)
        
        c = complex(cx, cy)
        z = 0j
        n = 0
        # Formula: z = z^2 + c
        while abs(z) <= 2 and n < max_iter:
            z = z*z + c
            n += 1
            
        # Determine color gradient based on iteration counts (escape velocity)
        if n == max_iter:
            color = (0, 0, 0)  # Core fractal set is solid black
        else:
            # Generate a gorgeous neon cosmic fire aesthetic (Red-Orange-Magenta-Blue)
            r = int((n * 9) % 256)
            g = int((n * 3) % 256)
            b = int((n * 6) % 256)
            color = (r, g, b)
            
        img.putpixel((x, y_local), color)

# 4. Save results to the easycompute standard output directory
os.makedirs("/job/output", exist_ok=True)
output_path = f"/job/output/slice_{chunk}.png"
img.save(output_path)

# Write metadata so the central dashboard can track execution details
metadata = {
    "chunk_index": chunk,
    "total_chunks": total,
    "rendered_rows": slice_height,
    "width": width,
    "height": height,
    "status": "complete"
}
with open("/job/output/metrics.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"🎨 SUCCESS: Canvas slice rendered and saved to {output_path}")
