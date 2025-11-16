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
            :takeProfitAmount="takeProfitAmount"
            :actualMargin="actualMargin"
        />

        <!-- 错误提示 -->
        <view class="error" v-if="error">
            {{ error }}
        </view>
    </view>
</template>

<script>
import UiSection from '@/components/ui-section/ui-section.vue';
import UiButton from '@/components/ui-button/ui-button.vue';
import UiResultCard from '@/components/ui-result-card/ui-result-card.vue';

import { calcATR } from '@/utils/atr.js';
import { fetchCandlesFromBinance, fetchSpotPrice, fetchFuturesPrice } from '@/utils/binanceApi.js';
import { SYMBOL_OPTIONS, INTERVAL_OPTIONS } from '@/config/trading.js';
import { calcPositionSize } from '@/utils/risk.js';

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

            // ▼ ATR 输入
            atrPeriodInput: '14',
            atrMultInput: '1.5',

            // ▼ 风控输入
            equityInput: '',
            riskPercentInput: '',
            leverageInput: '',

            // ▼ 开仓 & 方向
            entryPriceInput: '',
            directionOptions: ['多单', '空单'],
            direction: 'long',

            // ▼ 最新价格
            spotPrice: null,
            futuresPrice: null,
            priceDiff: null,

            // ▼ 计算结果
            loading: false,
            atr: null,
            stopLossPrice: null,
            error: '',
            rrRatio: null,

            riskAmount: null,
            stopDistance: null,
            positionNotional: null,
            positionQty: null,
            takeProfitAmount: null,
            actualMargin: null
        };
    },
    onLoad() {
        this.refreshPrices();
    },
    methods: {
        setResultState(overrides = {}) {
            Object.assign(this, {
                loading: false,
                error: '',
                atr: null,
                stopLossPrice: null,
                riskAmount: null,
                stopDistance: null,
                positionNotional: null,
                positionQty: null,
                rrRatio: null,
                takeProfitAmount: null,
                actualMargin: null,
                ...overrides
            });
        },

        // ====== 下拉选择 ======
        onSymbolSelect(e) {
            const idx = Number(e.detail.value);
            const selected = this.symbolOptions[idx];
            if (!selected) {
                return;
            }
            this.symbol = selected;
            this.refreshPrices();
        },

        onIntervalSelect(e) {
            const idx = Number(e.detail.value);
            const selected = this.intervalOptions[idx];
            if (selected) {
                this.interval = selected;
            }
        },

        onDirectionChange(e) {
            const idx = Number(e.detail.value);
            this.direction = idx === 0 ? 'long' : 'short';
        },

        // ====== 输入处理 ======
        onAtrPeriodInput(e) {
            this.atrPeriodInput = e.detail.value;
        },
        onAtrMultInput(e) {
            this.atrMultInput = e.detail.value;
        },
        onEquityInput(e) {
            this.equityInput = e.detail.value;
        },
        onRiskPercentInput(e) {
            this.riskPercentInput = e.detail.value;
        },
        onLeverageInput(e) {
            this.leverageInput = e.detail.value;
        },
        onEntryPriceInput(e) {
            this.entryPriceInput = e.detail.value;
        },

        // ====== 刷新价格 ======
        async refreshPrices() {
            const { symbol } = this;

            this.spotPrice = null;
            this.futuresPrice = null;
            this.priceDiff = null;

            try {
                const [spot, fut] = await Promise.all([fetchSpotPrice(symbol), fetchFuturesPrice(symbol)]);
                const diff = fut - spot;
                this.spotPrice = spot.toFixed(2);
                this.futuresPrice = fut.toFixed(2);
                this.priceDiff = diff.toFixed(2);
                this.error = '';
            } catch (err) {
                console.error('刷新价格失败', err);
                this.error = '刷新现货/合约价格失败（请检查合法域名配置）';
            }
        },

        // ====== 核心逻辑：ATR + 止损 + 仓位 ======
        async onCalcTap() {
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

            // 解析数字
            const atrPeriod = parseInt(atrPeriodInput, 10);
            const atrMult = parseFloat(atrMultInput);
            const entryPrice = parseFloat(entryPriceInput);
            const equity = parseFloat(equityInput);
            const riskPercent = parseFloat(riskPercentInput);
            const leverage = parseFloat(leverageInput);

            // 基础校验：先保证 ATR 与止损能算
            if (!entryPrice || entryPrice <= 0) {
                this._error('开仓价无效，请输入开仓价');
                return;
            }
            if (!atrPeriod || atrPeriod <= 0) {
                this._error('ATR 周期无效，请输入大于 0 的整数');
                return;
            }
            if (!atrMult || atrMult <= 0) {
                this._error('ATR 倍数无效，请输入大于 0 的数字');
                return;
            }

            this.setResultState({
                loading: true
            });

            try {
                const candles = await fetchCandlesFromBinance(symbol, interval, 200);
                const atr = calcATR(candles, atrPeriod);
                if (!atr) {
                    this._error('K线数量不足，无法计算 ATR');
                    return;
                }

                const stopLossPrice =
                    direction === 'long'
                        ? entryPrice - atrMult * atr
                        : entryPrice + atrMult * atr;

                const riskDistance =
                    direction === 'long'
                        ? entryPrice - stopLossPrice
                        : stopLossPrice - entryPrice;

                const rrRatioText = `1 : ${atrMult.toFixed(2)}`;

                const baseResult = {
                    loading: false,
                    atr: atr.toFixed(2),
                    stopLossPrice: stopLossPrice.toFixed(2),
                    stopDistance: riskDistance.toFixed(2),
                    rrRatio: rrRatioText,
                    takeProfitAmount: null,
                    actualMargin: null
                };

                if (equity > 0 && riskPercent > 0 && leverage > 0) {
                    const pos = calcPositionSize({
                        equity,
                        riskPercent,
                        leverage,
                        entryPrice,
                        stopLossPrice
                    });

                    if (pos) {
                        const takeProfitAmount = (pos.riskAmount * atrMult).toFixed(2);
                        const actualMargin = pos.actualMargin ? pos.actualMargin.toFixed(2) : null;
                        this.setResultState({
                            ...baseResult,
                            riskAmount: pos.riskAmount.toFixed(2),
                            positionNotional: pos.finalNotional.toFixed(2),
                            positionQty: pos.qty.toFixed(4),
                            takeProfitAmount,
                            actualMargin
                        });
                        return;
                    }
                }

                this.setResultState(baseResult);
            } catch (err) {
                console.error('请求K线失败', err);
                this._error('请求现货K线失败（请确认 api.binance.com 合法域名已配置）');
            }
        },

        // ====== 通用错误处理 ======
        _error(msg) {
            this.setResultState({
                error: msg
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
