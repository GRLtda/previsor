// Market Engine Service (Frontend Mirror)
// Core share pricing calculations for prediction markets
// All calculations in integer centavos for precision

export interface TradeEstimate {
    shares: number;           // Quantity of shares received
    avgPriceCentavos: number; // Weighted average price per share (centavos)
    totalCost: number;        // Total cost in centavos (should equal input amount)
    priceImpact: number;      // Percentage price movement (0-100)
    newProbYes: number;       // Probability after trade
    newProbNo: number;        // Probability after trade
    slippageWarning: boolean; // True if priceImpact > 1%
}

export interface MarketState {
    qYes: number;
    qNo: number;
    liquidityB: number;
}

const SLIPPAGE_WARNING_THRESHOLD = 1; // 1% price impact
const SIMULATION_STEP_SIZE = 100;     // Centavos per step for slippage calculation

export class MarketEngine {

    // LMSR Math Helpers
    private getCost(qYes: number, qNo: number, b: number): number {
        if (b <= 0) return 0;
        const x1 = qYes / b;
        const x2 = qNo / b;
        const maxX = Math.max(x1, x2);
        return b * (maxX + Math.log(Math.exp(x1 - maxX) + Math.exp(x2 - maxX)));
    }

    private getSpotPrice(qTarget: number, qOther: number, b: number): number {
        if (b <= 0) return 0.5;
        const xTarget = qTarget / b;
        const xOther = qOther / b;
        const max = Math.max(xTarget, xOther);
        const num = Math.exp(xTarget - max);
        const den = Math.exp(xTarget - max) + Math.exp(xOther - max);
        return num / den;
    }

    private calculateBuyShares(amount: number, qTarget: number, qOther: number, b: number): number {
        const cOld = this.getCost(qTarget, qOther, b);
        const cNew = cOld + amount;
        const X = cNew / b;
        const Y = qOther / b;
        if (X <= Y) return 0;
        const qTargetNew = b * (X + Math.log(1 - Math.exp(Y - X)));
        const deltaQ = qTargetNew - qTarget;
        return deltaQ > 0 ? deltaQ : 0;
    }

    /**
     * Calculate current share prices based on LMSR state
     */
    calculateCurrentPrices(market: MarketState) {
        const b = market.liquidityB || 1000;
        const probYes = this.getSpotPrice(market.qYes, market.qNo, b);
        const probNo = this.getSpotPrice(market.qNo, market.qYes, b);

        return {
            priceYesCentavos: Math.round(probYes * 100),
            priceNoCentavos: Math.round(probNo * 100),
            probYes: Math.round(probYes * 10000) / 100,
            probNo: Math.round(probNo * 10000) / 100,
        };
    }

    /**
     * Calculate estimated payout for a given amount (LMSR Model)
     */
    calculatePayout(
        amount: number, // in centavos
        market: MarketState,
        side: 'YES' | 'NO'
    ): { payout: number; odds: number; shares: number; avgPriceCentavos: number; priceImpact: number } {
        if (amount <= 0) {
            return { payout: 0, odds: 0, shares: 0, avgPriceCentavos: 0, priceImpact: 0 };
        }

        const b = market.liquidityB || 1000;
        const qTarget = side === 'YES' ? market.qYes : market.qNo;
        const qOther = side === 'YES' ? market.qNo : market.qYes;

        const shares = this.calculateBuyShares(amount, qTarget, qOther, b);
        const payout = shares * 100; // 1 share = 100 centavos payout (if integer shares? No shares are float here)
        // Wait, payout is usually "Amount Returned". 
        // If shares are units of "R$1 payout". Payout = shares * 100 (centavos).

        const avgPrice = shares > 0 ? amount / shares : 0;
        const odds = avgPrice > 0 ? 100 / avgPrice : 0; // Decimal odds (e.g. 2.0)

        // Price Impact
        const initialSpot = this.getSpotPrice(qTarget, qOther, b);
        // New spot
        const newQTarget = qTarget + shares;
        const finalSpot = this.getSpotPrice(newQTarget, qOther, b);

        const priceImpact = initialSpot > 0
            ? Math.abs(((finalSpot - initialSpot) / initialSpot) * 100)
            : 0;

        return {
            payout: Math.floor(payout),
            odds: Math.round(odds * 100) / 100,
            shares,
            avgPriceCentavos: avgPrice,
            priceImpact: Math.round(priceImpact * 100) / 100
        };
    }

    /**
     * Get Net Invested Amount (TVL - Initial Subsidy)
     */
    getNetInvested(market: MarketState): number {
        const b = market.liquidityB || 1000;
        const costCurrent = this.getCost(market.qYes, market.qNo, b);
        const costInitial = b * Math.log(2);
        return Math.max(0, Math.floor(costCurrent - costInitial));
    }
}

export const marketEngine = new MarketEngine();

export const marketEngine = new MarketEngine();
