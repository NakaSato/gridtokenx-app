use anchor_lang::prelude::*;

declare_id!("BkZ9cBB3FFGXxJPw5JTJAbVAQYaDBeoQKoSL7b5u5Snv");

#[program]
pub mod registry {
    use super::*;
    
    /// Initialize the registry with university authority
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.user_count = 0;
        registry.meter_count = 0;
        registry.created_at = Clock::get()?.unix_timestamp;
        
        emit!(RegistryInitialized {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Register a new user in the P2P energy trading system
    pub fn register_user(
        ctx: Context<RegisterUser>,
        user_type: UserType,
        location: String,
    ) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let registry = &mut ctx.accounts.registry;
        
        // Set user account data
        user_account.authority = ctx.accounts.user_authority.key();
        user_account.user_type = user_type;
        user_account.location = location.clone();
        user_account.status = UserStatus::Active;
        user_account.registered_at = Clock::get()?.unix_timestamp;
        user_account.meter_count = 0;
        user_account.created_at = Clock::get()?.unix_timestamp; // For backward compatibility
        
        // Update registry counters
        registry.user_count += 1;
        
        emit!(UserRegistered {
            user: ctx.accounts.user_authority.key(),
            user_type,
            location,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Register a smart meter for an existing user
    pub fn register_meter(
        ctx: Context<RegisterMeter>,
        meter_id: String,
        meter_type: MeterType,
    ) -> Result<()> {
        let meter_account = &mut ctx.accounts.meter_account;
        let user_account = &mut ctx.accounts.user_account;
        let registry = &mut ctx.accounts.registry;
        
        // Verify user owns this operation
        require!(
            ctx.accounts.user_authority.key() == user_account.authority,
            ErrorCode::UnauthorizedUser
        );
        
        // Set meter account data
        meter_account.meter_id = meter_id.clone();
        meter_account.owner = ctx.accounts.user_authority.key();
        meter_account.meter_type = meter_type;
        meter_account.status = MeterStatus::Active;
        meter_account.registered_at = Clock::get()?.unix_timestamp;
        meter_account.last_reading_at = 0;
        meter_account.total_generation = 0;
        meter_account.total_consumption = 0;
        
        // Update counters
        user_account.meter_count += 1;
        registry.meter_count += 1;
        
        emit!(MeterRegistered {
            meter_id: meter_id.clone(),
            owner: ctx.accounts.user_authority.key(),
            meter_type,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Update user status (admin only)
    pub fn update_user_status(
        ctx: Context<UpdateUserStatus>,
        new_status: UserStatus,
    ) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let registry = &ctx.accounts.registry;
        
        // Only registry authority can update user status
        require!(
            ctx.accounts.authority.key() == registry.authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        let old_status = user_account.status;
        user_account.status = new_status;
        
        emit!(UserStatusUpdated {
            user: user_account.authority,
            old_status,
            new_status,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Update meter reading (for oracles and authorized services)
    pub fn update_meter_reading(
        ctx: Context<UpdateMeterReading>,
        energy_generated: u64,
        energy_consumed: u64,
        reading_timestamp: i64,
    ) -> Result<()> {
        let meter_account = &mut ctx.accounts.meter_account;
        
        // Update meter data
        meter_account.last_reading_at = reading_timestamp;
        meter_account.total_generation += energy_generated;
        meter_account.total_consumption += energy_consumed;
        
        emit!(MeterReadingUpdated {
            meter_id: meter_account.meter_id.clone(),
            owner: meter_account.owner,
            energy_generated,
            energy_consumed,
            timestamp: reading_timestamp,
        });
        
        Ok(())
    }
    
    /// Verify if a user is valid and active
    pub fn is_valid_user(ctx: Context<IsValidUser>) -> Result<bool> {
        let user_account = &ctx.accounts.user_account;
        Ok(user_account.status == UserStatus::Active)
    }
    
    /// Verify if a meter is valid and active
    pub fn is_valid_meter(ctx: Context<IsValidMeter>) -> Result<bool> {
        let meter_account = &ctx.accounts.meter_account;
        Ok(meter_account.status == MeterStatus::Active)
    }

    pub fn assign_meter(ctx: Context<AssignMeter>, meter_id: String) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.meter_count += 1;
        msg!("Meter {} assigned", meter_id);
        Ok(())
    }
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Registry::INIT_SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, Registry>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user_type: UserType, location: String)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub registry: Account<'info, Registry>,
    
    #[account(
        init,
        payer = user_authority,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", user_authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(mut)]
    pub user_authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(meter_id: String)]
pub struct RegisterMeter<'info> {
    #[account(mut)]
    pub registry: Account<'info, Registry>,
    
    #[account(mut)]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(
        init,
        payer = user_authority,
        space = 8 + MeterAccount::INIT_SPACE,
        seeds = [b"meter", meter_id.as_bytes()],
        bump
    )]
    pub meter_account: Account<'info, MeterAccount>,
    
    #[account(mut)]
    pub user_authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateUserStatus<'info> {
    #[account(has_one = authority @ ErrorCode::UnauthorizedAuthority)]
    pub registry: Account<'info, Registry>,
    
    #[account(mut)]
    pub user_account: Account<'info, UserAccount>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateMeterReading<'info> {
    #[account(mut)]
    pub meter_account: Account<'info, MeterAccount>,
    
    pub oracle_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct IsValidUser<'info> {
    pub user_account: Account<'info, UserAccount>,
}

#[derive(Accounts)]
pub struct IsValidMeter<'info> {
    pub meter_account: Account<'info, MeterAccount>,
}

#[derive(Accounts)]
pub struct AssignMeter<'info> {
    #[account(mut)]
    pub registry: Account<'info, Registry>,
    pub authority: Signer<'info>,
}

// Data structs
#[account]
#[derive(InitSpace)]
pub struct Registry {
    pub authority: Pubkey,
    pub user_count: u64,
    pub meter_count: u64,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub authority: Pubkey,
    pub user_type: UserType,
    #[max_len(100)]
    pub location: String,
    pub status: UserStatus,
    pub registered_at: i64,
    pub meter_count: u32,
    // Backward compatibility field
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct MeterAccount {
    #[max_len(50)]
    pub meter_id: String,
    pub owner: Pubkey,
    pub meter_type: MeterType,
    pub status: MeterStatus,
    pub registered_at: i64,
    pub last_reading_at: i64,
    pub total_generation: u64,
    pub total_consumption: u64,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum UserType {
    Prosumer,
    Consumer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum UserStatus {
    Active,
    Suspended,
    Inactive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MeterType {
    Solar,
    Wind,
    Battery,
    Grid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MeterStatus {
    Active,
    Inactive,
    Maintenance,
}

// Events
#[event]
pub struct RegistryInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UserRegistered {
    pub user: Pubkey,
    pub user_type: UserType,
    pub location: String,
    pub timestamp: i64,
}

#[event]
pub struct MeterRegistered {
    pub meter_id: String,
    pub owner: Pubkey,
    pub meter_type: MeterType,
    pub timestamp: i64,
}

#[event]
pub struct UserStatusUpdated {
    pub user: Pubkey,
    pub old_status: UserStatus,
    pub new_status: UserStatus,
    pub timestamp: i64,
}

#[event]
pub struct MeterReadingUpdated {
    pub meter_id: String,
    pub owner: Pubkey,
    pub energy_generated: u64,
    pub energy_consumed: u64,
    pub timestamp: i64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized user")]
    UnauthorizedUser,
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("Invalid user status")]
    InvalidUserStatus,
    #[msg("Invalid meter status")]
    InvalidMeterStatus,
    #[msg("User not found")]
    UserNotFound,
    #[msg("Meter not found")]
    MeterNotFound,
}