# 性能优化修复

## 🐛 问题分析

### 症状
- 图片生成很慢（15秒+）
- 日志显示所有步骤都完成了
- 但图片没有显示

### 日志分析
```
✅ 所有内容绘制完成，准备执行 ctx.draw()
✅ ctx.draw() 回调执行
✅ 开始添加小程序码
✅ addQRCodeToCanvas 被调用
✅ 小程序码绘制完成
✅ canvasToImage 被调用
✅ 图片生成成功
❌ 但图片没有显示在界面上
```

### 根本原因

**问题 1：ctx.draw() 被调用了两次**
```javascript
// 第一次 draw
ctx.draw(false, () => {
  // 第二次 draw（在 addQRCodeToCanvas 中）
  ctx.draw(false, () => {
    this.canvasToImage();
  });
});
```

**问题 2：第二次 draw 可能覆盖了第一次的内容**
- 第一次绘制了所有内容
- 第二次只绘制了小程序码
- 导致最终图片只有小程序码

**问题 3：延迟时间过长**
- 多个 setTimeout 累加
- 总延迟时间：500ms + 300ms = 800ms
- 加上其他处理时间，总共可能超过 1 秒

## ✅ 解决方案

### 优化 1：合并绘制，只调用一次 ctx.draw()

**修改前**：
```javascript
// 绘制所有内容
ctx.draw(false, () => {
  // 调用 addQRCodeToCanvas
  this.addQRCodeToCanvas(qrX, qrY, qrSize);
});

// addQRCodeToCanvas 中
addQRCodeToCanvas(qrX, qrY, qrSize) {
  const ctx = wx.createCanvasContext("cardCanvas", this);
  ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);
  ctx.draw(false, () => {  // 第二次 draw
    this.canvasToImage();
  });
}
```

**修改后**：
```javascript
// 在同一个 draw 中绘制所有内容（包括小程序码）
const qrCodePath = "/images/3s.jpg";
ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);

// 只调用一次 draw
ctx.draw(false, () => {
  this.canvasToImage();
});
```

### 优化 2：移除延迟，立即转换

**修改前**：
```javascript
ctx.draw(false, () => {
  setTimeout(() => {
    this.canvasToImage();
  }, 300);
});
```

**修改后**：
```javascript
ctx.draw(false, () => {
  // 立即转换，不延迟
  this.canvasToImage();
});
```

### 优化 3：优化 canvasToTempFilePath 参数

**修改前**：
```javascript
wx.canvasToTempFilePath({
  canvasId: "cardCanvas",
  fileType: "jpg",
  quality: 1,
  // ...
});
```

**修改后**：
```javascript
wx.canvasToTempFilePath({
  canvasId: "cardCanvas",
  x: 0,
  y: 0,
  width: 750,
  height: canvasHeight,
  destWidth: 750,
  destHeight: canvasHeight,
  fileType: "jpg",
  quality: 0.9,  // 降低到 0.9，减少文件大小
  // ...
});
```

### 优化 4：删除不必要的函数

**删除**：`addQRCodeToCanvas()` 函数
- 不再需要单独的函数
- 小程序码直接在主绘制流程中绘制

## 📝 修改的代码

### miniprogram/pages/index/index.js

**修改 1：合并小程序码绘制**
```javascript
// 在 drawCardImage 函数中
// 绘制小程序码（在同一个 draw 中完成）
const qrCodePath = "/images/3s.jpg";
ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);

// 一次性执行绘制
ctx.draw(false, () => {
  this.canvasToImage();
});
```

**修改 2：优化 canvasToImage**
```javascript
canvasToImage() {
  const { canvasHeight } = this.data;
  
  wx.canvasToTempFilePath({
    canvasId: "cardCanvas",
    x: 0,
    y: 0,
    width: 750,
    height: canvasHeight || 1334,
    destWidth: 750,
    destHeight: canvasHeight || 1334,
    fileType: "jpg",
    quality: 0.9,
    success: (res) => {
      this.setData({
        cardImagePath: res.tempFilePath,
        loading: false,
      });
    }
  }, this);
}
```

**修改 3：删除函数**
- 删除 `addQRCodeToCanvas()` 函数

## 🎯 性能对比

| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| ctx.draw() 调用次数 | 2次 | 1次 |
| setTimeout 延迟 | 800ms | 0ms |
| 图片质量 | 1.0 | 0.9 |
| 预计生成时间 | 15秒+ | 1-2秒 |

## ✅ 测试步骤

### 1. 编译运行
```
点击"编译"按钮
等待编译完成
```

### 2. 生成卡片
```
选择：上海 + 2天 + 亲子遛娃
点击"3秒出卡"
```

### 3. 观察日志
应该看到：
```
✅ 开始生成卡片
✅ 云函数调用成功
✅ 开始绘制图片
✅ 背景绘制完成
✅ 卡片绘制完成
✅ 标题绘制完成
✅ 开始绘制小程序码
✅ 小程序码绘制完成
✅ 所有内容绘制完成
✅ ctx.draw() 回调执行
✅ 准备转换为图片
✅ canvasToImage 被调用
✅ 图片生成成功
```

### 4. 检查结果
```
✅ 图片应该在 1-2 秒内显示
✅ 图片包含所有内容
✅ 小程序码显示在右下角
✅ 没有延迟感
```

## 🐛 如果还是慢

### 检查 1：小程序码图片是否存在
```
确认：miniprogram/images/3s.jpg 存在
如果不存在，会导致绘制失败
```

### 检查 2：Canvas 尺寸是否过大
```
查看日志：计算的画布高度
如果超过 3000px，可能会慢
解决：限制最大高度
```

### 检查 3：图片质量设置
```
当前：quality: 0.9
如果还慢，可以降低到 0.8
```

### 检查 4：真机测试
```
开发者工具可能比真机慢
建议在真机上测试
```

## 💡 进一步优化建议

### 1. 限制 Canvas 最大高度
```javascript
const canvasHeight = Math.min(estimatedHeight, 3000);
```

### 2. 降低图片质量
```javascript
quality: 0.8  // 从 0.9 降低到 0.8
```

### 3. 使用 Canvas 2D API
```javascript
// 更高性能的 Canvas API
const canvas = await wx.createSelectorQuery()
  .select('#cardCanvas')
  .node()
  .exec();
```

### 4. 预加载小程序码
```javascript
// 在 onLoad 时预加载
wx.getImageInfo({
  src: '/images/3s.jpg',
  success: (res) => {
    console.log('小程序码预加载成功');
  }
});
```

## 📊 预期效果

优化后的性能：
- **文字版**：<1 秒
- **图片版**：1-2 秒
- **主题切换**：1-2 秒
- **背景切换**：1-2 秒

## 🎉 总结

优化要点：
1. ✅ 合并绘制，只调用一次 ctx.draw()
2. ✅ 移除所有延迟
3. ✅ 优化 canvasToTempFilePath 参数
4. ✅ 删除不必要的函数
5. ✅ 降低图片质量到 0.9

现在请编译测试，图片应该能在 1-2 秒内显示！🚀

