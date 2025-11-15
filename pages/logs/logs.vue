<template>
    <view class="container logs-container">
        <view class="section logs-section">
            <view class="label">历史记录</view>
            <scroll-view class="logs-scroll" scroll-y type="list">
                <block v-for="(log, index) in logs" :key="index">
                    <view class="log-item">{{ index + 1 }}. {{ log.date }}</view>
                </block>
            </scroll-view>
        </view>
    </view>
</template>

<script>
// logs.js
const util = require('../../utils/util.js');
export default {
    data() {
        return {
            logs: [],

            log: {
                date: ''
            }
        };
    },
    onLoad() {
        this.setData({
            logs: (uni.getStorageSync('logs') || []).map((log) => {
                return {
                    date: util.formatTime(new Date(log)),
                    timestamp: log
                };
            })
        });
    },
    methods: {}
};
</script>
<style>
.logs-container {
    padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
}

.logs-section {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.logs-scroll {
    height: 60vh;
    width: 100%;
    box-sizing: border-box;
}

.log-item {
    padding: 20rpx 0;
    font-size: var(--font-body);
    color: var(--text-primary);
    border-bottom: 1rpx solid var(--border-color);
}

.log-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
</style>
