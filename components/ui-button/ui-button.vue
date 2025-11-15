<template>
    <view>
        <button class="btn" :loading="loading" :disabled="disabled" @tap="onTap">
            {{ text }}
        </button>
    </view>
</template>

<script>
export default {
    data() {
        return {};
    },
    props: {
        text: {
            type: String,
            default: ''
        },
        loading: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        onTap() {
            // 把点击事件抛给外层页面
            this.$emit('tap');
        }
    },
    created: function () {}
};
</script>
<style>
/* 使用全局 .btn 样式 */
</style>
