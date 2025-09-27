FROM rust:1.75-bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    clang \
    cmake \
    curl \
    git \
    libssl-dev \
    llvm \
    pkg-config \
    protobuf-compiler \
    jq \
    nodejs \
    npm \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Anchor CLI
RUN npm install -g @coral-xyz/anchor-cli

WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip3 install -r requirements.txt; fi

# Copy contract interaction script and make it executable
COPY interact_contracts.sh .
RUN chmod +x interact_contracts.sh

# Create non-root user
RUN useradd --create-home --shell /bin/bash oracle && \
    chown -R oracle:oracle /app
USER oracle

# Command to run the enhanced application
CMD ["node", "oracle-simulator-enhanced.js"]
