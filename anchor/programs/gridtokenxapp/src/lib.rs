#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe");

#[program]
pub mod gridtokenxapp {
    use super::*;

    pub fn close(_ctx: Context<CloseGridtokenxapp>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.gridtokenxapp.count = ctx.accounts.gridtokenxapp.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.gridtokenxapp.count = ctx.accounts.gridtokenxapp.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeGridtokenxapp>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.gridtokenxapp.count = value.clone();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGridtokenxapp<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Gridtokenxapp::INIT_SPACE,
  payer = payer
    )]
    pub gridtokenxapp: Account<'info, Gridtokenxapp>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseGridtokenxapp<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
    )]
    pub gridtokenxapp: Account<'info, Gridtokenxapp>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub gridtokenxapp: Account<'info, Gridtokenxapp>,
}

#[account]
#[derive(InitSpace)]
pub struct Gridtokenxapp {
    count: u8,
}
