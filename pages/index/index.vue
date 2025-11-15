<template>
    <view class="container">
        <!-- 交易对选择 -->
        <UiSection label="交易对">
            <picker mode="selector" :range="symbolOptions" @change="onSymbolSelect">
                <view class="picker">当前：{{ symbol }}</view>
            </picker>
        </UiSection>

        <!-- 最新价格 -->
        <UiSection label="最新价格">
            <view class="price-grid">
                <view class="price-item price-row-bg">
                    <view class="price-title">现货</view>
                    <view class="price-value">{{ spotPrice || '-' }}</view>
                </view>

                <view class="price-item price-row-bg">
                    <view class="price-title">合约</view>
                    <view class="price-value">{{ futuresPrice || '-' }}</view>
                </view>

                <view class="price-item price-row-bg">
                    <view class="price-title">合约 - 现货</view>
                    <view :class="'price-value ' + (priceDiff === null ? '' : priceDiff >= 0 ? 'price-up' : 'price-down')">
                        {{ priceDiff === null ? '-' : priceDiff }}
                    </view>
                </view>
            </view>

            <view class="price-actions">
                <button class="mini-btn" size="mini" @tap="refreshPrices">刷新价格</button>
            </view>
        </UiSection>

        <!-- K线周期（ATR 使用此周期） -->
        <UiSection label="K线周期（ATR 使用此周期）">
            <picker mode="selector" :range="intervalOptions" @change="onIntervalSelect">
                <view class="picker">当前：{{ interval }}</view>
            </picker>
        </UiSection>

        <!-- ATR 周期 -->
        <UiSection label="ATR 周期">
            <input type="number" :value="atrPeriodInput" placeholder="14" @input="onAtrPeriodInput" />
        </UiSection>

        <!-- ATR 倍数 -->
        <UiSection label="ATR 倍数（例如 1.5）">
            <input type="digit" :value="atrMultInput" placeholder="1.5" @input="onAtrMultInput" />
        </UiSection>

        <!-- 风控参数 -->
        <UiSection label="风控参数">
            <view>
                <view class="sub-label">总本金（U）</view>
                <input type="digit" :value="equityInput" placeholder="例如 500" @input="onEquityInput" />

                <view class="sub-label">单笔风险（%）</view>
                <input type="digit" :value="riskPercentInput" placeholder="例如 1 或 2" @input="onRiskPercentInput" />

                <view class="sub-label">杠杆倍数</view>
                <input type="digit" :value="leverageInput" placeholder="例如 3 或 5" @input="onLeverageInput" />
            </view>
        </UiSection>

        <!-- 开仓方向 -->
        <UiSection label="开仓方向">
            <picker mode="selector" :range="directionOptions" @change="onDirectionChange">
                <view class="picker">当前：{{ direction === 'long' ? '多单' : '空单' }}</view>
            </picker>
        </UiSection>

        <!-- 开仓价 -->
        <UiSection label="开仓价（Entry Price）">
            <input type="digit" :value="entryPriceInput" placeholder="请输入手动开仓价" @input="onEntryPriceInput" />
        </UiSection>

        <!-- 计算按钮 -->
        <UiButton text="计算 ATR、止损与仓位建议" :loading="loading" @tap.native="onCalcTap" />

        <!-- 结果卡片：交易计划 -->
        <UiResultCard
            :symbol="symbol"
            :interval="interval"
            :direction="direction"
            :atr="atr"
            :atrPeriodInput="atrPeriodInput"
            :entryPriceInput="entryPriceInput"
            :stopLossPrice="stopLossPrice"
            :riskPercentInput="riskPercentInput"
            :riskAmount="riskAmount"
            :stopDistance="stopDistance"
            :positionNotional="positionNotional"
            :positionQty="positionQty"
            :rrRatio="rrRatio"
        />

        <!-- 错误提示 -->
        <view class="error" v-if="error">
            {{ error }}
        </view>
    </view>
</template>

<script>
import UiSection from '@/components/ui-section/ui-section';
import UiButton from '@/components/ui-button/ui-button';
import UiResultCard from '@/components/ui-result-card/ui-result-card';
// pages/index/index.js

const { calcATR } = require('../../utils/atr.js');
const { fetchCandlesFromBinance, fetchSpotPrice, fetchFuturesPrice } = require('../../utils/binanceApi.js');
const { SYMBOL_OPTIONS, INTERVAL_OPTIONS } = require('../../config/trading.js');
const { calcPositionSize } = require('../../utils/risk.js');
export default {
    components: {
        UiSection,
        UiButton,
        UiResultCard
    },
    data() {
        return {
            // ▼ 交易对列表 & 当前选择
            symbolOptions: SYMBOL_OPTIONS,
            symbol: 'BTCUSDT',
            // ▼ K线周期列表（用于 ATR）
            intervalOptions: INTERVAL_OPTIONS,
            interval: '1h',
            // ▼ ATR 输入（字符串，避免输入被覆盖）
            atrPeriodInput: '14',
            atrMultInput: '1.5',
            // ▼ 风控输入
            equityInput: '',
            // 总本金（U）
            riskPercentInput: '',
            // 单笔风险比例（%）
            leverageInput: '',
            // 杠杆倍数

            // ▼ 开仓 & 方向
            entryPriceInput: '',
            directionOptions: ['多单', '空单'],
            direction: 'long',
            // ▼ 最新价格展示
            spotPrice: null,
            futuresPrice: null,
            priceDiff: null,
            // 合约 - 现货

            // ▼ 计算结果
            loading: false,
            atr: null,
            stopLossPrice: null,
            error: '',
            rrRatio: null,
            // ⭐ 新增：RR 显示用

            // ▼ 仓位计算结果
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
            const symbol = this.symbolOptions[idx];
            this.setData(
                {
                    symbol
                },
                () => {
                    this.refreshPrices();
                }
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
                direction: idx === 0 ? 'long' : 'short'
            });
        },

        // ====== 输入处理（全都存字符串） ======

        onAtrPeriodInput(e) {
            this.setData({
                atrPeriodInput: e.detail.value
            });
        },

        onAtrMultInput(e) {
            this.setData({
                atrMultInput: e.detail.value
            });
        },

        onEquityInput(e) {
            this.setData({
                equityInput: e.detail.value
            });
        },

        onRiskPercentInput(e) {
            this.setData({
                riskPercentInput: e.detail.value
            });
        },

        onLeverageInput(e) {
            this.setData({
                leverageInput: e.detail.value
            });
        },

        onEntryPriceInput(e) {
            this.setData({
                entryPriceInput: e.detail.value
            });
        },

        // ====== 刷新价格（现货 + 合约） ======

        refreshPrices() {
            const { symbol } = this;
            this.setData({
                spotPrice: null,
                futuresPrice: null,
                priceDiff: null
            });
            Promise.all([fetchSpotPrice(symbol), fetchFuturesPrice(symbol)])
                .then(([spot, fut]) => {
                    const diff = fut - spot;
                    this.setData({
                        spotPrice: spot.toFixed(2),
                        futuresPrice: fut.toFixed(2),
                        priceDiff: diff.toFixed(2)
                    });
                })
                .catch((err) => {
                    console.error('刷新价格失败', err);
                    this.setData({
                        error: '刷新现货/合约价格失败（请检查合法域名配置）'
                    });
                });
        },

        // ====== 核心：计算 ATR + 止损 + 仓位 ======
        onCalcTap() {
            const { atrPeriodInput, atrMultInput, entryPriceInput, direction, symbol, interval, equityInput, riskPercentInput, leverageInput } = this;

            // 解析数字
            const atrPeriod = parseInt(atrPeriodInput, 10);
            const atrMult = parseFloat(atrMultInput);
            const entryPrice = parseFloat(entryPriceInput);
            const equity = parseFloat(equityInput);
            const riskPercent = parseFloat(riskPercentInput);
            const leverage = parseFloat(leverageInput);

            // 基础校验：先保证 ATR 与止损能算
            if (!entryPrice || Number.isNaN(entryPrice) || entryPrice <= 0) {
                this.setData({
                    error: '开仓价无效，请输入开仓价',
                    atr: null,
                    stopLossPrice: null,
                    riskAmount: null,
                    stopDistance: null,
                    positionNotional: null,
                    positionQty: null,
                    rrRatio: null
                });
                return;
            }
            if (!atrPeriod || Number.isNaN(atrPeriod) || atrPeriod <= 0) {
                this.setData({
                    error: 'ATR 周期无效，请输入大于 0 的整数',
                    atr: null,
                    stopLossPrice: null,
                    riskAmount: null,
                    stopDistance: null,
                    positionNotional: null,
                    positionQty: null,
                    rrRatio: null
                });
                return;
            }
            if (!atrMult || Number.isNaN(atrMult) || atrMult <= 0) {
                this.setData({
                    error: 'ATR 倍数无效，请输入大于 0 的数字',
                    atr: null,
                    stopLossPrice: null,
                    riskAmount: null,
                    stopDistance: null,
                    positionNotional: null,
                    positionQty: null,
                    rrRatio: null
                });
                return;
            }
            this.setData({
                loading: true,
                error: '',
                atr: null,
                stopLossPrice: null,
                riskAmount: null,
                stopDistance: null,
                positionNotional: null,
                positionQty: null,
                rrRatio: null
            });

            // 先用现货 K 线算 ATR
            fetchCandlesFromBinance(symbol, interval, 200)
                .then((candles) => {
                    const atr = calcATR(candles, atrPeriod);
                    if (!atr) {
                        this.setData({
                            loading: false,
                            error: 'K线数量不足，无法计算 ATR'
                        });
                        return;
                    }

                    // 1）计算止损价格（基于 ATR）
                    let stopLossPrice;
                    if (direction === 'long') {
                        stopLossPrice = entryPrice - atrMult * atr;
                    } else {
                        stopLossPrice = entryPrice + atrMult * atr;
                    }

                    // 2）计算风险距离（entry 与 SL 的点差）
                    let riskDistance;
                    if (direction === 'long') {
                        riskDistance = entryPrice - stopLossPrice;
                    } else {
                        riskDistance = stopLossPrice - entryPrice;
                    }

                    // 3）计算 RR（这里先用 ATR 倍数作为 reward/risk）
                    const rrValue = atrMult; // reward / risk，本质就是 ATR 倍数
                    const rrText = `1 : ${rrValue.toFixed(2)}`;

                    // 4）基础结果（无风控参数时也能显示）
                    const baseResult = {
                        loading: false,
                        atr: atr.toFixed(2),
                        stopLossPrice: stopLossPrice.toFixed(2),
                        stopDistance: riskDistance.toFixed(2),
                        rrRatio: rrText
                    };

                    // 5）如果风控参数完整，计算仓位
                    if (!Number.isNaN(equity) && equity > 0 && !Number.isNaN(riskPercent) && riskPercent > 0 && !Number.isNaN(leverage) && leverage > 0) {
                        const pos = calcPositionSize({
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
                                // 这里用风控里的 stopDistance 也可以，
                                // 如果你更相信 ATR 算出的，就保留 baseResult 的 stopDistance
                                positionNotional: pos.finalNotional.toFixed(2),
                                positionQty: pos.qty.toFixed(4)
                            });
                            return;
                        }
                    }

                    // 6）风控参数不完整，只展示 ATR / SL / RR / 距离
                    this.setData(baseResult);
                })
                .catch((err) => {
                    console.error('请求K线失败', err);
                    this.setData({
                        loading: false,
                        error: '请求现货K线失败（请确认 api.binance.com 合法域名已配置）'
                    });
                });
        }
    }
};
</script>
<style>
/* 可以加一点页面级的小调整 */
.container {
    /* 可选：稍微窄一点，看起来更像工具面板 */
    max-width: 680rpx;
    margin: 0 auto;
}

/* 给结果卡片一点额外的间距，方便观察 */
.result-card-wrapper {
    margin-top: 24rpx;
}
</style>
