import os
import json

# 1. Read range boundaries assigned to this specific computer by the grid
start = int(os.environ.get("CHUNK_START", "1"))
end = int(os.environ.get("CHUNK_END", "10000"))
chunk_idx = int(os.environ.get("CHUNK_INDEX", "0"))

print(f"🚀 Worker activated! Finding prime numbers between {start} and {end}...")

# 2. Mathematical helper to check if a number is prime
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True

# 3. Perform the calculations
primes_list = [num for num in range(start, end) if is_prime(num)]
total_found = len(primes_list)

# 4. Save results to the required output directory
# easycompute automatically packages files in /job/output!
os.makedirs("/job/output", exist_ok=True)

# Write summary metrics
metrics = {
    "chunk_index": chunk_idx,
    "start_range": start,
    "end_range": end,
    "primes_count": total_found
}
with open("/job/output/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

# Save the raw list of prime numbers
with open("/job/output/primes.txt", "w") as f:
    f.write("\n".join(map(str, primes_list)))

print(f"✔ Done! Found {total_found} prime numbers. Results saved to /job/output.")
