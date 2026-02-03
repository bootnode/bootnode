# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster dependency installation
RUN pip install uv

# Copy project files
COPY pyproject.toml README.md ./
COPY bootnode/ bootnode/

# Install dependencies
RUN uv pip install --system -e .

# Run the application
EXPOSE 8000
CMD ["uvicorn", "bootnode.main:app", "--host", "0.0.0.0", "--port", "8000"]
