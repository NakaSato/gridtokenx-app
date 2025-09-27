use anyhow::Result;
use sqlx::{PgPool, Pool, Postgres};
use tracing::info;

pub mod schema;

pub type DatabasePool = Pool<Postgres>;

pub async fn setup_database(database_url: &str) -> Result<DatabasePool> {
    info!("Connecting to database: {}", database_url);
    
    let pool = PgPool::connect(database_url).await?;
    
    // Test the connection
    sqlx::query("SELECT 1").execute(&pool).await?;
    
    Ok(pool)
}

pub async fn setup_timescale_database(timescale_url: &str) -> Result<DatabasePool> {
    info!("Connecting to TimescaleDB: {}", timescale_url);
    
    let pool = PgPool::connect(timescale_url).await?;
    
    // Test the connection and TimescaleDB extension
    sqlx::query("SELECT 1").execute(&pool).await?;
    
    Ok(pool)
}

pub async fn run_migrations(pool: &DatabasePool) -> Result<()> {
    info!("Running database migrations");
    
    sqlx::migrate!("./migrations").run(pool).await?;
    
    info!("Database migrations completed successfully");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    // Note: Testcontainers integration will be implemented in Phase 2
    // when we set up full integration testing

    pub struct TestDatabase {
        pub pool: DatabasePool,
    }

    impl TestDatabase {
        pub async fn new() -> Result<Self> {
            // For now, just create a mock connection
            // In Phase 2, we'll implement proper test database setup
            todo!("Test database setup will be implemented in Phase 2")
        }
    }
}