<template>
    <view class="result-card-wrapper" v-if="atr">
        <view :class="'direction-strip ' + (direction === 'long' ? 'strip-long' : 'strip-short')"></view>

        <view class="result-card">
            <!-- 头部标签 -->
            <view class="result-header">
                <view class="tag tag-symbol">{{ symbol }}</view>
                <view class="tag tag-interval">{{ interval }}</view>
                <view class="tag tag-direction">
                    {{ direction === 'long' ? '多单计划' : '空单计划' }}
                </view>
            </view>

            <!-- 核心区：ATR Entry SL -->
            <view class="result-row">
                <text class="result-label">ATR{{ atrPeriodInput }}</text>
                <text class="result-value">{{ atr }}</text>
            </view>

            <view class="result-row">
                <text class="result-label">Entry</text>
                <text class="result-value">{{ entryPriceInput }}</text>
            </view>

            <view class="result-row">
                <text class="result-label">Stop Loss</text>
                <text class="result-value">{{ stopLossPrice }}</text>
            </view>

            <view class="result-row result-small">
                <text class="result-label"></text>
                <text class="result-hint">({{ stopDistance }} 点距离)</text>
            </view>

            <view class="result-divider"></view>

            <!-- 风险区 -->
            <view v-if="positionQty">
                <view class="section-title">风险</view>

                <view class="result-row">
                    <text class="result-label">风险 {{ riskPercentInput }}%</text>
                    <text class="result-value">{{ riskAmount }}</text>
                </view>

                <view class="result-row" v-if="takeProfitAmount">
                    <text class="result-label">建议止盈金额</text>
                    <text class="result-value">{{ takeProfitAmount }}</text>
                </view>

                <view class="result-row">
                    <text class="result-label">RR</text>
                    <text class="result-value">{{ rrRatio }}</text>
                </view>

                <view class="result-divider"></view>

                <!-- 仓位区 -->
                <view class="section-title">仓位</view>

                <view class="result-row">
                    <text class="result-label">名义仓位</text>
                    <text class="result-value">{{ positionNotional }}</text>
                </view>

                <view class="result-row" v-if="actualMargin">
                    <text class="result-label">实际保证金</text>
                    <text class="result-value">{{ actualMargin }}</text>
                </view>

                <view class="result-row">
                    <text class="result-label">仓位数量</text>
                    <text class="result-value result-value-strong">{{ positionQty }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {};
    },
    options: {
        styleIsolation: 'apply-shared' // ⭐ 关键：允许页面样式作用到组件
    },
    props: {
        symbol: String,
        interval: String,
        direction: {
            type: String,
            default: 'long' // long / short
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
        rrRatio: String,
        takeProfitAmount: String,
        actualMargin: String
    },
    methods: {},
    created: function () {}
};
</script>
<style>
.result-card-wrapper {
    position: relative;
    margin-top: 24rpx;
}

/* 左侧多空标签条 */
.direction-strip {
    position: absolute;
    left: 0;
    top: 0;
    width: 8rpx;
    height: 100%;
    border-radius: 8rpx;
}

.strip-long {
    background-color: rgba(34, 197, 94, 0.85);
}

.strip-short {
    background-color: rgba(239, 68, 68, 0.85);
}

/* 卡片主体 */
.result-card {
    padding: 26rpx 26rpx 30rpx 36rpx;
    border-radius: 20rpx;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10rpx 25rpx rgba(15, 23, 42, 0.08);
}

/* 头部标签 */
.result-header {
    display: flex;
    gap: 12rpx;
    margin-bottom: 18rpx;
}

.tag {
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
}

.tag-symbol {
    color: #111827;
}

.tag-interval {
    color: #6b7280;
}

.tag-direction {
    color: #0f766e;
    background-color: #ecfeff;
    border-color: #67e8f9;
}

/* 分区标题 */
.section-title {
    font-size: 24rpx;
    font-weight: 600;
    color: #374151;
    margin-bottom: 10rpx;
}

/* 数值行 */
.result-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
}

.result-label {
    font-size: 26rpx;
    color: #6b7280;
}

.result-value {
    font-size: 28rpx;
    font-weight: 600;
    color: #111827;
}

.result-value-strong {
    font-size: 30rpx;
    font-weight: 700;
    color: #2563eb;
}

.result-small .result-hint {
    font-size: 22rpx;
    color: #9ca3af;
}

/* 分割线 */
.result-divider {
    margin: 16rpx 0;
    height: 1rpx;
    background-color: #e5e7eb;
}
</style>
