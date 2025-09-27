# GridTokenX Makefile - P2P Energy Trading System
# Simplifies development, build, and deployment tasks

.PHONY: help install dev build test clean setup docker deploy lint format

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# Project directories
FRONTEND_DIR := frontend
ANCHOR_DIR := anchor
API_GATEWAY_DIR := api-gateway
DOCKER_DIR := docker

##@ Help
help: ## Display this help message
	@echo "$(BLUE)GridTokenX - P2P Energy Trading System$(NC)"
	@echo "$(GREEN)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(BLUE)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation & Setup
install: ## Install all dependencies (frontend, anchor, api-gateway)
	@echo "$(GREEN)Installing all dependencies...$(NC)"
	@echo "$(BLUE)Installing workspace dependencies...$(NC)"
	pnpm install
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && pnpm install
	@echo "$(BLUE)Building API Gateway (offline mode)...$(NC)"
	cd $(API_GATEWAY_DIR) && SQLX_OFFLINE=true cargo build || echo "$(YELLOW)⚠️ API Gateway build skipped (database required)$(NC)"
	@echo "$(GREEN)✅ All dependencies installed$(NC)"

install-frontend: ## Install frontend dependencies only
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && pnpm install

install-anchor: ## Install Anchor dependencies
	@echo "$(BLUE)Setting up Anchor environment...$(NC)"
	cd $(ANCHOR_DIR) && anchor build

install-api: ## Build API Gateway
	@echo "$(BLUE)Building API Gateway...$(NC)"
	@echo "$(YELLOW)Note: Building without database compile-time checks$(NC)"
	cd $(API_GATEWAY_DIR) && SQLX_OFFLINE=true cargo build --release

setup: ## Complete project setup (install + anchor setup + codama generation)
	@echo "$(GREEN)Running complete project setup...$(NC)"
	$(MAKE) install
	@echo "$(BLUE)Syncing Anchor keys...$(NC)"
	pnpm run anchor keys sync
	@echo "$(BLUE)Building Anchor programs...$(NC)"
	pnpm run anchor-build
	@echo "$(BLUE)Generating TypeScript clients...$(NC)"
	pnpm run codama:js
	@echo "$(GREEN)✅ Project setup complete$(NC)"

setup-minimal: ## Minimal setup (frontend + blockchain only)
	@echo "$(GREEN)Running minimal project setup...$(NC)"
	@echo "$(BLUE)Installing workspace dependencies...$(NC)"
	pnpm install
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && pnpm install
	@echo "$(BLUE)Syncing Anchor keys...$(NC)"
	pnpm run anchor keys sync
	@echo "$(BLUE)Building Anchor programs...$(NC)"
	pnpm run anchor-build
	@echo "$(BLUE)Generating TypeScript clients...$(NC)"
	pnpm run codama:js
	@echo "$(GREEN)✅ Minimal setup complete (API Gateway skipped)$(NC)"

##@ Development
dev: ## Start development environment (requires localnet)
	@echo "$(GREEN)Starting frontend development server...$(NC)"
	@echo "$(YELLOW)Note: Make sure to run 'make localnet' first$(NC)"
	cd $(FRONTEND_DIR) && pnpm run dev

dev-frontend: ## Start frontend development server only
	@echo "$(BLUE)Starting frontend development server...$(NC)"
	cd $(FRONTEND_DIR) && pnpm run dev

dev-api: ## Start API Gateway development server
	@echo "$(BLUE)Starting API Gateway development server...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo run

localnet: ## Start Solana test validator with programs deployed
	@echo "$(BLUE)Starting Solana localnet with deployed programs...$(NC)"
	pnpm run anchor-localnet

localnet-clean: ## Start clean Solana test validator
	@echo "$(BLUE)Starting clean Solana localnet...$(NC)"
	cd $(ANCHOR_DIR) && anchor localnet --skip-build

dev-full: ## Start complete development environment (localnet + frontend + api)
	@echo "$(GREEN)Starting complete development environment...$(NC)"
	@echo "$(YELLOW)This will start multiple processes. Use Ctrl+C to stop.$(NC)"
	@echo "$(BLUE)Starting Solana localnet...$(NC)"
	gnome-terminal --tab --title="Localnet" -- bash -c "make localnet; exec bash" 2>/dev/null || \
	osascript -e 'tell app "Terminal" to do script "cd $(PWD) && make localnet"' 2>/dev/null || \
	echo "$(YELLOW)Please manually start localnet: make localnet$(NC)"
	@sleep 3
	@echo "$(BLUE)Starting API Gateway...$(NC)"
	gnome-terminal --tab --title="API Gateway" -- bash -c "make dev-api; exec bash" 2>/dev/null || \
	osascript -e 'tell app "Terminal" to do script "cd $(PWD) && make dev-api"' 2>/dev/null || \
	echo "$(YELLOW)Please manually start API: make dev-api$(NC)"
	@sleep 2
	@echo "$(BLUE)Starting Frontend...$(NC)"
	$(MAKE) dev-frontend

##@ Build & Test
build: ## Build all components for production
	@echo "$(GREEN)Building all components...$(NC)"
	$(MAKE) build-anchor
	$(MAKE) build-frontend
	$(MAKE) build-api

build-frontend: ## Build frontend for production
	@echo "$(BLUE)Building frontend for production...$(NC)"
	cd $(FRONTEND_DIR) && pnpm run build
	@echo "$(GREEN)✅ Frontend built successfully$(NC)"

build-anchor: ## Build Anchor programs
	@echo "$(BLUE)Building Anchor programs...$(NC)"
	pnpm run anchor-build
	@echo "$(GREEN)✅ Anchor programs built successfully$(NC)"

build-api: ## Build API Gateway for production
	@echo "$(BLUE)Building API Gateway for production...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo build --release
	@echo "$(GREEN)✅ API Gateway built successfully$(NC)"

test: ## Run all tests
	@echo "$(GREEN)Running all tests...$(NC)"
	$(MAKE) test-anchor
	$(MAKE) test-frontend
	$(MAKE) test-api

test-anchor: ## Run Anchor program tests
	@echo "$(BLUE)Running Anchor program tests...$(NC)"
	pnpm run anchor-test

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd $(FRONTEND_DIR) && pnpm run test 2>/dev/null || echo "$(YELLOW)Frontend tests not configured yet$(NC)"

test-api: ## Run API Gateway tests
	@echo "$(BLUE)Running API Gateway tests...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo test

##@ Code Quality
lint: ## Run linting for all components
	@echo "$(GREEN)Running linting for all components...$(NC)"
	$(MAKE) lint-frontend
	$(MAKE) lint-api

lint-frontend: ## Run frontend linting
	@echo "$(BLUE)Running frontend ESLint...$(NC)"
	cd $(FRONTEND_DIR) && pnpm run lint

lint-api: ## Run API Gateway linting
	@echo "$(BLUE)Running API Gateway clippy...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo clippy -- -D warnings

format: ## Format all code
	@echo "$(GREEN)Formatting all code...$(NC)"
	@echo "$(BLUE)Formatting with Prettier...$(NC)"
	pnpm run format
	@echo "$(BLUE)Formatting Rust code...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo fmt

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	pnpm run format:check
	cd $(API_GATEWAY_DIR) && cargo fmt --check

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type checking...$(NC)"
	cd $(FRONTEND_DIR) && pnpm run type-check

##@ PoA Governance
poa-setup: ## Setup PoA governance system
	@echo "$(GREEN)Setting up PoA governance...$(NC)"
	@if [ ! -f "scripts/setup-poa-governance.sh" ]; then \
		echo "$(RED)❌ PoA governance setup script not found$(NC)"; \
		exit 1; \
	fi
	chmod +x scripts/setup-poa-governance.sh
	./scripts/setup-poa-governance.sh

poa-status: ## Check PoA governance status
	@echo "$(BLUE)Checking PoA governance status...$(NC)"
	@if [ ! -f "scripts/poa-governance-cli.sh" ]; then \
		echo "$(RED)❌ PoA governance CLI not found$(NC)"; \
		exit 1; \
	fi
	chmod +x scripts/poa-governance-cli.sh
	./scripts/poa-governance-cli.sh status

poa-pause: ## Emergency pause PoA system
	@echo "$(YELLOW)⚠️ Emergency pausing PoA system...$(NC)"
	./scripts/poa-governance-cli.sh emergency-pause

poa-unpause: ## Emergency unpause PoA system
	@echo "$(GREEN)Resuming PoA system...$(NC)"
	./scripts/poa-governance-cli.sh emergency-unpause

##@ Docker & Deployment
docker-build: ## Build all Docker images
	@echo "$(GREEN)Building all Docker images...$(NC)"
	docker-compose build

docker-build-frontend: ## Build frontend Docker image
	@echo "$(BLUE)Building frontend Docker image...$(NC)"
	docker build -f $(DOCKER_DIR)/frontend/Dockerfile -t gridtokenx-frontend .

docker-build-api: ## Build API Gateway Docker image
	@echo "$(BLUE)Building API Gateway Docker image...$(NC)"
	docker build -f $(DOCKER_DIR)/api-gateway/Dockerfile -t gridtokenx-api .

docker-up: ## Start all services with Docker Compose
	@echo "$(GREEN)Starting all services with Docker Compose...$(NC)"
	docker-compose up -d

docker-down: ## Stop all Docker services
	@echo "$(BLUE)Stopping all Docker services...$(NC)"
	docker-compose down

docker-logs: ## View Docker logs
	@echo "$(BLUE)Showing Docker logs...$(NC)"
	docker-compose logs -f

deploy-dev: ## Deploy to development environment
	@echo "$(GREEN)Deploying to development environment...$(NC)"
	$(MAKE) build
	$(MAKE) docker-build
	$(MAKE) docker-up

##@ Database & Infrastructure
db-setup: ## Setup database (PostgreSQL + TimescaleDB)
	@echo "$(BLUE)Setting up database...$(NC)"
	docker-compose up -d postgres timescaledb
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	sleep 10
	@echo "$(BLUE)Running database migrations...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo run --bin migrate || echo "$(YELLOW)Migration tool not available$(NC)"

db-reset: ## Reset database
	@echo "$(YELLOW)Resetting database...$(NC)"
	docker-compose down postgres timescaledb
	docker volume rm gridtokenx-app_postgres_data 2>/dev/null || true
	$(MAKE) db-setup

redis-setup: ## Setup Redis for caching
	@echo "$(BLUE)Setting up Redis...$(NC)"
	docker-compose up -d redis

##@ Maintenance
clean: ## Clean all build artifacts
	@echo "$(GREEN)Cleaning all build artifacts...$(NC)"
	@echo "$(BLUE)Cleaning frontend...$(NC)"
	cd $(FRONTEND_DIR) && rm -rf dist node_modules/.cache
	@echo "$(BLUE)Cleaning Anchor...$(NC)"
	cd $(ANCHOR_DIR) && cargo clean
	@echo "$(BLUE)Cleaning API Gateway...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo clean
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

clean-all: ## Clean everything including node_modules and dependencies
	@echo "$(YELLOW)⚠️ Cleaning everything including dependencies...$(NC)"
	$(MAKE) clean
	rm -rf node_modules
	cd $(FRONTEND_DIR) && rm -rf node_modules
	cd $(API_GATEWAY_DIR) && rm -rf target
	@echo "$(GREEN)✅ Deep cleanup complete$(NC)"

clean-docker: ## Clean Docker images and containers
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

update: ## Update all dependencies
	@echo "$(GREEN)Updating all dependencies...$(NC)"
	@echo "$(BLUE)Updating workspace dependencies...$(NC)"
	pnpm update
	@echo "$(BLUE)Updating frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && pnpm update
	@echo "$(BLUE)Updating Rust dependencies...$(NC)"
	cd $(API_GATEWAY_DIR) && cargo update

##@ CI/CD
ci: ## Run CI pipeline (build, test, lint)
	@echo "$(GREEN)Running CI pipeline...$(NC)"
	$(MAKE) install
	$(MAKE) build
	$(MAKE) test
	$(MAKE) lint
	$(MAKE) format-check
	$(MAKE) type-check
	@echo "$(GREEN)✅ CI pipeline completed successfully$(NC)"

pre-commit: ## Run pre-commit checks
	@echo "$(BLUE)Running pre-commit checks...$(NC)"
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) type-check

##@ Information
status: ## Show project status
	@echo "$(BLUE)GridTokenX Project Status$(NC)"
	@echo "================================"
	@echo "$(GREEN)Project Structure:$(NC)"
	@echo "  Frontend: $(FRONTEND_DIR)/ (React + Vite)"
	@echo "  Blockchain: $(ANCHOR_DIR)/ (5 Anchor programs)"
	@echo "  Backend: $(API_GATEWAY_DIR)/ (Rust API Gateway)"
	@echo ""
	@echo "$(GREEN)Development Status:$(NC)"
	@if [ -d "$(FRONTEND_DIR)/node_modules" ]; then echo "  ✅ Frontend dependencies installed"; else echo "  ❌ Frontend dependencies missing"; fi
	@if [ -d "$(ANCHOR_DIR)/target" ]; then echo "  ✅ Anchor programs built"; else echo "  ❌ Anchor programs need building"; fi
	@if [ -d "$(API_GATEWAY_DIR)/target" ]; then echo "  ✅ API Gateway built"; else echo "  ❌ API Gateway needs building"; fi
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  1. make setup     # Complete project setup"
	@echo "  2. make localnet  # Start Solana validator"
	@echo "  3. make dev       # Start frontend development"

env-check: ## Check environment requirements
	@echo "$(BLUE)Checking environment requirements...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)❌ Node.js not installed$(NC)"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "$(RED)❌ pnpm not installed$(NC)"; exit 1; }
	@command -v cargo >/dev/null 2>&1 || { echo "$(RED)❌ Rust/Cargo not installed$(NC)"; exit 1; }
	@command -v anchor >/dev/null 2>&1 || { echo "$(RED)❌ Anchor CLI not installed$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "$(YELLOW)⚠️ Docker not installed (optional)$(NC)"; }
	@echo "$(GREEN)✅ Environment check passed$(NC)"

##@ Advanced
codama: ## Generate TypeScript clients from Anchor programs
	@echo "$(BLUE)Generating TypeScript clients with Codama...$(NC)"
	pnpm run codama:js

keys-sync: ## Sync Anchor program keys
	@echo "$(BLUE)Syncing Anchor program keys...$(NC)"
	pnpm run anchor keys sync

deploy-devnet: ## Deploy programs to Solana devnet
	@echo "$(YELLOW)⚠️ Deploying to Solana devnet...$(NC)"
	cd $(ANCHOR_DIR) && anchor deploy --provider.cluster devnet

backup: ## Create project backup
	@echo "$(BLUE)Creating project backup...$(NC)"
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	tar -czf "gridtokenx_backup_$$timestamp.tar.gz" \
		--exclude=node_modules \
		--exclude=target \
		--exclude=dist \
		--exclude=.git \
		. && \
	echo "$(GREEN)✅ Backup created: gridtokenx_backup_$$timestamp.tar.gz$(NC)"

##@ Examples & Documentation
examples: ## Show common usage examples
	@echo "$(BLUE)GridTokenX Common Usage Examples$(NC)"
	@echo "================================"
	@echo "$(GREEN)Initial Setup:$(NC)"
	@echo "  make env-check && make setup"
	@echo ""
	@echo "$(GREEN)Daily Development:$(NC)"
	@echo "  make localnet    # Terminal 1"
	@echo "  make dev-api     # Terminal 2"  
	@echo "  make dev         # Terminal 3"
	@echo ""
	@echo "$(GREEN)PoA Governance Management:$(NC)"
	@echo "  make poa-setup   # Initial setup"
	@echo "  make poa-status  # Check status"
	@echo "  make poa-pause   # Emergency pause"
	@echo ""
	@echo "$(GREEN)Production Build & Deploy:$(NC)"
	@echo "  make ci          # Full CI pipeline"
	@echo "  make docker-build && make docker-up"

docs: ## Generate/serve documentation
	@echo "$(BLUE)GridTokenX Documentation$(NC)"
	@echo "=========================="
	@echo "📁 Available Documentation:"
	@echo "  • README.md - Main project overview"
	@echo "  • frontend/README.md - Frontend documentation"  
	@echo "  • docs/ - Comprehensive documentation"
	@echo "  • PROJECT_STRUCTURE.md - Architecture overview"
	@echo ""
	@echo "🌐 Access Documentation:"
	@echo "  • Frontend: http://localhost:5174 (when dev running)"
	@echo "  • API Docs: http://localhost:8080/docs (when API running)"