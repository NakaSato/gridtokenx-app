use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

pub mod jwt;
pub mod password;
pub mod middleware;

/// User claims for JWT tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,           // Subject (user ID)
    pub username: String,    // Username
    pub role: String,        // User role (student, faculty, admin)
    pub department: String,  // Department
    pub exp: i64,           // Expiration time
    pub iat: i64,           // Issued at
    pub iss: String,        // Issuer
}

impl Claims {
    pub fn new(user_id: Uuid, username: String, role: String, department: String) -> Self {
        let now = Utc::now();
        let exp = now + chrono::Duration::hours(24); // 24 hour expiration
        
        Self {
            sub: user_id,
            username,
            role,
            department,
            exp: exp.timestamp(),
            iat: now.timestamp(),
            iss: "api-gateway".to_string(),
        }
    }
    
    pub fn is_expired(&self) -> bool {
        Utc::now().timestamp() > self.exp
    }
    
    pub fn has_role(&self, required_role: &str) -> bool {
        self.role == required_role
    }
    
    pub fn has_any_role(&self, required_roles: &[&str]) -> bool {
        required_roles.contains(&self.role.as_str())
    }
}

/// API Key for AMI systems
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKey {
    pub id: Uuid,
    pub key_hash: String,
    pub name: String,
    pub permissions: Vec<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
}

/// Secure authentication response (excludes sensitive user data)
#[derive(Debug, Serialize)]
pub struct SecureAuthResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub user: SecureUserInfo,
}

/// User information for responses
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub role: String,
    pub department: String,
    pub wallet_address: Option<String>,
    pub blockchain_registered: bool,
}

/// Secure user information for login responses (excludes sensitive data)
#[derive(Debug, Serialize)]
pub struct SecureUserInfo {
    pub username: String,
    pub email: String,
    pub role: String,
    pub department: String,
    pub blockchain_registered: bool,
}

/// Role-based permissions
#[derive(Debug, Clone, PartialEq)]
pub enum Role {
    Student,
    Faculty,
    Admin,
    AMI,
}

impl Role {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "student" => Ok(Role::Student),
            "faculty" => Ok(Role::Faculty),
            "admin" => Ok(Role::Admin),
            "ami" => Ok(Role::AMI),
            _ => Err(format!("Invalid role: {}", s)),
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            Role::Student => "student",
            Role::Faculty => "faculty",
            Role::Admin => "admin",
            Role::AMI => "ami",
        }
    }
    
    pub fn permissions(&self) -> Vec<&'static str> {
        match self {
            Role::Student => vec![
                "energy:read",
                "energy:submit",
                "trading:read",
                "trading:create",
                "profile:read",
                "profile:update",
            ],
            Role::Faculty => vec![
                "energy:read",
                "energy:submit", 
                "trading:read",
                "trading:create",
                "profile:read",
                "profile:update",
                "analytics:read",
                "users:read",
            ],
            Role::Admin => vec![
                "energy:*",
                "trading:*",
                "profile:*",
                "analytics:*",
                "users:*",
                "admin:*",
            ],
            Role::AMI => vec![
                "energy:submit",
                "meters:read",
                "meters:update",
            ],
        }
    }
    
    pub fn can_access(&self, permission: &str) -> bool {
        let permissions = self.permissions();
        
        // Check for exact match
        if permissions.contains(&permission) {
            return true;
        }
        
        // Check for wildcard permissions
        for perm in permissions {
            if perm.ends_with("*") {
                let prefix = &perm[..perm.len() - 1];
                if permission.starts_with(prefix) {
                    return true;
                }
            }
        }
        
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_role_permissions() {
        let admin = Role::Admin;
        assert!(admin.can_access("users:create"));
        assert!(admin.can_access("energy:read"));
        assert!(admin.can_access("admin:settings"));
        
        let student = Role::Student;
        assert!(student.can_access("energy:read"));
        assert!(student.can_access("trading:create"));
        assert!(!student.can_access("users:create"));
        assert!(!student.can_access("admin:settings"));
    }
    
    #[test]
    fn test_claims_expiration() {
        let claims = Claims::new(
            Uuid::new_v4(),
            "test_user".to_string(),
            "student".to_string(),
            "engineering".to_string(),
        );
        
        assert!(!claims.is_expired());
        assert!(claims.has_role("student"));
        assert!(!claims.has_role("admin"));
    }
}