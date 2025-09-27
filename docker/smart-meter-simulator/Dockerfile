FROM python:3.11-alpine

WORKDIR /app

# Install minimal system dependencies
RUN apk add --no-cache gcc musl-dev

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY simulator.py .

# Create non-root user
RUN adduser -D -h /app simulator && \
    chown -R simulator:simulator /app

USER simulator

# Run the smart meter simulator
CMD ["python", "simulator.py"]
