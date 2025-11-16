"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_atr = require("../../utils/atr.js");
const utils_binanceApi = require("../../utils/binanceApi.js");
const config_trading = require("../../config/trading.js");
const utils_risk = require("../../utils/risk.js");
if (!Math) {
  (UiSection + UiButton + UiResultCard)();
}
const UiSection = () => "../../components/ui-section/ui-section.js";
const UiButton = () => "../../components/ui-button/ui-button.js";
const UiResultCard = () => "../../components/ui-result-card/ui-result-card.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const state = common_vendor.reactive({
      // ▼ 交易对列表 & 当前选择
      symbolOptions: config_trading.SYMBOL_OPTIONS,
      symbol: "BTCUSDT",
      // ▼ K线周期列表（用于 ATR）
      intervalOptions: config_trading.INTERVAL_OPTIONS,
      interval: "1h",
      // ▼ ATR 输入
      atrPeriodInput: "14",
      atrMultInput: "1.5",
      // ▼ 风控输入
      equityInput: "",
      riskPercentInput: "",
      leverageInput: "",
      // ▼ 开仓 & 方向
      entryPriceInput: "",
      directionOptions: ["多单", "空单"],
      direction: "long",
      // ▼ 最新价格
      spotPrice: null,
      futuresPrice: null,
      priceDiff: null,
      // ▼ 计算结果
      loading: false,
      atr: null,
      stopLossPrice: null,
      error: "",
      rrRatio: null,
      riskAmount: null,
      stopDistance: null,
      positionNotional: null,
      positionQty: null
    });
    const setResultState = (overrides = {}) => {
      Object.assign(state, {
        loading: false,
        error: "",
        atr: null,
        stopLossPrice: null,
        riskAmount: null,
        stopDistance: null,
        positionNotional: null,
        positionQty: null,
        rrRatio: null,
        ...overrides
      });
    };
    const setError = (msg) => {
      setResultState({
        error: msg
      });
    };
    const onSymbolSelect = (e) => {
      const idx = Number(e.detail.value);
      const selected = state.symbolOptions[idx];
      if (!selected) {
        return;
      }
      state.symbol = selected;
      refreshPrices();
    };
    const onIntervalSelect = (e) => {
      const idx = Number(e.detail.value);
      const selected = state.intervalOptions[idx];
      if (selected) {
        state.interval = selected;
      }
    };
    const onDirectionChange = (e) => {
      const idx = Number(e.detail.value);
      state.direction = idx === 0 ? "long" : "short";
    };
    const onAtrPeriodInput = (e) => {
      state.atrPeriodInput = e.detail.value;
    };
    const onAtrMultInput = (e) => {
      state.atrMultInput = e.detail.value;
    };
    const onEquityInput = (e) => {
      state.equityInput = e.detail.value;
    };
    const onRiskPercentInput = (e) => {
      state.riskPercentInput = e.detail.value;
    };
    const onLeverageInput = (e) => {
      state.leverageInput = e.detail.value;
    };
    const onEntryPriceInput = (e) => {
      state.entryPriceInput = e.detail.value;
    };
    const refreshPrices = async () => {
      const symbol2 = state.symbol;
      state.spotPrice = null;
      state.futuresPrice = null;
      state.priceDiff = null;
      try {
        const [spot, fut] = await Promise.all([utils_binanceApi.fetchSpotPrice(symbol2), utils_binanceApi.fetchFuturesPrice(symbol2)]);
        const diff = fut - spot;
        state.spotPrice = spot.toFixed(2);
        state.futuresPrice = fut.toFixed(2);
        state.priceDiff = diff.toFixed(2);
        state.error = "";
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:241", "刷新价格失败", err);
        state.error = "刷新现货/合约价格失败（请检查合法域名配置）";
      }
    };
    const onCalcTap = async () => {
      const {
        atrPeriodInput: atrPeriodInput2,
        atrMultInput: atrMultInput2,
        entryPriceInput: entryPriceInput2,
        direction: direction2,
        symbol: symbol2,
        interval: interval2,
        equityInput: equityInput2,
        riskPercentInput: riskPercentInput2,
        leverageInput: leverageInput2
      } = state;
      const atrPeriod = parseInt(atrPeriodInput2, 10);
      const atrMult = parseFloat(atrMultInput2);
      const entryPrice = parseFloat(entryPriceInput2);
      const equity = parseFloat(equityInput2);
      const riskPercent = parseFloat(riskPercentInput2);
      const leverage = parseFloat(leverageInput2);
      if (!entryPrice || entryPrice <= 0) {
        setError("开仓价无效，请输入开仓价");
        return;
      }
      if (!atrPeriod || atrPeriod <= 0) {
        setError("ATR 周期无效，请输入大于 0 的整数");
        return;
      }
      if (!atrMult || atrMult <= 0) {
        setError("ATR 倍数无效，请输入大于 0 的数字");
        return;
      }
      setResultState({
        loading: true
      });
      try {
        const candles = await utils_binanceApi.fetchCandlesFromBinance(symbol2, interval2, 200);
        const atr2 = utils_atr.calcATR(candles, atrPeriod);
        if (!atr2) {
          setError("K线数量不足，无法计算 ATR");
          return;
        }
        const stopLossPrice2 = direction2 === "long" ? entryPrice - atrMult * atr2 : entryPrice + atrMult * atr2;
        const riskDistance = direction2 === "long" ? entryPrice - stopLossPrice2 : stopLossPrice2 - entryPrice;
        const rrText = `1 : ${atrMult.toFixed(2)}`;
        const baseResult = {
          loading: false,
          atr: atr2.toFixed(2),
          stopLossPrice: stopLossPrice2.toFixed(2),
          stopDistance: riskDistance.toFixed(2),
          rrRatio: rrText
        };
        if (equity > 0 && riskPercent > 0 && leverage > 0) {
          const pos = utils_risk.calcPositionSize({
            equity,
            riskPercent,
            leverage,
            entryPrice,
            stopLossPrice: stopLossPrice2
          });
          if (pos) {
            setResultState({
              ...baseResult,
              riskAmount: pos.riskAmount.toFixed(2),
              positionNotional: pos.finalNotional.toFixed(2),
              positionQty: pos.qty.toFixed(4)
            });
            return;
          }
        }
        setResultState(baseResult);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:332", "请求K线失败", err);
        setError("请求现货K线失败（请确认 api.binance.com 合法域名已配置）");
      }
    };
    common_vendor.onLoad(() => {
      refreshPrices();
    });
    const {
      symbolOptions,
      symbol,
      intervalOptions,
      interval,
      atrPeriodInput,
      atrMultInput,
      equityInput,
      riskPercentInput,
      leverageInput,
      entryPriceInput,
      directionOptions,
      direction,
      spotPrice,
      futuresPrice,
      priceDiff,
      loading,
      atr,
      stopLossPrice,
      error,
      rrRatio,
      riskAmount,
      stopDistance,
      positionNotional,
      positionQty
    } = common_vendor.toRefs(state);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(common_vendor.unref(symbol)),
        b: common_vendor.unref(symbolOptions),
        c: common_vendor.o(onSymbolSelect),
        d: common_vendor.p({
          label: "交易对"
        }),
        e: common_vendor.t(common_vendor.unref(spotPrice) || "-"),
        f: common_vendor.t(common_vendor.unref(futuresPrice) || "-"),
        g: common_vendor.t(common_vendor.unref(priceDiff) === null ? "-" : common_vendor.unref(priceDiff)),
        h: common_vendor.n("price-value " + (common_vendor.unref(priceDiff) === null ? "" : common_vendor.unref(priceDiff) >= 0 ? "price-up" : "price-down")),
        i: common_vendor.o(refreshPrices),
        j: common_vendor.p({
          label: "最新价格"
        }),
        k: common_vendor.t(common_vendor.unref(interval)),
        l: common_vendor.unref(intervalOptions),
        m: common_vendor.o(onIntervalSelect),
        n: common_vendor.p({
          label: "K线周期（ATR 使用此周期）"
        }),
        o: common_vendor.unref(atrPeriodInput),
        p: common_vendor.o(onAtrPeriodInput),
        q: common_vendor.p({
          label: "ATR 周期"
        }),
        r: common_vendor.unref(atrMultInput),
        s: common_vendor.o(onAtrMultInput),
        t: common_vendor.p({
          label: "ATR 倍数（例如 1.5）"
        }),
        v: common_vendor.unref(equityInput),
        w: common_vendor.o(onEquityInput),
        x: common_vendor.unref(riskPercentInput),
        y: common_vendor.o(onRiskPercentInput),
        z: common_vendor.unref(leverageInput),
        A: common_vendor.o(onLeverageInput),
        B: common_vendor.p({
          label: "风控参数"
        }),
        C: common_vendor.t(common_vendor.unref(direction) === "long" ? "多单" : "空单"),
        D: common_vendor.unref(directionOptions),
        E: common_vendor.o(onDirectionChange),
        F: common_vendor.p({
          label: "开仓方向"
        }),
        G: common_vendor.unref(entryPriceInput),
        H: common_vendor.o(onEntryPriceInput),
        I: common_vendor.p({
          label: "开仓价（Entry Price）"
        }),
        J: common_vendor.o(onCalcTap),
        K: common_vendor.p({
          text: "计算 ATR、止损与仓位建议",
          loading: common_vendor.unref(loading)
        }),
        L: common_vendor.p({
          symbol: common_vendor.unref(symbol),
          interval: common_vendor.unref(interval),
          direction: common_vendor.unref(direction),
          atr: common_vendor.unref(atr),
          atrPeriodInput: common_vendor.unref(atrPeriodInput),
          entryPriceInput: common_vendor.unref(entryPriceInput),
          stopLossPrice: common_vendor.unref(stopLossPrice),
          riskPercentInput: common_vendor.unref(riskPercentInput),
          riskAmount: common_vendor.unref(riskAmount),
          stopDistance: common_vendor.unref(stopDistance),
          positionNotional: common_vendor.unref(positionNotional),
          positionQty: common_vendor.unref(positionQty),
          rrRatio: common_vendor.unref(rrRatio)
        }),
        M: common_vendor.unref(error)
      }, common_vendor.unref(error) ? {
        N: common_vendor.t(common_vendor.unref(error))
      } : {});
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
