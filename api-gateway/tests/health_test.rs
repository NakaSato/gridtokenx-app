use api_gateway::handlers::health::health_check;
use axum::http::StatusCode;
use serde_json::Value;

#[tokio::test]
async fn test_health_check() {
    let response = health_check().await;
    
    let health_status: Value = serde_json::from_str(&serde_json::to_string(&response.0).unwrap()).unwrap();
    
    assert_eq!(health_status["status"], "healthy");
    assert!(health_status["timestamp"].is_string());
    assert!(health_status["version"].is_string());
}