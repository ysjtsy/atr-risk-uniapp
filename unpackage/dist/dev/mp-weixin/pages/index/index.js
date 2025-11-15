"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_atr = require("../../utils/atr.js");
const utils_binanceApi = require("../../utils/binanceApi.js");
const config_trading = require("../../config/trading.js");
const utils_risk = require("../../utils/risk.js");
const UiSection = () => "../../components/ui-section/ui-section.js";
const UiButton = () => "../../components/ui-button/ui-button.js";
const UiResultCard = () => "../../components/ui-result-card/ui-result-card.js";
const _sfc_main = {
  components: {
    UiSection,
    UiButton,
    UiResultCard
  },
  data() {
    return {
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
    };
  },
  onLoad() {
    this.refreshPrices();
  },
  methods: {
    // ====== 下拉选择 ======
    onSymbolSelect(e) {
      const idx = Number(e.detail.value);
      this.setData(
        {
          symbol: this.symbolOptions[idx]
        },
        () => this.refreshPrices()
      );
    },
    onIntervalSelect(e) {
      const idx = Number(e.detail.value);
      this.setData({
        interval: this.intervalOptions[idx]
      });
    },
    onDirectionChange(e) {
      const idx = Number(e.detail.value);
      this.setData({
        direction: idx === 0 ? "long" : "short"
      });
    },
    // ====== 输入处理 ======
    onAtrPeriodInput(e) {
      this.setData({ atrPeriodInput: e.detail.value });
    },
    onAtrMultInput(e) {
      this.setData({ atrMultInput: e.detail.value });
    },
    onEquityInput(e) {
      this.setData({ equityInput: e.detail.value });
    },
    onRiskPercentInput(e) {
      this.setData({ riskPercentInput: e.detail.value });
    },
    onLeverageInput(e) {
      this.setData({ leverageInput: e.detail.value });
    },
    onEntryPriceInput(e) {
      this.setData({ entryPriceInput: e.detail.value });
    },
    // ====== 刷新价格 ======
    refreshPrices() {
      const { symbol } = this;
      this.setData({
        spotPrice: null,
        futuresPrice: null,
        priceDiff: null
      });
      Promise.all([utils_binanceApi.fetchSpotPrice(symbol), utils_binanceApi.fetchFuturesPrice(symbol)]).then(([spot, fut]) => {
        const diff = fut - spot;
        this.setData({
          spotPrice: spot.toFixed(2),
          futuresPrice: fut.toFixed(2),
          priceDiff: diff.toFixed(2)
        });
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/index/index.vue:234", "刷新价格失败", err);
        this.setData({
          error: "刷新现货/合约价格失败（请检查合法域名配置）"
        });
      });
    },
    // ====== 核心逻辑：ATR + 止损 + 仓位 ======
    onCalcTap() {
      const {
        atrPeriodInput,
        atrMultInput,
        entryPriceInput,
        direction,
        symbol,
        interval,
        equityInput,
        riskPercentInput,
        leverageInput
      } = this;
      const atrPeriod = parseInt(atrPeriodInput, 10);
      const atrMult = parseFloat(atrMultInput);
      const entryPrice = parseFloat(entryPriceInput);
      const equity = parseFloat(equityInput);
      const riskPercent = parseFloat(riskPercentInput);
      const leverage = parseFloat(leverageInput);
      if (!entryPrice || entryPrice <= 0) {
        this._error("开仓价无效，请输入开仓价");
        return;
      }
      if (!atrPeriod || atrPeriod <= 0) {
        this._error("ATR 周期无效，请输入大于 0 的整数");
        return;
      }
      if (!atrMult || atrMult <= 0) {
        this._error("ATR 倍数无效，请输入大于 0 的数字");
        return;
      }
      this.setData({
        loading: true,
        error: "",
        atr: null,
        stopLossPrice: null,
        riskAmount: null,
        stopDistance: null,
        positionNotional: null,
        positionQty: null,
        rrRatio: null
      });
      utils_binanceApi.fetchCandlesFromBinance(symbol, interval, 200).then((candles) => {
        const atr = utils_atr.calcATR(candles, atrPeriod);
        if (!atr) {
          this._error("K线数量不足，无法计算 ATR");
          return;
        }
        const stopLossPrice = direction === "long" ? entryPrice - atrMult * atr : entryPrice + atrMult * atr;
        const riskDistance = direction === "long" ? entryPrice - stopLossPrice : stopLossPrice - entryPrice;
        const rrText = `1 : ${atrMult.toFixed(2)}`;
        const baseResult = {
          loading: false,
          atr: atr.toFixed(2),
          stopLossPrice: stopLossPrice.toFixed(2),
          stopDistance: riskDistance.toFixed(2),
          rrRatio: rrText
        };
        if (equity > 0 && riskPercent > 0 && leverage > 0) {
          const pos = utils_risk.calcPositionSize({
            equity,
            riskPercent,
            leverage,
            entryPrice,
            stopLossPrice
          });
          if (pos) {
            this.setData({
              ...baseResult,
              riskAmount: pos.riskAmount.toFixed(2),
              positionNotional: pos.finalNotional.toFixed(2),
              positionQty: pos.qty.toFixed(4)
            });
            return;
          }
        }
        this.setData(baseResult);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/index/index.vue:350", "请求K线失败", err);
        this._error("请求现货K线失败（请确认 api.binance.com 合法域名已配置）");
      });
    },
    // ====== 通用错误处理 ======
    _error(msg) {
      this.setData({
        loading: false,
        error: msg,
        atr: null,
        stopLossPrice: null,
        riskAmount: null,
        stopDistance: null,
        positionNotional: null,
        positionQty: null,
        rrRatio: null
      });
    }
  }
};
if (!Array) {
  const _component_UiSection = common_vendor.resolveComponent("UiSection");
  const _component_UiButton = common_vendor.resolveComponent("UiButton");
  const _component_UiResultCard = common_vendor.resolveComponent("UiResultCard");
  (_component_UiSection + _component_UiButton + _component_UiResultCard)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.symbol),
    b: $data.symbolOptions,
    c: common_vendor.o((...args) => $options.onSymbolSelect && $options.onSymbolSelect(...args)),
    d: common_vendor.p({
      label: "交易对"
    }),
    e: common_vendor.t($data.spotPrice || "-"),
    f: common_vendor.t($data.futuresPrice || "-"),
    g: common_vendor.t($data.priceDiff === null ? "-" : $data.priceDiff),
    h: common_vendor.n("price-value " + ($data.priceDiff === null ? "" : $data.priceDiff >= 0 ? "price-up" : "price-down")),
    i: common_vendor.o((...args) => $options.refreshPrices && $options.refreshPrices(...args)),
    j: common_vendor.p({
      label: "最新价格"
    }),
    k: common_vendor.t($data.interval),
    l: $data.intervalOptions,
    m: common_vendor.o((...args) => $options.onIntervalSelect && $options.onIntervalSelect(...args)),
    n: common_vendor.p({
      label: "K线周期（ATR 使用此周期）"
    }),
    o: $data.atrPeriodInput,
    p: common_vendor.o((...args) => $options.onAtrPeriodInput && $options.onAtrPeriodInput(...args)),
    q: common_vendor.p({
      label: "ATR 周期"
    }),
    r: $data.atrMultInput,
    s: common_vendor.o((...args) => $options.onAtrMultInput && $options.onAtrMultInput(...args)),
    t: common_vendor.p({
      label: "ATR 倍数（例如 1.5）"
    }),
    v: $data.equityInput,
    w: common_vendor.o((...args) => $options.onEquityInput && $options.onEquityInput(...args)),
    x: $data.riskPercentInput,
    y: common_vendor.o((...args) => $options.onRiskPercentInput && $options.onRiskPercentInput(...args)),
    z: $data.leverageInput,
    A: common_vendor.o((...args) => $options.onLeverageInput && $options.onLeverageInput(...args)),
    B: common_vendor.p({
      label: "风控参数"
    }),
    C: common_vendor.t($data.direction === "long" ? "多单" : "空单"),
    D: $data.directionOptions,
    E: common_vendor.o((...args) => $options.onDirectionChange && $options.onDirectionChange(...args)),
    F: common_vendor.p({
      label: "开仓方向"
    }),
    G: $data.entryPriceInput,
    H: common_vendor.o((...args) => $options.onEntryPriceInput && $options.onEntryPriceInput(...args)),
    I: common_vendor.p({
      label: "开仓价（Entry Price）"
    }),
    J: common_vendor.o($options.onCalcTap),
    K: common_vendor.p({
      text: "计算 ATR、止损与仓位建议",
      loading: $data.loading
    }),
    L: common_vendor.p({
      symbol: $data.symbol,
      interval: $data.interval,
      direction: $data.direction,
      atr: $data.atr,
      atrPeriodInput: $data.atrPeriodInput,
      entryPriceInput: $data.entryPriceInput,
      stopLossPrice: $data.stopLossPrice,
      riskPercentInput: $data.riskPercentInput,
      riskAmount: $data.riskAmount,
      stopDistance: $data.stopDistance,
      positionNotional: $data.positionNotional,
      positionQty: $data.positionQty,
      rrRatio: $data.rrRatio
    }),
    M: $data.error
  }, $data.error ? {
    N: common_vendor.t($data.error)
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
