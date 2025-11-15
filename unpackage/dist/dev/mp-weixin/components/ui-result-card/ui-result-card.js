"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {};
  },
  options: {
    styleIsolation: "apply-shared"
    // ⭐ 关键：允许页面样式作用到组件
  },
  props: {
    symbol: String,
    interval: String,
    direction: {
      type: String,
      default: "long"
      // long / short
    },
    atr: String,
    atrPeriodInput: String,
    entryPriceInput: String,
    stopLossPrice: String,
    riskPercentInput: String,
    riskAmount: String,
    stopDistance: String,
    positionNotional: String,
    positionQty: String,
    rrRatio: String
  },
  methods: {},
  created: function() {
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.atr
  }, $props.atr ? common_vendor.e({
    b: common_vendor.n("direction-strip " + ($props.direction === "long" ? "strip-long" : "strip-short")),
    c: common_vendor.t($props.symbol),
    d: common_vendor.t($props.interval),
    e: common_vendor.t($props.direction === "long" ? "多单计划" : "空单计划"),
    f: common_vendor.t($props.atrPeriodInput),
    g: common_vendor.t($props.atr),
    h: common_vendor.t($props.entryPriceInput),
    i: common_vendor.t($props.stopLossPrice),
    j: common_vendor.t($props.stopDistance),
    k: $props.positionQty
  }, $props.positionQty ? {
    l: common_vendor.t($props.riskPercentInput),
    m: common_vendor.t($props.riskAmount),
    n: common_vendor.t($props.rrRatio),
    o: common_vendor.t($props.positionNotional),
    p: common_vendor.t($props.positionQty)
  } : {}) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/ui-result-card/ui-result-card.js.map
