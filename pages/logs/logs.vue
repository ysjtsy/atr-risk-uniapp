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

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { formatTime } from '@/utils/util.js';

const logs = ref([]);

onLoad(() => {
    const storedLogs = uni.getStorageSync('logs') || [];
    logs.value = storedLogs.map((log) => ({
        date: formatTime(new Date(log)),
        timestamp: log
    }));
});
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
