use anchor_lang::prelude::*;

declare_id!("Dy8JFn95L1E7NoUkXbFQtW1kGR7Ja21CkNcirNgv4ghe");

#[program]
pub mod governance {
    use super::*;
    
    /// Initialize PoA with single Engineering Department authority for ERC
    pub fn initialize_poa(ctx: Context<InitializePoa>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let clock = Clock::get()?;
        
        poa_config.authority = ctx.accounts.authority.key();
        poa_config.authority_name = "University Engineering Department".to_string();
        poa_config.contact_info = "engineering_erc@utcc.ac.th".to_string();
        poa_config.emergency_paused = false;
        poa_config.emergency_timestamp = None;
        poa_config.emergency_reason = None;
        poa_config.created_at = clock.unix_timestamp;
        poa_config.last_updated = clock.unix_timestamp;
        poa_config.erc_validation_enabled = true;
        poa_config.max_erc_amount = 1_000_000; // 1M kWh max per ERC
        poa_config.total_ercs_issued = 0;
        poa_config.total_ercs_validated = 0;
        poa_config.version = 1;
        poa_config.delegation_enabled = false;
        poa_config.oracle_authority = None;
        poa_config.min_energy_amount = 100; // 100 kWh minimum
        poa_config.erc_validity_period = 31_536_000; // 1 year in seconds
        poa_config.maintenance_mode = false;
        
        emit!(PoAInitialized {
            authority: ctx.accounts.authority.key(),
            authority_name: "University Engineering Department".to_string(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("PoA governance initialized - Engineering Department as sole ERC authority");
        msg!("Max ERC amount: {} kWh, Min amount: {} kWh", poa_config.max_erc_amount, poa_config.min_energy_amount);
        Ok(())
    }

    /// Emergency pause functionality - Engineering Department only
    pub fn emergency_pause(ctx: Context<EmergencyControl>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(!poa_config.emergency_paused, GovernanceError::AlreadyPaused);
        
        poa_config.emergency_paused = true;
        poa_config.emergency_timestamp = Some(Clock::get()?.unix_timestamp);
        
        emit!(EmergencyPauseActivated {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Emergency pause activated by Engineering Department");
        Ok(())
    }

    /// Emergency unpause functionality - Engineering Department only
    pub fn emergency_unpause(ctx: Context<EmergencyControl>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        
        require!(poa_config.emergency_paused, GovernanceError::NotPaused);
        
        poa_config.emergency_paused = false;
        poa_config.emergency_timestamp = None;
        
        emit!(EmergencyPauseDeactivated {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Emergency pause deactivated by Engineering Department");
        Ok(())
    }

    /// Issue ERC (Energy Renewable Certificate) - Engineering Department only
    pub fn issue_erc(
        ctx: Context<IssueErc>,
        certificate_id: String,
        energy_amount: u64,
        renewable_source: String,
        validation_data: String,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let erc_certificate = &mut ctx.accounts.erc_certificate;
        let clock = Clock::get()?;
        
        require!(!poa_config.emergency_paused, GovernanceError::SystemPaused);
        require!(!poa_config.maintenance_mode, GovernanceError::MaintenanceMode);
        require!(poa_config.erc_validation_enabled, GovernanceError::ErcValidationDisabled);
        require!(energy_amount >= poa_config.min_energy_amount, GovernanceError::BelowMinimumEnergy);
        require!(energy_amount <= poa_config.max_erc_amount, GovernanceError::ExceedsMaximumEnergy);
        require!(certificate_id.len() <= 64, GovernanceError::CertificateIdTooLong);
        require!(renewable_source.len() <= 64, GovernanceError::SourceNameTooLong);
        
        erc_certificate.certificate_id = certificate_id.clone();
        erc_certificate.authority = ctx.accounts.authority.key();
        erc_certificate.energy_amount = energy_amount;
        erc_certificate.renewable_source = renewable_source.clone();
        erc_certificate.validation_data = validation_data;
        erc_certificate.issued_at = clock.unix_timestamp;
        erc_certificate.status = ErcStatus::Valid;
        erc_certificate.validated_for_trading = false;
        erc_certificate.expires_at = Some(clock.unix_timestamp + poa_config.erc_validity_period);
        
        // Update statistics
        poa_config.total_ercs_issued = poa_config.total_ercs_issued.saturating_add(1);
        poa_config.last_updated = clock.unix_timestamp;
        
        emit!(ErcIssued {
            certificate_id,
            authority: ctx.accounts.authority.key(),
            energy_amount,
            renewable_source,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("ERC issued by Engineering Department: {} kWh from {} (ID: {})", 
             energy_amount, erc_certificate.renewable_source, erc_certificate.certificate_id);
        Ok(())
    }

    /// Validate ERC for trading - Engineering Department only
    pub fn validate_erc_for_trading(ctx: Context<ValidateErc>) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let erc_certificate = &mut ctx.accounts.erc_certificate;
        let clock = Clock::get()?;
        
        require!(!poa_config.emergency_paused, GovernanceError::SystemPaused);
        require!(!poa_config.maintenance_mode, GovernanceError::MaintenanceMode);
        require!(erc_certificate.status == ErcStatus::Valid, GovernanceError::InvalidErcStatus);
        require!(!erc_certificate.validated_for_trading, GovernanceError::AlreadyValidated);
        
        // Check expiration
        if let Some(expires_at) = erc_certificate.expires_at {
            require!(clock.unix_timestamp < expires_at, GovernanceError::ErcExpired);
        }
        
        erc_certificate.validated_for_trading = true;
        erc_certificate.trading_validated_at = Some(clock.unix_timestamp);
        
        // Update statistics
        poa_config.total_ercs_validated = poa_config.total_ercs_validated.saturating_add(1);
        poa_config.last_updated = clock.unix_timestamp;
        
        emit!(ErcValidatedForTrading {
            certificate_id: erc_certificate.certificate_id.clone(),
            authority: ctx.accounts.authority.key(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("ERC validated for trading by Engineering Department (ID: {})", erc_certificate.certificate_id);
        Ok(())
    }

    /// Update governance configuration - Engineering Department only
    pub fn update_governance_config(
        ctx: Context<UpdateGovernanceConfig>,
        erc_validation_enabled: bool,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let clock = Clock::get()?;
        
        let old_enabled = poa_config.erc_validation_enabled;
        poa_config.erc_validation_enabled = erc_validation_enabled;
        poa_config.last_updated = clock.unix_timestamp;
        
        emit!(GovernanceConfigUpdated {
            authority: ctx.accounts.authority.key(),
            erc_validation_enabled,
            old_enabled,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Governance configuration updated - ERC validation: {}", erc_validation_enabled);
        Ok(())
    }

    /// Set maintenance mode - Engineering Department only
    pub fn set_maintenance_mode(
        ctx: Context<UpdateGovernanceConfig>,
        maintenance_enabled: bool,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let clock = Clock::get()?;
        
        poa_config.maintenance_mode = maintenance_enabled;
        poa_config.last_updated = clock.unix_timestamp;
        
        emit!(MaintenanceModeUpdated {
            authority: ctx.accounts.authority.key(),
            maintenance_enabled,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Maintenance mode {}", if maintenance_enabled { "enabled" } else { "disabled" });
        Ok(())
    }

    /// Update ERC limits - Engineering Department only
    pub fn update_erc_limits(
        ctx: Context<UpdateGovernanceConfig>,
        min_energy_amount: u64,
        max_erc_amount: u64,
        erc_validity_period: i64,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let clock = Clock::get()?;
        
        require!(min_energy_amount > 0, GovernanceError::InvalidMinimumEnergy);
        require!(max_erc_amount > min_energy_amount, GovernanceError::InvalidMaximumEnergy);
        require!(erc_validity_period > 0, GovernanceError::InvalidValidityPeriod);
        
        let old_min = poa_config.min_energy_amount;
        let old_max = poa_config.max_erc_amount;
        let old_validity = poa_config.erc_validity_period;
        
        poa_config.min_energy_amount = min_energy_amount;
        poa_config.max_erc_amount = max_erc_amount;
        poa_config.erc_validity_period = erc_validity_period;
        poa_config.last_updated = clock.unix_timestamp;
        
        emit!(ErcLimitsUpdated {
            authority: ctx.accounts.authority.key(),
            old_min,
            new_min: min_energy_amount,
            old_max,
            new_max: max_erc_amount,
            old_validity,
            new_validity: erc_validity_period,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("ERC limits updated - Min: {} kWh, Max: {} kWh, Validity: {} seconds", 
             min_energy_amount, max_erc_amount, erc_validity_period);
        Ok(())
    }

    /// Update authority contact info - Engineering Department only
    pub fn update_authority_info(
        ctx: Context<UpdateGovernanceConfig>,
        contact_info: String,
    ) -> Result<()> {
        let poa_config = &mut ctx.accounts.poa_config;
        let clock = Clock::get()?;
        
        require!(contact_info.len() <= 128, GovernanceError::ContactInfoTooLong);
        
        let old_contact = poa_config.contact_info.clone();
        poa_config.contact_info = contact_info.clone();
        poa_config.last_updated = clock.unix_timestamp;
        
        emit!(AuthorityInfoUpdated {
            authority: ctx.accounts.authority.key(),
            old_contact,
            new_contact: contact_info,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Authority contact information updated");
        Ok(())
    }

    /// Get governance statistics
    pub fn get_governance_stats(ctx: Context<GetGovernanceStats>) -> Result<GovernanceStats> {
        let poa_config = &ctx.accounts.poa_config;
        
        Ok(GovernanceStats {
            total_ercs_issued: poa_config.total_ercs_issued,
            total_ercs_validated: poa_config.total_ercs_validated,
            erc_validation_enabled: poa_config.erc_validation_enabled,
            emergency_paused: poa_config.emergency_paused,
            maintenance_mode: poa_config.maintenance_mode,
            min_energy_amount: poa_config.min_energy_amount,
            max_erc_amount: poa_config.max_erc_amount,
            erc_validity_period: poa_config.erc_validity_period,
            created_at: poa_config.created_at,
            last_updated: poa_config.last_updated,
        })
    }
}

// Account structures for single authority PoA
#[derive(Accounts)]
pub struct InitializePoa<'info> {
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
pub struct EmergencyControl<'info> {
    #[account(
        mut,
        seeds = [b"poa_config"],
        bump,
        has_one = authority @ GovernanceError::UnauthorizedAuthority
    )]
    pub poa_config: Account<'info, PoAConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(certificate_id: String)]
pub struct IssueErc<'info> {
    #[account(
        seeds = [b"poa_config"],
        bump,
        has_one = authority @ GovernanceError::UnauthorizedAuthority
    )]
    pub poa_config: Account<'info, PoAConfig>,
    #[account(
        init,
        payer = authority,
        space = 8 + ErcCertificate::LEN,
        seeds = [b"erc_certificate", certificate_id.as_bytes()],
        bump
    )]
    pub erc_certificate: Account<'info, ErcCertificate>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateErc<'info> {
    #[account(
        seeds = [b"poa_config"],
        bump,
        has_one = authority @ GovernanceError::UnauthorizedAuthority
    )]
    pub poa_config: Account<'info, PoAConfig>,
    #[account(
        mut,
        seeds = [b"erc_certificate", erc_certificate.certificate_id.as_bytes()],
        bump
    )]
    pub erc_certificate: Account<'info, ErcCertificate>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateGovernanceConfig<'info> {
    #[account(
        mut,
        seeds = [b"poa_config"],
        bump,
        has_one = authority @ GovernanceError::UnauthorizedAuthority
    )]
    pub poa_config: Account<'info, PoAConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetGovernanceStats<'info> {
    #[account(
        seeds = [b"poa_config"],
        bump
    )]
    pub poa_config: Account<'info, PoAConfig>,
}

// Data structures for single authority PoA
#[account]
pub struct PoAConfig {
    /// Single authority - Engineering Department
    pub authority: Pubkey,
    /// Authority name for identification
    pub authority_name: String,
    /// Department contact information
    pub contact_info: String,
    /// Emergency pause status
    pub emergency_paused: bool,
    /// Emergency pause timestamp
    pub emergency_timestamp: Option<i64>,
    /// Emergency pause reason
    pub emergency_reason: Option<String>,
    /// When governance was initialized
    pub created_at: i64,
    /// Last updated timestamp
    pub last_updated: i64,
    /// Whether ERC validation is enabled
    pub erc_validation_enabled: bool,
    /// Maximum ERC amount that can be issued per transaction
    pub max_erc_amount: u64,
    /// Total ERCs issued
    pub total_ercs_issued: u64,
    /// Total ERCs validated for trading
    pub total_ercs_validated: u64,
    /// Governance version for upgrades
    pub version: u8,
    /// Whether the authority can delegate ERC validation
    pub delegation_enabled: bool,
    /// Oracle authority for AMI data validation
    pub oracle_authority: Option<Pubkey>,
    /// Minimum energy amount for ERC issuance (kWh)
    pub min_energy_amount: u64,
    /// ERC certificate validity period (seconds)
    pub erc_validity_period: i64,
    /// System maintenance mode
    pub maintenance_mode: bool,
}

impl PoAConfig {
    pub const LEN: usize = 
        32 +    // authority
        64 +    // authority_name
        128 +   // contact_info
        1 +     // emergency_paused
        9 +     // emergency_timestamp (Option<i64>)
        132 +   // emergency_reason (Option<String>)
        8 +     // created_at
        8 +     // last_updated
        1 +     // erc_validation_enabled
        8 +     // max_erc_amount
        8 +     // total_ercs_issued
        8 +     // total_ercs_validated
        1 +     // version
        1 +     // delegation_enabled
        33 +    // oracle_authority (Option<Pubkey>)
        8 +     // min_energy_amount
        8 +     // erc_validity_period
        1;      // maintenance_mode
}

#[account]
pub struct ErcCertificate {
    /// Unique certificate identifier
    pub certificate_id: String,
    /// Issuing authority (Engineering Department)
    pub authority: Pubkey,
    /// Amount of renewable energy (kWh)
    pub energy_amount: u64,
    /// Source of renewable energy (solar, wind, etc.)
    pub renewable_source: String,
    /// Additional validation data
    pub validation_data: String,
    /// When the certificate was issued
    pub issued_at: i64,
    /// When the certificate expires
    pub expires_at: Option<i64>,
    /// Current status of the certificate
    pub status: ErcStatus,
    /// Whether validated for trading
    pub validated_for_trading: bool,
    /// When validated for trading
    pub trading_validated_at: Option<i64>,
}

impl ErcCertificate {
    pub const LEN: usize = 64 + 32 + 8 + 64 + 256 + 8 + 9 + 1 + 1 + 9;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ErcStatus {
    Valid,
    Expired,
    Revoked,
    Pending,
}

// Data structure for governance statistics
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GovernanceStats {
    pub total_ercs_issued: u64,
    pub total_ercs_validated: u64,
    pub erc_validation_enabled: bool,
    pub emergency_paused: bool,
    pub maintenance_mode: bool,
    pub min_energy_amount: u64,
    pub max_erc_amount: u64,
    pub erc_validity_period: i64,
    pub created_at: i64,
    pub last_updated: i64,
}

// Events for single authority PoA
#[event]
pub struct PoAInitialized {
    pub authority: Pubkey,
    pub authority_name: String,
    pub timestamp: i64,
}

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
pub struct ErcIssued {
    pub certificate_id: String,
    pub authority: Pubkey,
    pub energy_amount: u64,
    pub renewable_source: String,
    pub timestamp: i64,
}

#[event]
pub struct ErcValidatedForTrading {
    pub certificate_id: String,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GovernanceConfigUpdated {
    pub authority: Pubkey,
    pub erc_validation_enabled: bool,
    pub old_enabled: bool,
    pub timestamp: i64,
}

#[event]
pub struct MaintenanceModeUpdated {
    pub authority: Pubkey,
    pub maintenance_enabled: bool,
    pub timestamp: i64,
}

#[event]
pub struct ErcLimitsUpdated {
    pub authority: Pubkey,
    pub old_min: u64,
    pub new_min: u64,
    pub old_max: u64,
    pub new_max: u64,
    pub old_validity: i64,
    pub new_validity: i64,
    pub timestamp: i64,
}

#[event]
pub struct AuthorityInfoUpdated {
    pub authority: Pubkey,
    pub old_contact: String,
    pub new_contact: String,
    pub timestamp: i64,
}

// Error codes for single authority PoA
#[error_code]
pub enum GovernanceError {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("System is already paused")]
    AlreadyPaused,
    #[msg("System is not paused")]
    NotPaused,
    #[msg("System is currently paused")]
    SystemPaused,
    #[msg("System is in maintenance mode")]
    MaintenanceMode,
    #[msg("ERC validation is disabled")]
    ErcValidationDisabled,
    #[msg("Invalid ERC status")]
    InvalidErcStatus,
    #[msg("ERC already validated")]
    AlreadyValidated,
    #[msg("Energy amount below minimum required")]
    BelowMinimumEnergy,
    #[msg("Energy amount exceeds maximum allowed")]
    ExceedsMaximumEnergy,
    #[msg("Certificate ID too long")]
    CertificateIdTooLong,
    #[msg("Renewable source name too long")]
    SourceNameTooLong,
    #[msg("ERC certificate has expired")]
    ErcExpired,
    #[msg("Invalid minimum energy amount")]
    InvalidMinimumEnergy,
    #[msg("Invalid maximum energy amount")]
    InvalidMaximumEnergy,
    #[msg("Invalid validity period")]
    InvalidValidityPeriod,
    #[msg("Contact information too long")]
    ContactInfoTooLong,
}