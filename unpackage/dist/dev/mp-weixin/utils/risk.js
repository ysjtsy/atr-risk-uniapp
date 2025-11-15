"use strict";
function calcPositionSize({ equity, riskPercent, leverage, entryPrice, stopLossPrice }) {
  if (!equity || equity <= 0 || !riskPercent || riskPercent <= 0 || !leverage || leverage <= 0 || !entryPrice || entryPrice <= 0 || !stopLossPrice || stopLossPrice <= 0) {
    return null;
  }
  const stopDistance = Math.abs(entryPrice - stopLossPrice);
  if (stopDistance <= 0) {
    return null;
  }
  const riskAmount = equity * (riskPercent / 100);
  const notionalByRisk = riskAmount * entryPrice / stopDistance;
  const maxNotionalByLev = equity * leverage;
  const finalNotional = Math.min(notionalByRisk, maxNotionalByLev);
  const qty = finalNotional / entryPrice;
  return {
    riskAmount,
    // 允许亏损金额
    stopDistance,
    // 止损距离
    notionalByRisk,
    // 风控导出的名义仓位
    maxNotionalByLev,
    // 杠杆允许的上限
    finalNotional,
    // 实际使用的名义仓位
    qty
    // 建议数量（币）
  };
}
exports.calcPositionSize = calcPositionSize;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/risk.js.map
