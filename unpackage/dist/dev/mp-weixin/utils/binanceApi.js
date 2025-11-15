"use strict";
const common_vendor = require("../common/vendor.js");
function fetchCandlesFromBinance(symbol, interval, limit = 200) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: "https://api.binance.com/api/v3/klines",
      method: "GET",
      data: {
        symbol,
        interval,
        limit
      },
      success(res) {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const candles = res.data.map((item) => ({
            high: Number(item[2]),
            low: Number(item[3]),
            close: Number(item[4])
          }));
          resolve(candles);
        } else {
          reject(new Error("现货K线数据格式错误"));
        }
      },
      fail: reject
    });
  });
}
function fetchSpotPrice(symbol) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: "https://api.binance.com/api/v3/ticker/price",
      method: "GET",
      data: {
        symbol
      },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.price) {
          resolve(Number(res.data.price));
        } else {
          reject(new Error("现货价格数据错误"));
        }
      },
      fail: reject
    });
  });
}
function fetchFuturesPrice(symbol) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: "https://fapi.binance.com/fapi/v1/ticker/price",
      method: "GET",
      data: {
        symbol
      },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.price) {
          resolve(Number(res.data.price));
        } else {
          reject(new Error("合约价格数据错误"));
        }
      },
      fail: reject
    });
  });
}
exports.fetchCandlesFromBinance = fetchCandlesFromBinance;
exports.fetchFuturesPrice = fetchFuturesPrice;
exports.fetchSpotPrice = fetchSpotPrice;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/binanceApi.js.map
