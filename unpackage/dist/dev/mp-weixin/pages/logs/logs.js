"use strict";
const common_vendor = require("../../common/vendor.js");
const util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      logs: [],
      log: {
        date: ""
      }
    };
  },
  onLoad() {
    this.setData({
      logs: (common_vendor.index.getStorageSync("logs") || []).map((log) => {
        return {
          date: util.formatTime(new Date(log)),
          timestamp: log
        };
      })
    });
  },
  methods: {}
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.logs, (log, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: common_vendor.t(log.date),
        c: index
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/logs/logs.js.map
