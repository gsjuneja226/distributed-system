FROM python:3.11-slim
WORKDIR /job
# Install Pillow for high-performance image manipulation
RUN pip install --no-cache-dir Pillow --quiet
COPY render.py .
CMD ["python", "render.py"]
