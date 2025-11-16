"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  __name: "logs",
  setup(__props) {
    const logs = common_vendor.ref([]);
    common_vendor.onLoad(() => {
      const storedLogs = common_vendor.index.getStorageSync("logs") || [];
      logs.value = storedLogs.map((log) => ({
        date: utils_util.formatTime(new Date(log)),
        timestamp: log
      }));
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(logs.value, (log, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: common_vendor.t(log.date),
            c: index
          };
        })
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/logs/logs.js.map
