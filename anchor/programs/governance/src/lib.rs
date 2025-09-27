use anchor_lang::prelude::*;

declare_id!("8SD7rh3fMtLsS9ciVKvyhVUkHimq7TEfgfE4AqUi2Lxt");

/// University authority public key (hardcoded for demo)
pub const UNIVERSITY_AUTHORITY_PUBKEY: Pubkey = Pubkey::new_from_array([1u8; 32]);

#[program]
pub mod governance {
    use super::*;
    
    /// Simple initialization for testing
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        poa_config.university_authority = ctx.accounts.authority.key();
        poa_config.authorized_rec_validators = Vec::new();
        poa_config.min_rec_validators = 1;
        poa_config.emergency_paused = false;
        poa_config.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Governance program initialized");
        Ok(())
    }

    /// Emergency pause functionality
    pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(
            ctx.accounts.authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        poa_config.emergency_paused = true;
        
        emit!(EmergencyPauseActivated {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Emergency pause activated");
        Ok(())
    }

    /// Emergency unpause functionality
    pub fn emergency_unpause(ctx: Context<EmergencyUnpause>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(
            ctx.accounts.authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        poa_config.emergency_paused = false;
        
        emit!(EmergencyPauseDeactivated {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Emergency pause deactivated");
        Ok(())
    }
    
    /// Initialize PoA governance with REC validators
    pub fn initialize_poa_with_rec(ctx: Context<InitializePoAWithRec>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        // Verify university authority
        require!(
            ctx.accounts.university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY,
            ErrorCode::UnauthorizedAuthority
        );
        
        poa_config.university_authority = ctx.accounts.university_authority.key();
        poa_config.authorized_rec_validators = vec![
            // University departments as REC certification authority
            RecValidatorInfo {
                pubkey: ctx.accounts.sustainability_validator.key(),
                authority_name: "University Sustainability Office".to_string(),
                certification_authority: true,
                active: true,
                added_at: Clock::get()?.unix_timestamp,
            },
            RecValidatorInfo {
                pubkey: ctx.accounts.engineering_validator.key(),
                authority_name: "University Engineering Department".to_string(),
                certification_authority: true,
                active: true,
                added_at: Clock::get()?.unix_timestamp,
            },
            RecValidatorInfo {
                pubkey: ctx.accounts.facilities_validator.key(),
                authority_name: "University Facilities Management".to_string(),
                certification_authority: true,
                active: true,
                added_at: Clock::get()?.unix_timestamp,
            },
        ];
        poa_config.min_rec_validators = 2; // Minimum for REC consensus
        poa_config.created_at = Clock::get()?.unix_timestamp;
        
        emit!(PoAInitialized {
            authority: ctx.accounts.university_authority.key(),
            validator_count: poa_config.authorized_rec_validators.len() as u8,
            min_validators: poa_config.min_rec_validators,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Add a new authorized REC validator
    pub fn add_authorized_rec_validator(
        ctx: Context<AddRecValidator>,
        validator_pubkey: Pubkey,
        department: String,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        // Only university authority can add validators
        require!(
            ctx.accounts.university_authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        require!(
            !poa_config.authorized_rec_validators.iter().any(|v| v.pubkey == validator_pubkey),
            ErrorCode::ValidatorAlreadyAuthorized
        );
        
        require!(
            poa_config.authorized_rec_validators.len() < PoAConfig::MAX_REC_VALIDATORS,
            ErrorCode::MaxValidatorsExceeded
        );
        
        let new_validator = RecValidatorInfo {
            pubkey: validator_pubkey,
            authority_name: department,
            certification_authority: true,
            active: true,
            added_at: Clock::get()?.unix_timestamp,
        };
        
        poa_config.authorized_rec_validators.push(new_validator);
        
        emit!(RecValidatorAdded {
            validator: validator_pubkey,
            authority: ctx.accounts.university_authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Remove an authorized REC validator
    pub fn remove_authorized_rec_validator(
        ctx: Context<RemoveRecValidator>,
        validator_pubkey: Pubkey,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(
            ctx.accounts.university_authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        require!(
            poa_config.authorized_rec_validators.len() > poa_config.min_rec_validators as usize,
            ErrorCode::InsufficientValidators
        );
        
        let validator_exists = poa_config.authorized_rec_validators.iter().any(|v| v.pubkey == validator_pubkey);
        require!(validator_exists, ErrorCode::ValidatorNotFound);
        
        poa_config.authorized_rec_validators.retain(|v| v.pubkey != validator_pubkey);
        
        emit!(RecValidatorRemoved {
            validator: validator_pubkey,
            authority: ctx.accounts.university_authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Update minimum required REC validators
    pub fn update_min_rec_validators(
        ctx: Context<UpdateMinValidators>,
        new_min: u8,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(
            ctx.accounts.university_authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        require!(
            new_min > 0 && new_min <= poa_config.authorized_rec_validators.len() as u8,
            ErrorCode::InvalidMinValidators
        );
        
        let old_min = poa_config.min_rec_validators;
        poa_config.min_rec_validators = new_min;
        
        emit!(MinValidatorsUpdated {
            old_min,
            new_min,
            authority: ctx.accounts.university_authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Deactivate a REC validator (suspend without removing)
    pub fn deactivate_rec_validator(
        ctx: Context<DeactivateRecValidator>,
        validator_pubkey: Pubkey,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(
            ctx.accounts.university_authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        let active_count = poa_config.authorized_rec_validators.iter().filter(|v| v.active).count();
        require!(
            active_count > poa_config.min_rec_validators as usize,
            ErrorCode::InsufficientActiveValidators
        );
        
        let validator = poa_config.authorized_rec_validators.iter_mut()
            .find(|v| v.pubkey == validator_pubkey)
            .ok_or(ErrorCode::ValidatorNotFound)?;
        
        require!(validator.active, ErrorCode::ValidatorAlreadyInactive);
        
        validator.active = false;
        
        emit!(RecValidatorDeactivated {
            validator: validator_pubkey,
            authority: ctx.accounts.university_authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Reactivate a REC validator
    pub fn reactivate_rec_validator(
        ctx: Context<ReactivateRecValidator>,
        validator_pubkey: Pubkey,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(
            ctx.accounts.university_authority.key() == poa_config.university_authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        let validator = poa_config.authorized_rec_validators.iter_mut()
            .find(|v| v.pubkey == validator_pubkey)
            .ok_or(ErrorCode::ValidatorNotFound)?;
        
        require!(!validator.active, ErrorCode::ValidatorAlreadyActive);
        
        validator.active = true;
        
        emit!(RecValidatorReactivated {
            validator: validator_pubkey,
            authority: ctx.accounts.university_authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Get validator information
    pub fn get_validator_info(ctx: Context<GetValidatorInfo>) -> Result<Vec<RecValidatorInfo>> {
        let poa_config = &ctx.accounts.poa_config;
        Ok(poa_config.authorized_rec_validators.clone())
    }
    
    /// Verify if a validator is authorized and active
    pub fn is_authorized_rec_validator(
        ctx: Context<IsAuthorizedRecValidator>,
        validator_pubkey: Pubkey,
    ) -> Result<bool> {
        let poa_config = &ctx.accounts.poa_config;
        
        let is_authorized = poa_config.authorized_rec_validators.iter().any(|v| 
            v.pubkey == validator_pubkey && 
            v.active && 
            v.certification_authority
        );
        
        Ok(is_authorized)
    }
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PoAConfig::LEN,
        seeds = [b"poa_config"],
        bump
    )]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(mut)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyUnpause<'info> {
    #[account(mut)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub authority: Signer<'info>,
}
#[derive(Accounts)]
pub struct InitializePoAWithRec<'info> {
    #[account(
        init,
        payer = university_authority,
        space = 8 + PoAConfig::LEN,
        seeds = [b"poa_config"],
        bump
    )]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(mut, constraint = university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub university_authority: Signer<'info>,
    
    /// CHECK: University Sustainability Office validator
    pub sustainability_validator: AccountInfo<'info>,
    /// CHECK: University Engineering Department validator
    pub engineering_validator: AccountInfo<'info>,
    /// CHECK: University Facilities Management validator
    pub facilities_validator: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddRecValidator<'info> {
    #[account(mut, has_one = university_authority @ ErrorCode::UnauthorizedAuthority)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub university_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveRecValidator<'info> {
    #[account(mut, has_one = university_authority @ ErrorCode::UnauthorizedAuthority)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub university_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateMinValidators<'info> {
    #[account(mut, has_one = university_authority @ ErrorCode::UnauthorizedAuthority)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub university_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateRecValidator<'info> {
    #[account(mut, has_one = university_authority @ ErrorCode::UnauthorizedAuthority)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub university_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReactivateRecValidator<'info> {
    #[account(mut, has_one = university_authority @ ErrorCode::UnauthorizedAuthority)]
    pub poa_config: Account<'info, PoAConfig>,
    
    #[account(constraint = university_authority.key() == UNIVERSITY_AUTHORITY_PUBKEY)]
    pub university_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetValidatorInfo<'info> {
    pub poa_config: Account<'info, PoAConfig>,
}

#[derive(Accounts)]
pub struct IsAuthorizedRecValidator<'info> {
    pub poa_config: Account<'info, PoAConfig>,
}



// Data structs
#[account]
pub struct PoAConfig {
    pub university_authority: Pubkey,
    pub authorized_rec_validators: Vec<RecValidatorInfo>,
    pub min_rec_validators: u8,
    pub emergency_paused: bool,
    pub created_at: i64,
}

impl PoAConfig {
    pub const MAX_REC_VALIDATORS: usize = 10;
    pub const LEN: usize = 32 + 4 + (RecValidatorInfo::LEN * Self::MAX_REC_VALIDATORS) + 1 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecValidatorInfo {
    pub pubkey: Pubkey,
    pub authority_name: String, // e.g., "University Sustainability Office"
    pub certification_authority: bool,
    pub active: bool,
    pub added_at: i64,
}

impl RecValidatorInfo {
    pub const LEN: usize = 32 + 64 + 1 + 1 + 8; // pubkey + authority_name + certification_authority + active + added_at
}

// Events
#[event]
pub struct EmergencyPauseActivated {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyPauseDeactivated {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PoAInitialized {
    pub authority: Pubkey,
    pub validator_count: u8,
    pub min_validators: u8,
    pub timestamp: i64,
}

#[event]
pub struct RecValidatorAdded {
    pub validator: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RecValidatorRemoved {
    pub validator: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MinValidatorsUpdated {
    pub old_min: u8,
    pub new_min: u8,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RecValidatorDeactivated {
    pub validator: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RecValidatorReactivated {
    pub validator: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("Validator already authorized")]
    ValidatorAlreadyAuthorized,
    #[msg("Validator not found")]
    ValidatorNotFound,
    #[msg("Insufficient validators")]
    InsufficientValidators,
    #[msg("Invalid minimum validators")]
    InvalidMinValidators,
    #[msg("Maximum validators exceeded")]
    MaxValidatorsExceeded,
    #[msg("Insufficient active validators")]
    InsufficientActiveValidators,
    #[msg("Validator already inactive")]
    ValidatorAlreadyInactive,
    #[msg("Validator already active")]
    ValidatorAlreadyActive,
}