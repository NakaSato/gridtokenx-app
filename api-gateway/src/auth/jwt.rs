use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;
use std::env;

use crate::auth::Claims;
use crate::error::{ApiError, Result};

#[derive(Clone)]
pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    validation: Validation,
}

impl JwtService {
    pub fn new() -> Result<Self> {
        let secret = env::var("JWT_SECRET")
            .map_err(|_| ApiError::Internal("JWT_SECRET environment variable not set".to_string()))?;
        
        let encoding_key = EncodingKey::from_secret(secret.as_ref());
        let decoding_key = DecodingKey::from_secret(secret.as_ref());
        
        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_issuer(&["api-gateway"]);
        validation.validate_exp = true;
        
        Ok(Self {
            encoding_key,
            decoding_key,
            validation,
        })
    }
    
    pub fn encode_token(&self, claims: &Claims) -> Result<String> {
        let header = Header::new(Algorithm::HS256);
        
        encode(&header, claims, &self.encoding_key)
            .map_err(|e| ApiError::Internal(format!("Failed to encode JWT: {}", e)))
    }
    
    pub fn decode_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(token, &self.decoding_key, &self.validation)
            .map_err(|e| match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    ApiError::Unauthorized("Token has expired".to_string())
                }
                jsonwebtoken::errors::ErrorKind::InvalidToken => {
                    ApiError::Unauthorized("Invalid token".to_string())
                }
                jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                    ApiError::Unauthorized("Invalid token signature".to_string())
                }
                _ => ApiError::Internal(format!("JWT decode error: {}", e)),
            })?;
        
        Ok(token_data.claims)
    }
    
    pub fn validate_token(&self, token: &str) -> Result<bool> {
        match self.decode_token(token) {
            Ok(claims) => Ok(!claims.is_expired()),
            Err(_) => Ok(false),
        }
    }
    
    pub fn refresh_token(&self, old_token: &str) -> Result<String> {
        let claims = self.decode_token(old_token)?;
        
        // Create new claims with extended expiration
        let new_claims = Claims::new(
            claims.sub,
            claims.username,
            claims.role,
            claims.department,
        );
        
        self.encode_token(&new_claims)
    }
}

/// API Key service for AMI systems
#[derive(Clone)]
pub struct ApiKeyService {
    secret: String,
}

impl ApiKeyService {
    pub fn new() -> Result<Self> {
        let secret = env::var("API_KEY_SECRET")
            .map_err(|_| ApiError::Internal("API_KEY_SECRET environment variable not set".to_string()))?;
        
        Ok(Self { secret })
    }
    
    pub fn generate_key(&self, _name: &str, _permissions: Vec<String>) -> Result<(String, String)> {
        let key = format!("ak_{}", Uuid::new_v4().to_string().replace('-', ""));
        let key_hash = self.hash_key(&key)?;
        
        Ok((key, key_hash))
    }
    
    pub fn verify_key(&self, key: &str, stored_hash: &str) -> Result<bool> {
        let computed_hash = self.hash_key(key)?;
        Ok(computed_hash == stored_hash)
    }
    
    fn hash_key(&self, key: &str) -> Result<String> {
        use sha2::{Sha256, Digest};
        
        let mut hasher = Sha256::new();
        hasher.update(key.as_bytes());
        hasher.update(self.secret.as_bytes());
        
        Ok(format!("{:x}", hasher.finalize()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn setup_test_env() {
        env::set_var("JWT_SECRET", "test_secret_key_123456789");
        env::set_var("API_KEY_SECRET", "test_api_key_secret_123456789");
    }

    #[test]
    fn test_jwt_encode_decode() {
        setup_test_env();
        
        let jwt_service = JwtService::new().unwrap();
        let claims = Claims::new(
            Uuid::new_v4(),
            "test_user".to_string(),
            "student".to_string(),
            "engineering".to_string(),
        );
        
        let token = jwt_service.encode_token(&claims).unwrap();
        let decoded_claims = jwt_service.decode_token(&token).unwrap();
        
        assert_eq!(claims.sub, decoded_claims.sub);
        assert_eq!(claims.username, decoded_claims.username);
        assert_eq!(claims.role, decoded_claims.role);
    }
    
    #[test]
    fn test_api_key_generation() {
        setup_test_env();
        
        let api_key_service = ApiKeyService::new().unwrap();
        let (key, hash) = api_key_service
            .generate_key("test_ami", vec!["energy:submit".to_string()])
            .unwrap();
        
        assert!(key.starts_with("ak_"));
        assert!(api_key_service.verify_key(&key, &hash).unwrap());
        assert!(!api_key_service.verify_key("wrong_key", &hash).unwrap());
    }
}