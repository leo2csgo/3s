// pages/trips/trips.js
Page({
  data: {
    loading: false,
    currentStatus: "all",
    trips: [],
    filteredTrips: [],
    tripCounts: {
      all: 0,
      planning: 0,
      ongoing: 0,
      completed: 0,
    },
  },

  onLoad() {
    this.loadTrips();
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadTrips();
  },

  onPullDownRefresh() {
    this.loadTrips().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载行程列表（云函数）
  async loadTrips() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: "trip-service",
        data: { action: "list" },
      });
      const tripsData = (res.result && res.result.data) || [];

      const counts = {
        all: tripsData.length,
        planning: tripsData.filter((t) => t.status === "planning").length,
        ongoing: tripsData.filter((t) => t.status === "ongoing").length,
        completed: tripsData.filter((t) => t.status === "completed").length,
      };

      this.setData({
        trips: tripsData,
        tripCounts: counts,
        loading: false,
      });

      this.filterTrips();
    } catch (err) {
      console.error("加载行程失败:", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  // 切换状态筛选
  switchStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ currentStatus: status });
    this.filterTrips();
  },

  // 筛选行程
  filterTrips() {
    const { trips, currentStatus } = this.data;

    let filtered = trips;
    if (currentStatus !== "all") {
      filtered = trips.filter((t) => t.status === currentStatus);
    }

    // 格式化日期显示
    filtered = filtered.map((trip) => ({
      ...trip,
      createdAt: this.formatDate(trip.createdAt),
    }));

    this.setData({ filteredTrips: filtered });
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 跳转到详情页
  goToDetail(e) {
    const tripId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/trip-detail/trip-detail?id=${tripId}`,
    });
  },

  // 显示操作菜单
  showActions(e) {
    const tripId = e.currentTarget.dataset.id;
    const trip = this.data.trips.find((t) => t._id === tripId);

    wx.showActionSheet({
      itemList: ["编辑", "复制", "分享", "删除"],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.goToDetail({ currentTarget: { dataset: { id: tripId } } });
            break;
          case 1:
            this.copyTrip(tripId);
            break;
          case 2:
            this.shareTrip(tripId);
            break;
          case 3:
            this.deleteTrip(tripId);
            break;
        }
      },
    });
  },

  // 复制行程
  copyTrip(tripId) {
    wx.showToast({ title: "复制功能开发中", icon: "none" });
  },

  // 分享行程
  shareTrip(tripId) {
    wx.showToast({ title: "分享功能开发中", icon: "none" });
  },

  // 删除行程（云函数）
  deleteTrip(tripId) {
    wx.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除吗？",
      success: (res) => {
        if (res.confirm) {
          wx.cloud
            .callFunction({
              name: "trip-service",
              data: { action: "delete", payload: { id: tripId } },
            })
            .then(() => {
              this.loadTrips();
              wx.showToast({ title: "已删除", icon: "success" });
            })
            .catch((err) => {
              console.error("删除失败:", err);
              wx.showToast({ title: "删除失败", icon: "none" });
            });
        }
      },
    });
  },

  // 跳转到发现页
  goToDiscover() {
    wx.switchTab({ url: "/pages/discover/discover" });
  },
});
