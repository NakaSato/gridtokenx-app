use bcrypt::{hash, verify, DEFAULT_COST};
use crate::error::{ApiError, Result};

pub struct PasswordService;

impl PasswordService {
    pub fn hash_password(password: &str) -> Result<String> {
        // Validate password strength first
        Self::validate_password_strength(password)?;
        
        hash(password, DEFAULT_COST)
            .map_err(|e| ApiError::Internal(format!("Failed to hash password: {}", e)))
    }
    
    pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
        verify(password, hash)
            .map_err(|e| ApiError::Internal(format!("Failed to verify password: {}", e)))
    }
    
    pub fn validate_password_strength(password: &str) -> Result<()> {
        let min_length = 8;
        let max_length = 128;
        
        if password.len() < min_length {
            return Err(ApiError::BadRequest(format!(
                "Password must be at least {} characters long",
                min_length
            )));
        }
        
        if password.len() > max_length {
            return Err(ApiError::BadRequest(format!(
                "Password must be no more than {} characters long",
                max_length
            )));
        }
        
        let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
        let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());
        let has_special = password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));
        
        let strength_checks = [
            (has_lowercase, "at least one lowercase letter"),
            (has_uppercase, "at least one uppercase letter"),
            (has_digit, "at least one digit"),
            (has_special, "at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"),
        ];
        
        let mut missing_requirements = Vec::new();
        for (check, requirement) in strength_checks {
            if !check {
                missing_requirements.push(requirement);
            }
        }
        
        if !missing_requirements.is_empty() {
            return Err(ApiError::BadRequest(format!(
                "Password must contain: {}",
                missing_requirements.join(", ")
            )));
        }
        
        // Check for common weak patterns
        let password_lower = password.to_lowercase();
        let weak_patterns = [
            "password",
            "123456",
            "qwerty",
            "admin",
            "letmein",
            "welcome",
            "monkey",
            "dragon",
        ];
        
        for pattern in &weak_patterns {
            if password_lower.contains(pattern) {
                return Err(ApiError::BadRequest(
                    "Password contains common weak patterns".to_string(),
                ));
            }
        }
        
        Ok(())
    }
    
    pub fn generate_temporary_password() -> String {
        use rand::Rng;
        use rand::distributions::Alphanumeric;
        
        let mut rng = rand::thread_rng();
        
        // Generate a password with mixed case, digits, and special characters
        let mut password = String::new();
        
        // Add at least one of each required character type
        password.push(rng.gen_range('A'..='Z'));
        password.push(rng.gen_range('a'..='z'));
        password.push(rng.gen_range('0'..='9'));
        password.push("!@#$%^&*".chars().nth(rng.gen_range(0..8)).unwrap());
        
        // Fill the rest with random alphanumeric characters
        for _ in 0..8 {
            password.push(rng.sample(Alphanumeric) as char);
        }
        
        // Shuffle the password
        let mut chars: Vec<char> = password.chars().collect();
        for i in 0..chars.len() {
            let j = rng.gen_range(0..chars.len());
            chars.swap(i, j);
        }
        
        chars.into_iter().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "TestPassword123!";
        let hash = PasswordService::hash_password(password).unwrap();
        
        assert!(PasswordService::verify_password(password, &hash).unwrap());
        assert!(!PasswordService::verify_password("WrongPassword", &hash).unwrap());
    }
    
    #[test]
    fn test_password_strength_validation() {
        // Valid password
        assert!(PasswordService::validate_password_strength("TestPassword123!").is_ok());
        
        // Too short
        assert!(PasswordService::validate_password_strength("Test1!").is_err());
        
        // Missing uppercase
        assert!(PasswordService::validate_password_strength("testpassword123!").is_err());
        
        // Missing lowercase
        assert!(PasswordService::validate_password_strength("TESTPASSWORD123!").is_err());
        
        // Missing digit
        assert!(PasswordService::validate_password_strength("TestPassword!").is_err());
        
        // Missing special character
        assert!(PasswordService::validate_password_strength("TestPassword123").is_err());
        
        // Contains weak pattern
        assert!(PasswordService::validate_password_strength("Password123!").is_err());
    }
    
    #[test]
    fn test_temporary_password_generation() {
        let temp_password = PasswordService::generate_temporary_password();
        
        // Should be valid according to our strength requirements
        assert!(PasswordService::validate_password_strength(&temp_password).is_ok());
        
        // Should be 12 characters long
        assert_eq!(temp_password.len(), 12);
    }
}