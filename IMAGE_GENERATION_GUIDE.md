# 图片生成功能实现指南

## 当前状态

目前云函数生成的是文本文件（.txt），需要升级为真正的图片生成功能。

## 实现方案

### 方案一：使用小程序端 Canvas（推荐）

**优点**：
- 无需云函数处理图片
- 可以使用小程序的 Canvas API
- 性能较好

**实现步骤**：

1. 在 `pages/index/index.wxml` 中添加隐藏的 Canvas：
```xml
<canvas canvas-id="cardCanvas" style="width: 750px; height: 750px; position: fixed; left: -9999px;"></canvas>
```

2. 修改 `generateCard` 函数，让云函数只返回行程数据：
```javascript
// 云函数返回
return {
  success: true,
  plan: plan  // 只返回行程数据
};
```

3. 在小程序端绘制图片：
```javascript
drawCardImage(plan) {
  const ctx = wx.createCanvasContext('cardCanvas');
  
  // 绘制背景
  ctx.setFillStyle('#667eea');
  ctx.fillRect(0, 0, 750, 750);
  
  // 绘制标题
  ctx.setFontSize(40);
  ctx.setFillStyle('#ffffff');
  ctx.fillText('3秒出卡', 375, 100);
  
  // 绘制行程内容
  let y = 200;
  plan.days.forEach(day => {
    ctx.setFontSize(30);
    ctx.fillText(`第${day.day}天`, 50, y);
    y += 50;
    
    day.activities.forEach(activity => {
      ctx.setFontSize(24);
      ctx.fillText(`• ${activity.name}`, 70, y);
      y += 40;
    });
    y += 20;
  });
  
  // 绘制费用和提示
  ctx.setFontSize(28);
  ctx.fillText(`预估费用：¥${plan.total_cost}`, 50, y);
  y += 50;
  ctx.fillText(plan.tips, 50, y);
  
  ctx.draw(false, () => {
    // 导出图片
    wx.canvasToTempFilePath({
      canvasId: 'cardCanvas',
      success: res => {
        this.setData({
          cardImageUrl: res.tempFilePath
        });
      }
    });
  });
}
```

### 方案二：使用云函数 + node-canvas

**优点**：
- 服务端生成，前端无需处理
- 可以生成更复杂的图片

**缺点**：
- 需要在云函数中安装 node-canvas
- 云函数环境可能有限制

**实现步骤**：

1. 在 `cloudfunctions/generateCard/package.json` 中添加依赖：
```json
{
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "canvas": "^2.11.2"
  }
}
```

2. 修改云函数代码使用 canvas 绘图

### 方案三：使用第三方图片生成服务

调用第三方 API 生成图片（如阿里云、腾讯云的图片处理服务）

## 添加小程序码

在图片生成后，调用微信开放接口生成小程序码：

```javascript
// 在云函数中
const result = await cloud.openapi.wxacode.getUnlimited({
  scene: 'card_id_123',
  page: 'pages/index/index',
  width: 280
});

// 将小程序码绘制到卡片图的右下角
```

## 背景图设计建议

1. 尺寸：750x750px（适配小程序）
2. 格式：PNG（支持透明度）
3. 设计元素：
   - 品牌 Logo
   - Slogan："3秒出卡 - 智能生成你的专属行程"
   - 装饰性图案
   - 预留文字区域

## 下一步

选择一个方案并实现图片生成功能。推荐使用方案一（小程序端 Canvas），因为实现简单且性能好。

