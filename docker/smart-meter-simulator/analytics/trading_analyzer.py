#!/usr/bin/env python3

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TradingOpportunity:
    timestamp: datetime
    seller_meter: str
    buyer_meter: str
    energy_amount: float
    suggested_price: float
    distance_factor: float
    compatibility_score: float

class EnergyTradingAnalyzer:
    def __init__(self):
        self.timescale_url = os.getenv('TIMESCALE_URL', 
            'postgresql://timescale_user:timescale_password@localhost:5433/p2p_timeseries')
        self.output_dir = os.getenv('ANALYTICS_OUTPUT_DIR', './data/analytics')
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Connect to database
        try:
            self.conn = psycopg2.connect(self.timescale_url)
            logger.info("Connected to TimescaleDB for analytics")
        except Exception as e:
            logger.error(f"Failed to connect to TimescaleDB: {e}")
            self.conn = None

    def get_current_trading_opportunities(self) -> List[TradingOpportunity]:
        """Identify current P2P trading opportunities"""
        if not self.conn:
            return []
        
        opportunities = []
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Find surplus and deficit matches from the last hour
                cursor.execute("""
                    WITH surplus_meters AS (
                        SELECT DISTINCT ON (meter_id) 
                            meter_id, location, surplus_energy, max_sell_price, time
                        FROM energy_readings_enhanced
                        WHERE time >= NOW() - INTERVAL '1 hour'
                            AND surplus_energy > 0.5
                        ORDER BY meter_id, time DESC
                    ),
                    deficit_meters AS (
                        SELECT DISTINCT ON (meter_id) 
                            meter_id, location, deficit_energy, max_buy_price, time
                        FROM energy_readings_enhanced
                        WHERE time >= NOW() - INTERVAL '1 hour'
                            AND deficit_energy > 0.5
                        ORDER BY meter_id, time DESC
                    )
                    SELECT 
                        s.meter_id as seller_meter,
                        d.meter_id as buyer_meter,
                        s.location as seller_location,
                        d.location as buyer_location,
                        LEAST(s.surplus_energy, d.deficit_energy) as energy_amount,
                        s.max_sell_price,
                        d.max_buy_price,
                        s.time as surplus_time,
                        d.time as deficit_time
                    FROM surplus_meters s
                    CROSS JOIN deficit_meters d
                    WHERE s.meter_id != d.meter_id
                        AND s.max_sell_price <= d.max_buy_price
                        AND ABS(EXTRACT(EPOCH FROM (s.time - d.time))) < 1800
                    ORDER BY 
                        (d.max_buy_price - s.max_sell_price) DESC,
                        energy_amount DESC
                    LIMIT 50
                """)
                
                matches = cursor.fetchall()
                
                for match in matches:
                    # Calculate suggested price (midpoint)
                    suggested_price = (match['max_sell_price'] + match['max_buy_price']) / 2
                    
                    # Simple distance factor (would use actual coordinates in production)
                    distance_factor = 1.0  # Placeholder
                    
                    # Compatibility score based on price difference and energy amount
                    price_spread = match['max_buy_price'] - match['max_sell_price']
                    compatibility_score = min(1.0, (price_spread * 10 + match['energy_amount']) / 10)
                    
                    opportunity = TradingOpportunity(
                        timestamp=match['surplus_time'],
                        seller_meter=match['seller_meter'],
                        buyer_meter=match['buyer_meter'],
                        energy_amount=match['energy_amount'],
                        suggested_price=suggested_price,
                        distance_factor=distance_factor,
                        compatibility_score=compatibility_score
                    )
                    
                    opportunities.append(opportunity)
        
        except Exception as e:
            logger.error(f"Failed to analyze trading opportunities: {e}")
        
        return opportunities

    def generate_energy_balance_report(self, hours_back: int = 24) -> Dict[str, Any]:
        """Generate comprehensive energy balance report"""
        if not self.conn:
            return {}
        
        report = {}
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Overall energy balance
                cursor.execute("""
                    SELECT 
                        SUM(energy_generated) as total_generation,
                        SUM(energy_consumed) as total_consumption,
                        SUM(surplus_energy) as total_surplus,
                        SUM(deficit_energy) as total_deficit,
                        AVG(battery_level) as avg_battery_level,
                        COUNT(DISTINCT meter_id) as active_meters,
                        COUNT(*) as total_readings
                    FROM energy_readings_enhanced
                    WHERE time >= NOW() - INTERVAL '%s hours'
                """, (hours_back,))
                
                balance = cursor.fetchone()
                
                # Generation by meter type
                cursor.execute("""
                    SELECT 
                        meter_type,
                        SUM(energy_generated) as total_generation,
                        SUM(energy_consumed) as total_consumption,
                        COUNT(DISTINCT meter_id) as meter_count,
                        AVG(energy_generated) as avg_generation_per_reading,
                        AVG(energy_consumed) as avg_consumption_per_reading
                    FROM energy_readings_enhanced
                    WHERE time >= NOW() - INTERVAL '%s hours'
                    GROUP BY meter_type
                    ORDER BY total_generation DESC
                """, (hours_back,))
                
                generation_by_type = cursor.fetchall()
                
                # Weather impact
                cursor.execute("""
                    SELECT 
                        weather_condition,
                        AVG(energy_generated) as avg_generation,
                        AVG(irradiance) as avg_irradiance,
                        COUNT(*) as reading_count
                    FROM energy_readings_enhanced
                    WHERE time >= NOW() - INTERVAL '%s hours'
                        AND energy_generated > 0
                    GROUP BY weather_condition
                    ORDER BY avg_generation DESC
                """, (hours_back,))
                
                weather_impact = cursor.fetchall()
                
                # Trading potential
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_surplus_instances,
                        COUNT(*) FILTER (WHERE deficit_energy > 0) as total_deficit_instances,
                        SUM(surplus_energy) as total_available_energy,
                        SUM(deficit_energy) as total_needed_energy,
                        AVG(max_sell_price) as avg_sell_price,
                        AVG(max_buy_price) as avg_buy_price
                    FROM energy_readings_enhanced
                    WHERE time >= NOW() - INTERVAL '%s hours'
                        AND (surplus_energy > 0 OR deficit_energy > 0)
                """, (hours_back,))
                
                trading_potential = cursor.fetchone()
                
                report = {
                    'timestamp': datetime.now().isoformat(),
                    'analysis_period_hours': hours_back,
                    'overall_balance': dict(balance) if balance else {},
                    'generation_by_type': [dict(row) for row in generation_by_type],
                    'weather_impact': [dict(row) for row in weather_impact],
                    'trading_potential': dict(trading_potential) if trading_potential else {},
                    'self_sufficiency_ratio': 0,
                    'trading_efficiency_score': 0
                }
                
                # Calculate derived metrics
                if balance:
                    total_gen = float(balance.get('total_generation', 0))
                    total_con = float(balance.get('total_consumption', 0))
                    
                    if total_con > 0:
                        report['self_sufficiency_ratio'] = min(1.0, total_gen / total_con)
                
                if trading_potential:
                    surplus = float(trading_potential.get('total_available_energy', 0))
                    deficit = float(trading_potential.get('total_needed_energy', 0))
                    
                    if surplus > 0 and deficit > 0:
                        tradeable_amount = min(surplus, deficit)
                        total_need = max(surplus, deficit)
                        report['trading_efficiency_score'] = tradeable_amount / total_need
        
        except Exception as e:
            logger.error(f"Failed to generate energy balance report: {e}")
        
        return report

    def create_trading_visualization(self, hours_back: int = 24):
        """Create trading opportunity visualization"""
        if not self.conn:
            return
        
        try:
            # Fetch data for visualization
            df = pd.read_sql("""
                SELECT 
                    time_bucket('1 hour', time) as hour,
                    SUM(surplus_energy) as total_surplus,
                    SUM(deficit_energy) as total_deficit,
                    AVG(max_sell_price) as avg_sell_price,
                    AVG(max_buy_price) as avg_buy_price,
                    COUNT(DISTINCT meter_id) as active_meters
                FROM energy_readings_enhanced
                WHERE time >= NOW() - INTERVAL '%s hours'
                GROUP BY hour
                ORDER BY hour
            """ % hours_back, self.conn)
            
            if df.empty:
                logger.warning("No data available for visualization")
                return
            
            # Create subplot figure
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle('P2P Energy Trading Analysis', fontsize=16)
            
            # Plot 1: Energy Supply and Demand
            ax1.plot(df['hour'], df['total_surplus'], label='Energy Surplus', color='green', marker='o')
            ax1.plot(df['hour'], df['total_deficit'], label='Energy Deficit', color='red', marker='s')
            ax1.set_title('Energy Supply vs Demand')
            ax1.set_ylabel('Energy (kWh)')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
            ax1.tick_params(axis='x', rotation=45)
            
            # Plot 2: Trading Prices
            ax2.plot(df['hour'], df['avg_sell_price'], label='Avg Sell Price', color='blue', marker='o')
            ax2.plot(df['hour'], df['avg_buy_price'], label='Avg Buy Price', color='orange', marker='s')
            ax2.fill_between(df['hour'], df['avg_sell_price'], df['avg_buy_price'], 
                           alpha=0.3, color='yellow', label='Price Spread')
            ax2.set_title('Trading Price Trends')
            ax2.set_ylabel('Price (USD/kWh)')
            ax2.legend()
            ax2.grid(True, alpha=0.3)
            ax2.tick_params(axis='x', rotation=45)
            
            # Plot 3: Trading Opportunity Score
            df['trading_opportunity'] = df.apply(lambda row: 
                min(row['total_surplus'], row['total_deficit']) / max(row['total_surplus'] + row['total_deficit'], 0.001), axis=1)
            ax3.bar(df['hour'], df['trading_opportunity'], color='purple', alpha=0.7)
            ax3.set_title('Trading Opportunity Score')
            ax3.set_ylabel('Opportunity Score (0-1)')
            ax3.grid(True, alpha=0.3)
            ax3.tick_params(axis='x', rotation=45)
            
            # Plot 4: Active Meters
            ax4.plot(df['hour'], df['active_meters'], label='Active Meters', color='darkgreen', marker='d')
            ax4.set_title('Meter Participation')
            ax4.set_ylabel('Number of Active Meters')
            ax4.grid(True, alpha=0.3)
            ax4.tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            
            # Save the plot
            output_file = os.path.join(self.output_dir, f'trading_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            logger.info(f"Trading visualization saved to {output_file}")
            plt.close()
            
        except Exception as e:
            logger.error(f"Failed to create trading visualization: {e}")

    def generate_rec_report(self, hours_back: int = 24) -> Dict[str, Any]:
        """Generate Renewable Energy Certificate report"""
        if not self.conn:
            return {}
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # REC generation summary
                cursor.execute("""
                    SELECT 
                        COUNT(*) FILTER (WHERE rec_eligible = true) as rec_eligible_readings,
                        SUM(energy_generated) FILTER (WHERE rec_eligible = true) as total_rec_energy,
                        SUM(carbon_offset) as total_carbon_offset,
                        COUNT(DISTINCT meter_id) FILTER (WHERE rec_eligible = true) as rec_generating_meters,
                        AVG(irradiance) FILTER (WHERE rec_eligible = true) as avg_irradiance,
                        mode() WITHIN GROUP (ORDER BY weather_condition) as dominant_weather
                    FROM energy_readings_enhanced
                    WHERE time >= NOW() - INTERVAL '%s hours'
                """ % hours_back)
                
                rec_summary = cursor.fetchone()
                
                # REC by meter
                cursor.execute("""
                    SELECT 
                        meter_id,
                        location,
                        SUM(energy_generated) as total_generation,
                        SUM(carbon_offset) as total_offset,
                        COUNT(*) as rec_readings
                    FROM energy_readings_enhanced
                    WHERE time >= NOW() - INTERVAL '%s hours'
                        AND rec_eligible = true
                    GROUP BY meter_id, location
                    ORDER BY total_generation DESC
                """ % hours_back)
                
                rec_by_meter = cursor.fetchall()
                
                return {
                    'timestamp': datetime.now().isoformat(),
                    'analysis_period_hours': hours_back,
                    'rec_summary': dict(rec_summary) if rec_summary else {},
                    'rec_by_meter': [dict(row) for row in rec_by_meter]
                }
                
        except Exception as e:
            logger.error(f"Failed to generate REC report: {e}")
            return {}

    def run_analytics_cycle(self):
        """Run a complete analytics cycle"""
        logger.info("Starting analytics cycle...")
        
        # Generate trading opportunities
        opportunities = self.get_current_trading_opportunities()
        logger.info(f"Found {len(opportunities)} trading opportunities")
        
        # Generate energy balance report
        balance_report = self.generate_energy_balance_report(hours_back=24)
        
        # Generate REC report
        rec_report = self.generate_rec_report(hours_back=24)
        
        # Create visualizations
        self.create_trading_visualization(hours_back=24)
        
        # Save reports to files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save trading opportunities
        if opportunities:
            opportunities_file = os.path.join(self.output_dir, f'trading_opportunities_{timestamp}.json')
            with open(opportunities_file, 'w') as f:
                json.dump([{
                    'timestamp': op.timestamp.isoformat(),
                    'seller_meter': op.seller_meter,
                    'buyer_meter': op.buyer_meter,
                    'energy_amount': op.energy_amount,
                    'suggested_price': op.suggested_price,
                    'compatibility_score': op.compatibility_score
                } for op in opportunities], f, indent=2)
            logger.info(f"Trading opportunities saved to {opportunities_file}")
        
        # Save balance report
        if balance_report:
            balance_file = os.path.join(self.output_dir, f'energy_balance_{timestamp}.json')
            with open(balance_file, 'w') as f:
                json.dump(balance_report, f, indent=2, default=str)
            logger.info(f"Energy balance report saved to {balance_file}")
        
        # Save REC report
        if rec_report:
            rec_file = os.path.join(self.output_dir, f'rec_report_{timestamp}.json')
            with open(rec_file, 'w') as f:
                json.dump(rec_report, f, indent=2, default=str)
            logger.info(f"REC report saved to {rec_file}")
        
        # Print summary
        print(f"\n{'='*60}")
        print("Energy Trading Analytics Summary")
        print(f"{'='*60}")
        print(f"Analysis Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Trading Opportunities: {len(opportunities)}")
        
        if balance_report:
            overall = balance_report.get('overall_balance', {})
            print(f"Total Generation: {overall.get('total_generation', 0):.2f} kWh")
            print(f"Total Consumption: {overall.get('total_consumption', 0):.2f} kWh")
            print(f"Self-Sufficiency: {balance_report.get('self_sufficiency_ratio', 0):.2%}")
            print(f"Trading Efficiency: {balance_report.get('trading_efficiency_score', 0):.2%}")
        
        if rec_report:
            rec_summary = rec_report.get('rec_summary', {})
            print(f"REC Energy Generated: {rec_summary.get('total_rec_energy', 0):.2f} kWh")
            print(f"Carbon Offset: {rec_summary.get('total_carbon_offset', 0):.2f} kg CO2")
        
        print(f"{'='*60}")

if __name__ == "__main__":
    analyzer = EnergyTradingAnalyzer()
    analyzer.run_analytics_cycle()