# API Gateway Docker Configuration

This directory contains Docker configuration files for the P2P Energy Trading API Gateway.

## Files

### Dockerfiles
- **`Dockerfile`** - Production multi-stage build
- **`Dockerfile.dev`** - Development build with hot reload

### Configuration
- **`.dockerignore`** - Files to exclude from Docker context
- **`healthcheck.sh`** - Health check script for container monitoring
- **`build.sh`** - Build script for both development and production images

## Usage

### Building Images

#### Production Build
```bash
./build.sh production
# or simply
./build.sh
```

#### Development Build
```bash
./build.sh development
```

### Running Containers

#### Production Container
```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@localhost/api_gateway" \
  -e REDIS_URL="redis://localhost:6379" \
  -e JWT_SECRET="your-secret-key" \
  p2p-api-gateway:latest
```

#### Development Container with Hot Reload
```bash
docker run -p 8080:8080 \
  -v $(pwd)/api-gateway:/app/api-gateway \
  -e DATABASE_URL="postgresql://user:pass@localhost/api_gateway" \
  -e REDIS_URL="redis://localhost:6379" \
  -e JWT_SECRET="your-secret-key" \
  p2p-api-gateway:dev
```

### Docker Compose Integration

The API Gateway is designed to work with the main `docker-compose.yml` file in the project root:

```yaml
api-gateway:
  build:
    context: .
    dockerfile: docker/api-gateway/Dockerfile
  ports:
    - "8080:8080"
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/api_gateway
    - REDIS_URL=redis://redis:6379
    - JWT_SECRET=development-secret-key
  depends_on:
    - postgres
    - redis
```

## SQLx Offline Compilation

This project uses SQLx with compile-time checked queries. For Docker builds to work without a database connection, we use SQLx's offline mode:

### Query Cache Generation

When modifying database queries, you need to regenerate the SQLx query cache:

1. Start the database:
   ```bash
   docker-compose up -d postgres
   ```

2. Set the database URL and generate the cache:
   ```bash
   cd api-gateway
   export DATABASE_URL="postgresql://p2p_user:p2p_password@localhost:5432/p2p_energy_trading"
   cargo sqlx prepare
   ```

3. Commit the updated `.sqlx/` directory to version control.

### Dockerfile Configuration

The Dockerfile includes:
- Copy of `.sqlx/` directory for offline compilation
- `SQLX_OFFLINE=true` environment variable
- Proper build ordering to cache dependencies

### Troubleshooting SQLx Issues

- **Build fails with "set DATABASE_URL"**: Ensure `.sqlx/` directory is up to date
- **Query compilation errors**: Regenerate query cache after schema changes
- **Missing `.sqlx/` directory**: Run `cargo sqlx prepare` as described above

## Environment Variables

Required environment variables for the API Gateway:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secure-secret-key` |
| `RUST_LOG` | Logging level (optional) | `info` |
| `PORT` | Server port (optional, default: 8080) | `8080` |

## Health Check

The containers include health checks that verify:
- HTTP server is responding on port 8080
- `/health` endpoint returns status "healthy"
- Database connectivity
- Redis connectivity

## Security Features

### Production Image
- Multi-stage build reduces image size
- Non-root user execution (`api-gateway` user)
- Minimal base image (Debian Bookworm Slim)
- Only necessary runtime dependencies

### Development Image
- Hot reload with `cargo-watch`
- Development tools included
- Source code mounting for rapid iteration

## Optimization

### Build Caching
Both Dockerfiles are optimized for build caching:
1. Dependencies are built first (changes less frequently)
2. Source code is copied last (changes most frequently)
3. Multi-stage builds minimize final image size

### Image Size
- Production image: ~50MB (optimized)
- Development image: ~500MB (includes build tools)

## Troubleshooting

### Container Won't Start
1. Check environment variables are set correctly
2. Verify database and Redis are accessible
3. Check logs: `docker logs <container-name>`

### Health Check Failures
1. Ensure port 8080 is exposed and accessible
2. Check if `/health` endpoint is implemented
3. Verify dependencies (database, Redis) are healthy

### Development Issues
1. For hot reload, ensure source code is properly mounted
2. Check file permissions on mounted volumes
3. Verify cargo-watch is working: `docker exec -it <container> cargo watch --version`

## Integration with CI/CD

The Docker configuration supports automated builds and deployments:

```bash
# Build and tag for registry
docker build -f docker/api-gateway/Dockerfile -t registry.example.com/p2p-api-gateway:v1.0.0 .

# Push to registry
docker push registry.example.com/p2p-api-gateway:v1.0.0
```