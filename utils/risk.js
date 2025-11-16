// utils/risk.js

/**
 * ATR 驱动 + 风控版仓位计算
 *
 * 已知：
 * - equity: 总本金（U）
 * - riskPercent: 单笔风险占比（%）
 * - leverage: 杠杆倍数
 * - entryPrice: 开仓价
 * - stopLossPrice: 止损价（由 ATR 决定）
 *
 * 返回：
 * - 风险金额、止损距离、名义仓位、数量等
 */
export function calcPositionSize({ equity, riskPercent, leverage, entryPrice, stopLossPrice }) {
    if (
        !equity ||
        equity <= 0 ||
        !riskPercent ||
        riskPercent <= 0 ||
        !leverage ||
        leverage <= 0 ||
        !entryPrice ||
        entryPrice <= 0 ||
        !stopLossPrice ||
        stopLossPrice <= 0
    ) {
        return null;
    }

    const stopDistance = Math.abs(entryPrice - stopLossPrice);
    if (stopDistance <= 0) {
        return null;
    }

    // 允许亏损金额 = 本金 × 单笔风险%
    const riskAmount = equity * (riskPercent / 100);

    // 由风险和止损距离推导出的名义仓位
    // 推导：亏损金额 = 仓位名义 × (止损距离 / 开仓价)
    // => 仓位名义 = 亏损金额 × 开仓价 / 止损距离
    const notionalByRisk = (riskAmount * entryPrice) / stopDistance;

    // 杠杆上限允许的最大名义金额
    const maxNotionalByLev = equity * leverage;

    // 实际可用名义仓位（同时满足风控与杠杆）
    const finalNotional = Math.min(notionalByRisk, maxNotionalByLev);

    const qty = finalNotional / entryPrice;
    const actualMargin = finalNotional / leverage;

    return {
        riskAmount,        // 允许亏损金额
        stopDistance,      // 止损距离
        notionalByRisk,    // 风控导出的名义仓位
        maxNotionalByLev,  // 杠杆允许的上限
        finalNotional,     // 实际使用的名义仓位
        qty,               // 建议数量（币）
        actualMargin       // 实际占用保证金
    };
}
