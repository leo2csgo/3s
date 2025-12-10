// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    stats: {
      tripCount: 0,
      poiCount: 0,
      cityCount: 0,
    },
    favorites: [],
    settings: {
      defaultCity: "",
      mapApp: "微信地图",
      darkMode: false,
    },
  },

  onLoad() {
    this.loadUserData();
  },

  onShow() {
    this.loadStats();
  },

  // 加载用户数据
  loadUserData() {
    // 读取用户信息
    const userInfo = wx.getStorageSync("userInfo") || null;
    const settings = wx.getStorageSync("user_settings") || this.data.settings;
    const favorites = wx.getStorageSync("user_favorites") || [];

    this.setData({
      userInfo,
      settings,
      favorites,
    });
  },

  // 加载统计数据（云函数）
  loadStats() {
    wx.cloud
      .callFunction({ name: "trip-service", data: { action: "stats" } })
      .then((res) => {
        const { tripCount = 0, poiCount = 0, cityCount = 0 } = res.result || {};
        this.setData({
          "stats.tripCount": tripCount,
          "stats.poiCount": poiCount,
          "stats.cityCount": cityCount,
        });
      })
      .catch((err) => {
        console.error("统计失败:", err);
      });
  },

  // 跳转到收藏夹
  goToFavorites() {
    wx.showToast({ title: "收藏功能开发中", icon: "none" });
  },

  // 跳转到历史
  goToHistory() {
    wx.showToast({ title: "历史功能开发中", icon: "none" });
  },

  // 跳转到离线
  goToDownloads() {
    wx.showToast({ title: "离线功能开发中", icon: "none" });
  },

  // 设置默认城市
  setDefaultCity() {
    const cities = ["上海", "北京", "广州", "深圳", "杭州", "成都", "西安"];
    wx.showActionSheet({
      itemList: cities,
      success: (res) => {
        const city = cities[res.tapIndex];
        this.setData({ "settings.defaultCity": city });
        wx.setStorageSync("user_settings", this.data.settings);
        wx.showToast({ title: `已设置为 ${city}`, icon: "success" });
      },
    });
  },

  // 设置地图偏好
  setMapApp() {
    const maps = ["微信地图", "高德地图", "百度地图", "腾讯地图"];
    wx.showActionSheet({
      itemList: maps,
      success: (res) => {
        const mapApp = maps[res.tapIndex];
        this.setData({ "settings.mapApp": mapApp });
        wx.setStorageSync("user_settings", this.data.settings);
        wx.showToast({ title: `已切换到 ${mapApp}`, icon: "success" });
      },
    });
  },

  // 切换深色模式
  toggleDarkMode(e) {
    const darkMode = e.detail.value;
    this.setData({ "settings.darkMode": darkMode });
    wx.setStorageSync("user_settings", this.data.settings);
    wx.showToast({
      title: darkMode ? "已开启深色模式" : "已关闭深色模式",
      icon: "none",
    });
  },

  // 意见反馈
  goToFeedback() {
    wx.showModal({
      title: "意见反馈",
      content: "如有问题或建议，请发送邮件至 feedback@example.com",
      showCancel: false,
    });
  },

  // 关于我们
  goToAbout() {
    wx.showModal({
      title: "关于路书",
      content:
        "路书 v1.0.0\n\n一款 Notion 风格的智能行程规划工具，让旅行规划变得简单有趣。",
      showCancel: false,
    });
  },

  // 分享
  // 一次性迁移脚本：将本地 user_trips 迁移到云数据库
  async migrateLocalTripsToCloud() {
    const localTrips = wx.getStorageSync("user_trips") || [];
    if (!localTrips.length) {
      wx.showToast({ title: "本地无可迁移数据", icon: "none" });
      return;
    }
    wx.showLoading({ title: "迁移中..." });
    try {
      for (const t of localTrips) {
        const tripInfo = {
          title: t.title,
          city: t.city,
          days: t.days,
          intent: t.intent || "",
          coverImage: t.coverImage || "",
          status: t.status || "planning",
          meta: t.meta || { totalCost: 0 },
          createdAt: t.createdAt || Date.now(),
          updatedAt: t.updatedAt || Date.now(),
        };
        const blocks = t.blocks || [];
        await wx.cloud.callFunction({
          name: "trip-service",
          data: { action: "create", payload: { tripInfo, blocks } },
        });
      }
      wx.hideLoading();
      wx.showToast({ title: "迁移完成", icon: "success" });
    } catch (err) {
      wx.hideLoading();
      console.error("迁移失败:", err);
      wx.showToast({ title: "迁移失败", icon: "none" });
    }
  },

  onShareAppMessage() {
    return {
      title: "路书 - 智能行程规划助手",
      path: "/pages/discover/discover",
    };
  },
});
