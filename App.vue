<script setup>
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  const logs = uni.getStorageSync('logs') || [];
  logs.unshift(Date.now());
  uni.setStorageSync('logs', logs);

  uni.login({
    success: () => {
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
    }
  });
});
</script>

<style>
@import './styles/variables.css';
@import './styles/base.css';
</style>
