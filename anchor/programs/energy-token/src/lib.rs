use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, Burn};

declare_id!("J61eiwojt9zA1TP6t9M9wEDmiDek4QNEY2HiAfunHs7");

#[program]
pub mod energy_token {
    use super::*;
    
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Energy token program initialized");
        Ok(())
    }
    
    /// Initialize the energy token program
    pub fn initialize_token(ctx: Context<InitializeToken>) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        token_info.authority = ctx.accounts.authority.key();
        token_info.mint = ctx.accounts.mint.key();
        token_info.total_supply = 0;
        token_info.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Token initialized with authority: {}", token_info.authority);
        
        Ok(())
    }
    
    /// Add a REC validator to the system
    pub fn add_rec_validator(
        ctx: Context<AddRecValidator>,
        validator_pubkey: Pubkey,
        authority_name: String,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        require!(
            ctx.accounts.authority.key() == token_info.authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        msg!("Adding REC validator: {}", validator_pubkey);
        
        Ok(())
    }
    
    /// Transfer energy tokens between accounts
    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.from_token_account.to_account_info(),
            to: ctx.accounts.to_token_account.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;
        
        msg!("Transferred {} tokens", amount);
        
        Ok(())
    }
    
    /// Burn energy tokens (for energy consumption)
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::burn(cpi_ctx, amount)?;
        
        let token_info = &mut ctx.accounts.token_info;
        token_info.total_supply = token_info.total_supply.saturating_sub(amount);
        
        msg!("Burned {} tokens", amount);
        
        Ok(())
    }
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TokenInfo::INIT_SPACE,
        seeds = [b"token_info"],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddRecValidator<'info> {
    #[account(mut, has_one = authority @ ErrorCode::UnauthorizedAuthority)]
    pub token_info: Account<'info, TokenInfo>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,
    
    pub from_authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Data structs
#[account]
#[derive(InitSpace)]
pub struct TokenInfo {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub created_at: i64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("Invalid meter")]
    InvalidMeter,
    #[msg("Insufficient token balance")]
    InsufficientBalance,
}