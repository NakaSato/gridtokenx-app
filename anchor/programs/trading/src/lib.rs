use anchor_lang::prelude::*;

declare_id!("UbU6TWh6YP4kYQuj8t7xiNg65NdEQF9kfAKa4aS85iS");

#[program]
pub mod trading {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Trading program initialized");
        Ok(())
    }
    
    /// Initialize the trading market
    pub fn initialize_market(ctx: Context<InitializeMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.active_orders = 0;
        market.total_volume = 0;
        market.total_trades = 0;
        market.created_at = Clock::get()?.unix_timestamp;
        market.clearing_enabled = true;
        market.market_fee_bps = 25; // 0.25% fee
        
        emit!(MarketInitialized {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Create a sell order for energy
    pub fn create_sell_order(
        _ctx: Context<CreateSellOrder>,
        energy_amount: u64,
        price_per_kwh: u64,
    ) -> Result<()> {
        msg!(
            "Creating sell order - Amount: {} kWh, Price: {} tokens/kWh",
            energy_amount,
            price_per_kwh
        );
        Ok(())
    }
    
    /// Create a buy order for energy
    pub fn create_buy_order(
        _ctx: Context<CreateBuyOrder>,
        energy_amount: u64,
        max_price_per_kwh: u64,
    ) -> Result<()> {
        msg!(
            "Creating buy order - Amount: {} kWh, Max Price: {} tokens/kWh",
            energy_amount,
            max_price_per_kwh
        );
        Ok(())
    }
    
    /// Match a buy order with a sell order
    pub fn match_orders(_ctx: Context<MatchOrders>) -> Result<()> {
        msg!("Matching orders");
        Ok(())
    }
    
    /// Cancel an active order
    pub fn cancel_order(_ctx: Context<CancelOrder>, order_id: u64) -> Result<()> {
        msg!("Cancelling order: {}", order_id);
        Ok(())
    }
    
    /// Update market parameters (admin only)
    pub fn update_market_params(
        ctx: Context<UpdateMarketParams>,
        market_fee_bps: u16,
        clearing_enabled: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(
            ctx.accounts.authority.key() == market.authority,
            ErrorCode::UnauthorizedAuthority
        );
        
        market.market_fee_bps = market_fee_bps;
        market.clearing_enabled = clearing_enabled;
        
        emit!(MarketParamsUpdated {
            authority: ctx.accounts.authority.key(),
            market_fee_bps,
            clearing_enabled,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market"],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateSellOrder<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateBuyOrder<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MatchOrders<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateMarketParams<'info> {
    #[account(mut, has_one = authority @ ErrorCode::UnauthorizedAuthority)]
    pub market: Account<'info, Market>,
    
    pub authority: Signer<'info>,
}

// Data structs
#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub active_orders: u64,
    pub total_volume: u64,
    pub total_trades: u64,
    pub created_at: i64,
    pub clearing_enabled: bool,
    pub market_fee_bps: u16,
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub filled_amount: u64,
    pub price_per_kwh: u64,
    pub order_type: OrderType,
    pub status: OrderStatus,
    pub created_at: i64,
    pub expires_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct TradeRecord {
    pub sell_order: Pubkey,
    pub buy_order: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub price_per_kwh: u64,
    pub total_value: u64,
    pub fee_amount: u64,
    pub executed_at: i64,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum OrderType {
    Sell,
    Buy,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum OrderStatus {
    Active,
    PartiallyFilled,
    Completed,
    Cancelled,
    Expired,
}

// Events
#[event]
pub struct MarketInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SellOrderCreated {
    pub seller: Pubkey,
    pub order_id: Pubkey,
    pub amount: u64,
    pub price_per_kwh: u64,
    pub timestamp: i64,
}

#[event]
pub struct BuyOrderCreated {
    pub buyer: Pubkey,
    pub order_id: Pubkey,
    pub amount: u64,
    pub price_per_kwh: u64,
    pub timestamp: i64,
}

#[event]
pub struct OrderMatched {
    pub sell_order: Pubkey,
    pub buy_order: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub price: u64,
    pub total_value: u64,
    pub fee_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct OrderCancelled {
    pub order_id: Pubkey,
    pub user: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MarketParamsUpdated {
    pub authority: Pubkey,
    pub market_fee_bps: u16,
    pub clearing_enabled: bool,
    pub timestamp: i64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Inactive sell order")]
    InactiveSellOrder,
    #[msg("Inactive buy order")]
    InactiveBuyOrder,
    #[msg("Price mismatch")]
    PriceMismatch,
    #[msg("Order not cancellable")]
    OrderNotCancellable,
    #[msg("Insufficient escrow balance")]
    InsufficientEscrowBalance,
}