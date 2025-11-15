<template>
    <view class="section">
        <view class="label">{{ label }}</view>

        <!-- 可选的副标题 -->
        <view class="sub-label" v-if="subLabel">
            {{ subLabel }}
        </view>

        <!-- 内容插槽 -->
        <slot></slot>
    </view>
</template>

<script>
export default {
    data() {
        return {};
    },
    props: {
        label: {
            type: String,
            default: ''
        },
        subLabel: {
            type: String,
            default: ''
        }
    },
    methods: {},
    created: function () {}
};
</script>
<style>
/* 视觉样式全部使用 base.wxss 中的 .section / .label / .sub-label */
</style>
