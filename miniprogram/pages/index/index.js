Page({
  data: {
    cities: ["上海", "杭州", "广州", "北京", "成都"],
    cityIndex: 0,
    days: [1, 2, 3],
    dayIndex: 1, // 默认2天
    intents: ["亲子遛娃", "情侣约会", "朋友小聚", "美食探店"],
    intentIndex: 0,
    loading: false,
    cardImageUrl: "",
    cardContent: "", // 存储文本内容
    cardImagePath: "", // 存储生成的图片路径
    viewMode: "image", // 默认显示图片版 text | image
    planData: null, // 存储行程数据
    themeIndex: 0, // 当前主题索引
    themes: [
      { name: "紫梦", bg1: "#667eea", bg2: "#764ba2", primary: "#667eea" },
      { name: "粉樱", bg1: "#f093fb", bg2: "#f5576c", primary: "#f5576c" },
      { name: "青柠", bg1: "#4facfe", bg2: "#00f2fe", primary: "#4facfe" },
      { name: "橙光", bg1: "#fa709a", bg2: "#fee140", primary: "#fa709a" },
    ],
    showFullscreen: false, // 是否全屏显示
    showThemeSelector: false, // 是否显示主题选择器
    showBgSelector: false, // 是否显示背景选择器
    backgrounds: [
      {
        name: "渐变",
        type: "gradient",
        color1: "#667eea",
        color2: "#764ba2",
        textColor: "#ffffff",
        cardBg: "rgba(255, 255, 255, 0.95)",
      },
      {
        name: "星空",
        type: "gradient",
        color1: "#1a1a2e",
        color2: "#16213e",
        textColor: "#ffffff",
        cardBg: "rgba(255, 255, 255, 0.95)",
      },
      {
        name: "海洋",
        type: "gradient",
        color1: "#0f2027",
        color2: "#2c5364",
        textColor: "#ffffff",
        cardBg: "rgba(255, 255, 255, 0.95)",
      },
      {
        name: "森林",
        type: "gradient",
        color1: "#134e5e",
        color2: "#71b280",
        textColor: "#ffffff",
        cardBg: "rgba(255, 255, 255, 0.95)",
      },
      {
        name: "自定义",
        type: "image",
        url: "",
        textColor: "#ffffff",
        cardBg: "rgba(255, 255, 255, 0.95)",
      },
    ],
    bgIndex: 0, // 当前背景索引
    customBgUrl: "", // 自定义背景图URL
  },

  onLoad() {
    console.log("页面加载");
  },

  // 城市选择变化
  onCityChange(e) {
    this.setData({
      cityIndex: parseInt(e.detail.value),
    });
  },

  // 天数选择变化
  onDayChange(e) {
    this.setData({
      dayIndex: parseInt(e.detail.value),
    });
  },

  // 出行目的选择
  onIntentChange(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      intentIndex: index,
    });
  },

  // 生成卡片
  generateCard() {
    const { cities, cityIndex, days, dayIndex, intents, intentIndex } =
      this.data;

    // 显示加载状态
    this.setData({
      loading: true,
      cardImageUrl: "", // 清空之前的结果
      cardContent: "",
    });

    console.log("开始生成卡片:", {
      city: cities[cityIndex],
      days: days[dayIndex],
      intent_tag: intents[intentIndex],
    });

    // 调用云函数
    wx.cloud.callFunction({
      name: "generateCard",
      data: {
        city: cities[cityIndex],
        days: days[dayIndex],
        intent_tag: intents[intentIndex],
      },
      success: (res) => {
        console.log("云函数调用成功", res);

        // 检查返回结果
        if (!res.result) {
          wx.showToast({
            title: "返回数据为空",
            icon: "none",
          });
          this.setData({ loading: false });
          return;
        }

        if (!res.result.success) {
          wx.showToast({
            title: res.result.message || "生成失败",
            icon: "none",
            duration: 3000,
          });
          console.error("生成失败:", res.result);
          this.setData({ loading: false });
          return;
        }

        if (res.result.fileID) {
          // 获取临时链接
          wx.cloud.getTempFileURL({
            fileList: [res.result.fileID],
            success: (tempRes) => {
              if (tempRes.fileList && tempRes.fileList.length > 0) {
                const fileUrl = tempRes.fileList[0].tempFileURL;

                // 下载文本内容并显示
                wx.downloadFile({
                  url: fileUrl,
                  success: (downloadRes) => {
                    if (downloadRes.statusCode === 200) {
                      // 读取文本内容
                      const fs = wx.getFileSystemManager();
                      fs.readFile({
                        filePath: downloadRes.tempFilePath,
                        encoding: "utf8",
                        success: (readRes) => {
                          this.setData({
                            cardImageUrl: fileUrl,
                            cardContent: readRes.data,
                            planData: res.result.plan,
                            loading: false,
                          });

                          // 生成图片卡片
                          this.drawCardImage(res.result.plan);

                          wx.showToast({
                            title: "生成成功！",
                            icon: "success",
                          });
                        },
                        fail: (readErr) => {
                          console.error("读取文件失败", readErr);
                          this.setData({
                            cardImageUrl: fileUrl,
                            loading: false,
                          });
                        },
                      });
                    }
                  },
                  fail: (downloadErr) => {
                    console.error("下载文件失败", downloadErr);
                    this.setData({
                      cardImageUrl: fileUrl,
                      loading: false,
                    });
                  },
                });
              }
            },
            fail: (err) => {
              console.error("获取临时链接失败", err);
              wx.showToast({
                title: "获取文件失败",
                icon: "none",
              });
              this.setData({ loading: false });
            },
          });
        } else {
          wx.showToast({
            title: "未返回文件ID",
            icon: "none",
          });
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        console.error("云函数调用失败", err);
        wx.showToast({
          title: "调用失败: " + err.errMsg,
          icon: "none",
          duration: 3000,
        });
        this.setData({ loading: false });
      },
    });
  },

  // 保存到相册
  saveToAlbum() {
    const { cardImagePath } = this.data;

    if (!cardImagePath) {
      wx.showToast({
        title: "请先生成卡片",
        icon: "none",
      });
      return;
    }

    // 保存图片到相册
    wx.saveImageToPhotosAlbum({
      filePath: cardImagePath,
      success: () => {
        wx.showToast({
          title: "已保存到相册",
          icon: "success",
        });
      },
      fail: (err) => {
        if (err.errMsg.includes("auth deny")) {
          wx.showModal({
            title: "提示",
            content: "需要您授权保存相册",
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            },
          });
        } else {
          console.error("保存失败:", err);
          wx.showToast({
            title: "保存失败",
            icon: "none",
          });
        }
      },
    });
  },

  // 切换视图模式
  switchViewMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      viewMode: mode,
    });
  },

  // 显示主题选择器
  showThemeSelector() {
    this.setData({
      showThemeSelector: true,
    });
  },

  // 隐藏主题选择器
  hideThemeSelector() {
    this.setData({
      showThemeSelector: false,
    });
  },

  // 选择主题
  selectTheme(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const { themes, planData } = this.data;

    this.setData({
      themeIndex: index,
      showThemeSelector: false,
    });

    // 如果已有行程数据，重新绘制
    if (planData) {
      wx.showToast({
        title: `切换到${themes[index].name}主题`,
        icon: "none",
        duration: 1500,
      });
      this.drawCardImage(planData);
    }
  },

  // 全屏显示图片
  showFullscreenImage() {
    this.setData({
      showFullscreen: true,
    });
  },

  // 关闭全屏
  closeFullscreen() {
    this.setData({
      showFullscreen: false,
    });
  },

  // 显示背景选择器
  showBgSelector() {
    this.setData({
      showBgSelector: true,
    });
  },

  // 隐藏背景选择器
  hideBgSelector() {
    this.setData({
      showBgSelector: false,
    });
  },

  // 选择背景
  selectBackground(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const { backgrounds, planData } = this.data;
    const bg = backgrounds[index];

    console.log("选择背景:", bg.name, "索引:", index);

    // 如果是自定义背景，打开图片选择
    if (bg.type === "image") {
      this.uploadCustomBackground();
      return;
    }

    this.setData({
      bgIndex: index,
      showBgSelector: false,
    });

    // 重新绘制
    if (planData) {
      wx.showToast({
        title: `切换到${bg.name}背景`,
        icon: "none",
        duration: 1500,
      });
      this.drawCardImage(planData);
    }
  },

  // 上传自定义背景
  uploadCustomBackground() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];

        // 直接使用临时文件路径
        this.setData({
          customBgUrl: tempFilePath,
          bgIndex: 4, // 自定义背景索引
          showBgSelector: false,
        });

        wx.showToast({
          title: "背景已更换",
          icon: "success",
        });

        // 重新绘制
        if (this.data.planData) {
          this.drawCardImage(this.data.planData);
        }
      },
      fail: () => {
        wx.showToast({
          title: "取消选择",
          icon: "none",
        });
      },
    });
  },

  // 复制文本
  copyText() {
    const { cardContent } = this.data;
    if (!cardContent) {
      wx.showToast({
        title: "暂无内容",
        icon: "none",
      });
      return;
    }

    wx.setClipboardData({
      data: cardContent,
      success: () => {
        wx.showToast({
          title: "已复制到剪贴板",
          icon: "success",
        });
      },
      fail: () => {
        wx.showToast({
          title: "复制失败",
          icon: "none",
        });
      },
    });
  },

  // 重新生成
  regenerate() {
    this.generateCard();
  },

  // 绘制卡片图片（简化版，直接绘制）
  drawCardImage(plan) {
    const {
      cities,
      cityIndex,
      intents,
      intentIndex,
      days,
      dayIndex,
      themeIndex,
      themes,
    } = this.data;

    console.log("开始绘制图片，行程数据:", plan);

    // 动态计算画布高度
    const canvasWidth = 750;
    let estimatedHeight = 400; // 基础高度

    // 每天行程增加高度
    plan.days.forEach((day) => {
      estimatedHeight += 100; // 日期标题
      day.activities.forEach((activity) => {
        estimatedHeight += 180; // 每个活动
      });
      estimatedHeight += 40; // 天数间隔
    });

    estimatedHeight += 300; // 底部信息和小程序码区域
    const canvasHeight = Math.max(estimatedHeight, 1000);

    console.log("计算的画布高度:", canvasHeight);

    // 更新 Canvas 尺寸
    this.setData({
      canvasHeight: canvasHeight,
    });

    const ctx = wx.createCanvasContext("cardCanvas", this);
    const theme = themes[themeIndex];
    const { backgrounds, bgIndex } = this.data;
    const currentBg = backgrounds[bgIndex];

    // 绘制背景（根据选择的背景类型）
    this.drawSimpleBackground(ctx, canvasWidth, canvasHeight, theme);
    console.log("背景绘制完成");

    // 绘制半透明卡片区域（使用背景配置的卡片颜色）
    ctx.setFillStyle(currentBg.cardBg || "rgba(255, 255, 255, 0.95)");
    ctx.setShadow(0, 10, 30, "rgba(0, 0, 0, 0.1)");
    const cardPadding = 40;
    const cardWidth = canvasWidth - cardPadding * 2;
    const cardHeight = canvasHeight - cardPadding * 2;
    this.roundRect(ctx, cardPadding, cardPadding, cardWidth, cardHeight, 20);
    ctx.fill();
    ctx.setShadow(0, 0, 0, "rgba(0, 0, 0, 0)");
    console.log("卡片绘制完成");

    let y = 100;

    // 绘制标题
    ctx.setFillStyle(theme.primary);
    ctx.setFontSize(48);
    ctx.setTextAlign("center");
    ctx.fillText("3秒出卡", canvasWidth / 2, y);
    y += 60;
    console.log("标题绘制完成");

    ctx.setFillStyle("#999");
    ctx.setFontSize(28);
    ctx.fillText("智能生成你的专属行程", canvasWidth / 2, y);
    y += 80;

    // 绘制信息栏
    ctx.setTextAlign("left");
    ctx.setFillStyle("#333");
    ctx.setFontSize(32);
    const infoX = 80;

    ctx.fillText(`📍 城市：${cities[cityIndex]}`, infoX, y);
    y += 50;
    ctx.fillText(`📅 天数：${days[dayIndex]}天`, infoX, y);
    y += 50;
    ctx.fillText(`🎯 目的：${intents[intentIndex]}`, infoX, y);
    y += 70;

    // 绘制分隔线
    ctx.setStrokeStyle("#e0e0e0");
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(canvasWidth - 60, y);
    ctx.stroke();
    y += 50;

    // 绘制每天的行程
    plan.days.forEach((day, dayIdx) => {
      // 日期标题
      ctx.setFillStyle(theme.primary);
      ctx.setFontSize(36);
      ctx.fillText(`📆 第${day.day}天行程`, infoX, y);
      y += 60;

      // 活动列表
      day.activities.forEach((activity, actIndex) => {
        const time =
          actIndex === 0 ? "09:00" : actIndex === 1 ? "13:00" : "16:00";

        // 时间和活动名称
        ctx.setFillStyle("#333");
        ctx.setFontSize(28);
        const activityName = this.wrapText(
          ctx,
          `${time} | ${activity.name}`,
          canvasWidth - infoX - 100,
          28
        );
        activityName.forEach((line, idx) => {
          ctx.fillText(line, infoX + 20, y + idx * 40);
        });
        y += activityName.length * 40 + 5;

        // 时长和费用
        ctx.setFillStyle("#666");
        ctx.setFontSize(24);
        ctx.fillText(
          `⏱ ${activity.duration}小时 | 💰 ¥${activity.cost}`,
          infoX + 40,
          y
        );
        y += 40;

        // 描述（自动换行）
        ctx.setFillStyle("#999");
        ctx.setFontSize(22);
        const descLines = this.wrapText(
          ctx,
          `📝 ${activity.description}`,
          canvasWidth - infoX - 100,
          22
        );
        descLines.forEach((line, idx) => {
          ctx.fillText(line, infoX + 40, y + idx * 35);
        });
        y += descLines.length * 35 + 15;
      });

      // 天数之间的间隔
      if (dayIdx < plan.days.length - 1) {
        y += 20;
      }
    });

    // 绘制底部信息
    y += 30;
    ctx.setStrokeStyle("#e0e0e0");
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(canvasWidth - 60, y);
    ctx.stroke();
    y += 50;

    ctx.setTextAlign("left");
    ctx.setFillStyle(theme.primary);
    ctx.setFontSize(32);
    ctx.fillText(`💵 预估总费用：¥${plan.total_cost}`, infoX, y);
    y += 50;

    ctx.setFillStyle("#666");
    ctx.setFontSize(26);
    const tipsLines = this.wrapText(
      ctx,
      `💡 ${plan.tips}`,
      canvasWidth - infoX - 100,
      26
    );
    tipsLines.forEach((line, idx) => {
      ctx.fillText(line, infoX, y + idx * 40);
    });
    y += tipsLines.length * 40 + 40;

    // 绘制小程序码区域
    const qrSize = 120;
    const qrX = canvasWidth - qrSize - 80;
    const qrY = y;

    // 绘制小程序码占位框
    ctx.setStrokeStyle("#ddd");
    ctx.setLineWidth(2);
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);

    // 绘制小程序码提示文字
    ctx.setFillStyle("#999");
    ctx.setFontSize(20);
    ctx.setTextAlign("center");
    ctx.fillText("扫码", qrX + qrSize / 2, qrY + qrSize / 2 - 10);
    ctx.fillText("打开小程序", qrX + qrSize / 2, qrY + qrSize / 2 + 15);

    // 左侧文字
    ctx.setTextAlign("left");
    ctx.setFillStyle("#333");
    ctx.setFontSize(24);
    ctx.fillText("长按保存图片", infoX, qrY + 40);
    ctx.setFillStyle("#999");
    ctx.setFontSize(20);
    ctx.fillText("分享给好友，一起出发", infoX, qrY + 70);

    // 主题标识
    ctx.setFillStyle("#ccc");
    ctx.setFontSize(18);
    ctx.setTextAlign("center");
    ctx.fillText(`主题: ${theme.name}`, canvasWidth / 2, qrY + qrSize + 30);

    // 绘制小程序码（在同一个 draw 中完成）
    console.log("开始绘制小程序码");
    const qrCodePath = "/images/3s.jpg";
    ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);
    console.log("小程序码绘制完成");

    console.log("所有内容绘制完成，准备执行 ctx.draw()");

    // 一次性执行绘制
    ctx.draw(false, () => {
      console.log("ctx.draw() 回调执行");
      // 立即转换为图片
      console.log("准备转换为图片");
      this.canvasToImage();
    });
  },

  // 绘制背景（同步版本）
  drawBackgroundSync(ctx, canvasWidth, canvasHeight, theme) {
    return new Promise((resolve) => {
      const { backgrounds, bgIndex, customBgUrl } = this.data;
      const bg = backgrounds[bgIndex];

      if (bg.type === "gradient") {
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, theme.bg1);
        gradient.addColorStop(1, theme.bg2);
        ctx.setFillStyle(gradient);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        resolve();
      } else if (bg.type === "image" || bg.type === "custom") {
        // 图片背景
        const bgUrl = bg.type === "custom" ? customBgUrl : bg.url;

        if (bgUrl) {
          // 下载背景图
          wx.cloud
            .getTempFileURL({
              fileList: [bgUrl],
            })
            .then((res) => {
              if (res.fileList && res.fileList.length > 0) {
                const tempUrl = res.fileList[0].tempFileURL;

                wx.downloadFile({
                  url: tempUrl,
                  success: (downloadRes) => {
                    if (downloadRes.statusCode === 200) {
                      // 绘制背景图
                      ctx.drawImage(
                        downloadRes.tempFilePath,
                        0,
                        0,
                        canvasWidth,
                        canvasHeight
                      );

                      // 添加半透明遮罩，确保文字可读
                      ctx.setFillStyle("rgba(0, 0, 0, 0.3)");
                      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                      resolve();
                    } else {
                      // 下载失败，降级到渐变
                      this.drawGradientBackground(
                        ctx,
                        canvasWidth,
                        canvasHeight,
                        theme
                      );
                      resolve();
                    }
                  },
                  fail: () => {
                    // 下载失败，降级到渐变
                    this.drawGradientBackground(
                      ctx,
                      canvasWidth,
                      canvasHeight,
                      theme
                    );
                    resolve();
                  },
                });
              } else {
                // 获取临时链接失败，降级到渐变
                this.drawGradientBackground(
                  ctx,
                  canvasWidth,
                  canvasHeight,
                  theme
                );
                resolve();
              }
            })
            .catch(() => {
              // 云存储调用失败，降级到渐变
              this.drawGradientBackground(
                ctx,
                canvasWidth,
                canvasHeight,
                theme
              );
              resolve();
            });
        } else {
          // 没有URL，降级到渐变背景
          this.drawGradientBackground(ctx, canvasWidth, canvasHeight, theme);
          resolve();
        }
      } else {
        resolve();
      }
    });
  },

  // 简化的背景绘制（支持渐变和图片）
  drawSimpleBackground(ctx, canvasWidth, canvasHeight, theme) {
    const { backgrounds, bgIndex, customBgUrl } = this.data;
    const bg = backgrounds[bgIndex];

    console.log("绘制背景，类型:", bg.name, "索引:", bgIndex);

    // 如果是自定义图片背景
    if (bg.type === "image" && customBgUrl) {
      console.log("使用自定义背景图:", customBgUrl);
      // 绘制图片背景
      ctx.drawImage(customBgUrl, 0, 0, canvasWidth, canvasHeight);
      // 添加半透明遮罩
      ctx.setFillStyle("rgba(0, 0, 0, 0.2)");
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      // 使用渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, bg.color1);
      gradient.addColorStop(1, bg.color2);
      ctx.setFillStyle(gradient);
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  },

  // 绘制渐变背景
  drawGradientBackground(ctx, canvasWidth, canvasHeight, theme) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, theme.bg1);
    gradient.addColorStop(1, theme.bg2);
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  },

  // 文本自动换行
  wrapText(ctx, text, maxWidth, fontSize) {
    ctx.setFontSize(fontSize);
    const words = text.split("");
    const lines = [];
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  },

  // 绘制圆角矩形
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5);
    ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI);
    ctx.closePath();
  },

  // Canvas转图片
  canvasToImage() {
    console.log("canvasToImage 被调用，准备转换 Canvas 为图片");
    console.log("Canvas 高度:", this.data.canvasHeight);

    const { canvasHeight } = this.data;

    wx.canvasToTempFilePath(
      {
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
          console.log("✅ 图片生成成功:", res.tempFilePath);
          console.log("图片尺寸:", res.width, "x", res.height);

          this.setData({
            cardImagePath: res.tempFilePath,
            loading: false,
          });

          wx.showToast({
            title: "生成成功",
            icon: "success",
            duration: 1000,
          });
        },
        fail: (err) => {
          console.error("❌ 图片生成失败:", err);
          console.error("错误详情:", JSON.stringify(err));

          this.setData({
            loading: false,
          });

          wx.showToast({
            title: "图片生成失败",
            icon: "none",
          });
        },
      },
      this
    );
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: "3秒出卡 - 快来生成你的专属行程",
      path: "/pages/index/index",
      imageUrl: this.data.cardImagePath || this.data.cardImageUrl || "",
    };
  },
});
