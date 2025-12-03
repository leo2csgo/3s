# V4 完整功能实现指南

## ✅ 已完成功能

### 1. 全屏显示图片 🖼️

**功能说明**：
- 点击图片可全屏查看
- 支持放大显示
- 点击任意位置关闭全屏

**使用方式**：
1. 生成卡片后，点击图片
2. 图片全屏显示，背景半透明黑色
3. 点击任意位置返回

**实现细节**：
- 添加 `showFullscreen` 状态控制
- 使用 `fullscreen-overlay` 遮罩层
- 图片 `mode="widthFix"` 自适应宽度

### 2. 主题选择器 🎨

**功能说明**：
- 点击主题按钮弹出选择器
- 4种主题可选
- 选中主题自动重绘图片

**使用方式**：
1. 点击"🎨 主题名"按钮
2. 底部弹出主题选择器
3. 点击任意主题切换
4. 点击"关闭"或遮罩层关闭选择器

**主题列表**：
- 🟣 紫梦 - 紫蓝渐变
- 🌸 粉樱 - 粉红渐变
- 💚 青柠 - 蓝青渐变
- 🧡 橙光 - 橙黄渐变

**注意**：
- 主题按钮仅在图片版显示
- 文字版自动隐藏主题按钮

### 3. 小程序码生成 📱

**功能说明**：
- 自动调用云函数生成小程序码
- 小程序码绘制到图片右下角
- 支持扫码直达小程序

**云函数**：`generateQRCode`
- 调用微信 API `wxacode.getUnlimited`
- 上传到云存储
- 返回 fileID

**实现流程**：
1. 绘制卡片时调用 `addQRCodeToCanvas()`
2. 云函数生成小程序码
3. 下载小程序码图片
4. 绘制到 Canvas 指定位置
5. 转换为最终图片

**部署步骤**：
```bash
# 上传云函数
右键 cloudfunctions/generateQRCode
选择"上传并部署：云端安装依赖"
```

## 🚧 待实现功能

### 4. 活动照片显示 📸

**数据准备**：
- 已创建 `sample_activities_with_photos.json`
- 每个活动包含 `photo_url` 字段
- 使用占位图片 URL

**实现方案**：

#### 方案 A：小图标模式（推荐）
在活动名称旁边显示小图标：
```javascript
// 在绘制活动时
if (activity.photo_url) {
  // 下载图片
  wx.downloadFile({
    url: activity.photo_url,
    success: (res) => {
      // 绘制小图标 (60x60)
      ctx.drawImage(res.tempFilePath, x, y, 60, 60);
    }
  });
}
```

#### 方案 B：大图模式
在每个活动下方显示大图：
```javascript
// 预留图片区域
const photoHeight = 120;
if (activity.photo_url) {
  ctx.drawImage(photoPath, infoX, y, 200, photoHeight);
  y += photoHeight + 20;
}
```

**注意事项**：
- 需要异步下载图片
- 建议预加载所有图片
- 图片加载失败需要降级处理

### 5. 自定义背景图 🎨

**实现方案**：

#### 方案 A：预设背景模板
```javascript
data: {
  backgrounds: [
    { name: "默认", url: "" },
    { name: "星空", url: "cloud://xxx/bg1.jpg" },
    { name: "海洋", url: "cloud://xxx/bg2.jpg" },
    { name: "森林", url: "cloud://xxx/bg3.jpg" },
  ],
  bgIndex: 0
}

// 绘制背景
drawBackground(ctx, bgUrl) {
  if (bgUrl) {
    wx.downloadFile({
      url: bgUrl,
      success: (res) => {
        ctx.drawImage(res.tempFilePath, 0, 0, canvasWidth, canvasHeight);
      }
    });
  } else {
    // 使用渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, theme.bg1);
    gradient.addColorStop(1, theme.bg2);
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}
```

#### 方案 B：用户上传背景
```javascript
// 选择图片
chooseBackground() {
  wx.chooseImage({
    count: 1,
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      // 上传到云存储
      wx.cloud.uploadFile({
        cloudPath: `backgrounds/${Date.now()}.jpg`,
        filePath: tempFilePath,
        success: (uploadRes) => {
          this.setData({
            customBgUrl: uploadRes.fileID
          });
          // 重新绘制
          this.drawCardImage(this.data.planData);
        }
      });
    }
  });
}
```

## 📝 部署清单

### 必须完成的步骤

1. **上传云函数**
   ```
   ✅ generateCard - 已上传
   ⚠️ generateQRCode - 需要上传
   ```

2. **更新数据库**
   ```
   选项 A: 保持现有数据（不显示照片）
   选项 B: 导入 sample_activities_with_photos.json（显示照片）
   ```

3. **测试功能**
   - [ ] 全屏显示
   - [ ] 主题切换
   - [ ] 小程序码生成
   - [ ] 活动照片（如果实现）
   - [ ] 自定义背景（如果实现）

## 🎯 快速测试

### 测试全屏和主题

1. 编译运行小程序
2. 生成卡片
3. 点击图片 → 全屏显示
4. 点击屏幕 → 关闭全屏
5. 点击"🎨 紫梦" → 弹出选择器
6. 选择"粉樱" → 图片重绘

### 测试小程序码

1. 上传 `generateQRCode` 云函数
2. 生成卡片
3. 查看图片右下角是否有小程序码
4. 如果没有，查看控制台日志

## 📊 功能对比

| 功能 | 状态 | 优先级 | 说明 |
|------|------|--------|------|
| 全屏显示 | ✅ 完成 | P0 | 必须 |
| 主题选择 | ✅ 完成 | P0 | 必须 |
| 小程序码 | ✅ 完成 | P1 | 重要 |
| 活动照片 | ⚠️ 待实现 | P2 | 可选 |
| 自定义背景 | ⚠️ 待实现 | P2 | 可选 |

## 🚀 下一步建议

### 最小可用版本（MVP）
- ✅ 全屏显示
- ✅ 主题选择
- ✅ 小程序码
- ❌ 活动照片（暂不实现）
- ❌ 自定义背景（暂不实现）

### 完整版本
如需实现活动照片和自定义背景：
1. 准备真实的活动图片 URL
2. 实现图片预加载逻辑
3. 优化绘制性能
4. 添加加载进度提示

## 📞 需要帮助？

如有问题，请查看：
- `FEATURE_UPGRADE_V3.md` - V3 功能说明
- `UPDATE_LOG.md` - 完整更新日志
- 控制台日志和云函数日志

祝使用愉快！🎉

