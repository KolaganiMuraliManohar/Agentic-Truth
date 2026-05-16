FROM python:3.11-slim

# Install system dependencies (needed for OpenCV, dlib, and building some python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements files first to leverage Docker cache
COPY requirements*.txt ./

# Install dependencies
# We specifically use pip to install the segmented requirements if they exist.
# Ignore errors if a specific requirements file is missing.
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi && \
    if [ -f requirements_core.txt ]; then pip install --no-cache-dir -r requirements_core.txt; fi && \
    if [ -f requirements_ml.txt ]; then pip install --no-cache-dir -r requirements_ml.txt; fi && \
    if [ -f requirements_cv.txt ]; then pip install --no-cache-dir -r requirements_cv.txt; fi && \
    if [ -f requirements_graph.txt ]; then pip install --no-cache-dir -r requirements_graph.txt; fi

# Copy the source code
COPY ./src ./src
COPY ./config.py ./config.py

# Set environment variables
ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose port
EXPOSE 8000

# Run the FastAPI server via uvicorn
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
