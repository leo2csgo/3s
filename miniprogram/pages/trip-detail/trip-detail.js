// pages/trip-detail/trip-detail.js

// ============================================
// Block 工具函数
// ============================================

const BLOCK_TYPES = {
  DAY_DIVIDER: "day-divider",
  POI: "poi",
  TEXT: "text",
  TRANSPORT: "transport",
  IMAGE: "image",
};

const ORDER_INCREMENT = 100;

function generateBlockId() {
  return "blk_" + Math.random().toString(36).substr(2, 9);
}

function generateTripId() {
  return "trip_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
}

function createDayDividerBlock(dayIndex, label, order) {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.DAY_DIVIDER,
    order: order,
    content: {
      dayIndex: dayIndex,
      label: label || `Day ${dayIndex}`,
      date: "",
      theme: "",
    },
  };
}

function createPoiBlock(poiData, order) {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.POI,
    order: order,
    content: {
      name: poiData.name || "",
      startTime: poiData.startTime || poiData.time || "",
      duration: poiData.duration || 60,
      cost: poiData.cost || 0,
      address: poiData.address || "",
      description: poiData.description || "",
      location: poiData.location || null,
      tags: poiData.tags || [],
    },
  };
}

function createTextBlock(text, style, order) {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.TEXT,
    order: order,
    content: {
      text: text || "",
      style: style || "normal",
    },
  };
}

function createTransportBlock(transportData, order) {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.TRANSPORT,
    order: order,
    content: {
      mode: transportData.mode || "walk",
      duration: transportData.duration || 0,
      distance: transportData.distance || "",
      cost: transportData.cost || 0,
      note: transportData.note || "",
    },
  };
}

// ============================================
// Page 定义
// ============================================

Page({
  data: {
    // 系统信息
    statusBarHeight: 20,

    // 路书信息
    tripId: null,
    tripInfo: {
      id: "",
      title: "我的路书",
      city: "",
      days: 0,
      intent: "",
      meta: {
        totalCost: 0,
        tips: "",
      },
      createdAt: 0,
      updatedAt: 0,
    },
    blocks: [],

    // UI 状态
    editMode: false,
    showAddDrawer: false,
    currentBg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",

    // 插入位置
    insertAfterId: null,
  },

  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
    });

    // 解析参数
    if (options.id) {
      // 加载已有路书
      this.loadTrip(options.id);
    } else if (options.data) {
      // 从 AI 生成结果初始化
      try {
        const data = JSON.parse(decodeURIComponent(options.data));
        this.initFromGeneratedData(data);
      } catch (e) {
        console.error("解析数据失败:", e);
      }
    } else if (options.isNew) {
      // 新建空白路书
      this.initBlankTrip();
    }
  },

  // 加载已有路书（云函数）
  loadTrip(tripId) {
    wx.cloud
      .callFunction({
        name: "trip-service",
        data: { action: "detail", payload: { id: tripId } },
      })
      .then((res) => {
        const doc = res.result && res.result.data;
        if (doc) {
          this.setData({
            tripId: doc._id,
            tripInfo: {
              id: doc._id,
              title: doc.title,
              city: doc.city,
              days: doc.days,
              intent: doc.intent || "",
              meta: doc.meta || { totalCost: 0 },
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            },
            blocks: doc.blocks || [],
          });
        } else {
          wx.showToast({ title: "路书不存在", icon: "none" });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      })
      .catch((err) => {
        console.error("加载失败:", err);
        wx.showToast({ title: "加载失败", icon: "none" });
      });
  },

  // 从 AI 生成数据初始化（云函数创建）
  initFromGeneratedData(data) {
    const payload = {
      tripInfo: {
        title: `${data.city || ""}之旅`,
        city: data.city || "",
        days: data.days || 1,
        intent: data.intent || "",
        meta: { totalCost: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      blocks: data.blocks || [],
    };

    wx.cloud
      .callFunction({
        name: "trip-service",
        data: { action: "create", payload },
      })
      .then((res) => {
        const id = res.result && res.result._id;
        if (id) {
          this.setData({ editMode: true });
          this.loadTrip(id);
        } else {
          wx.showToast({ title: "创建失败", icon: "none" });
        }
      })
      .catch((err) => {
        console.error("创建失败:", err);
        wx.showToast({ title: "创建失败", icon: "none" });
      });
  },

  // 初始化空白路书（云函数创建）
  initBlankTrip() {
    const now = Date.now();
    const tripInfo = {
      title: "我的路书",
      city: "",
      days: 1,
      intent: "",
      meta: { totalCost: 0 },
      createdAt: now,
      updatedAt: now,
    };

    const blocks = [createDayDividerBlock(1, "Day 1", 100)];

    wx.cloud
      .callFunction({
        name: "trip-service",
        data: { action: "create", payload: { tripInfo, blocks } },
      })
      .then((res) => {
        const id = res.result && res.result._id;
        if (id) {
          this.setData({ editMode: true });
          this.loadTrip(id);
        } else {
          wx.showToast({ title: "创建失败", icon: "none" });
        }
      })
      .catch((err) => {
        console.error("创建失败:", err);
        wx.showToast({ title: "创建失败", icon: "none" });
      });
  },

  // ============================================
  // 导航
  // ============================================

  goBack() {
    // 如果有修改，先保存
    if (this.data.tripId) {
      this.saveTrip();
    }
    wx.navigateBack();
  },

  showMoreActions() {
    wx.showActionSheet({
      itemList: ["修改标题", "更换背景", "生成海报", "删除路书"],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.editTitle();
            break;
          case 1:
            this.changeBg();
            break;
          case 2:
            this.generatePoster();
            break;
          case 3:
            this.deleteTrip();
            break;
        }
      },
    });
  },

  // ============================================
  // 编辑模式切换
  // ============================================

  enterEditMode() {
    this.setData({ editMode: true });
  },

  exitEditMode() {
    this.setData({ editMode: false });
    this.saveTrip();
    wx.showToast({ title: "已保存", icon: "success" });
  },

  // ============================================
  // Block CRUD
  // ============================================

  updateBlock(blockId, newData) {
    const blocks = this.data.blocks.map((block) => {
      if (block.id === blockId) {
        return {
          ...block,
          content: { ...block.content, ...newData },
        };
      }
      return block;
    });

    this.setData({ blocks });
    this.updateTripMeta();
  },

  deleteBlock(blockId) {
    wx.showModal({
      title: "确认删除",
      content: "确定要删除这个模块吗？",
      success: (res) => {
        if (res.confirm) {
          const blocks = this.data.blocks.filter((b) => b.id !== blockId);
          this.setData({ blocks });
          this.updateTripMeta();
        }
      },
    });
  },

  insertBlock(e) {
    const afterId = e.currentTarget.dataset.afterId;
    const beforeId = e.currentTarget.dataset.beforeId;

    this.setData({
      insertAfterId: afterId || null,
      showAddDrawer: true,
    });
  },

  // ============================================
  // 添加模块
  // ============================================

  showAddMenu() {
    this.setData({
      insertAfterId: null,
      showAddDrawer: true,
    });
  },

  hideAddDrawer() {
    this.setData({ showAddDrawer: false });
  },

  stopPropagation() {
    // 阻止冒泡
  },

  addBlock(e) {
    const type = e.currentTarget.dataset.type;
    this.hideAddDrawer();

    switch (type) {
      case "poi":
        this.addPoiBlock();
        break;
      case "text":
        this.addTextBlock();
        break;
      case "transport":
        this.addTransportBlock();
        break;
      case "day-divider":
        this.addDayDividerBlock();
        break;
      case "image":
        this.addImageBlock();
        break;
    }
  },

  addPoiBlock() {
    wx.chooseLocation({
      success: (res) => {
        const order = this.getNextOrder();
        const block = createPoiBlock(
          {
            name: res.name || "未命名地点",
            address: res.address,
            location: { lat: res.latitude, lng: res.longitude },
          },
          order
        );
        this.insertBlockAtPosition(block);
      },
    });
  },

  addTextBlock() {
    wx.showModal({
      title: "添加备注",
      editable: true,
      placeholderText: "输入备注内容...",
      success: (res) => {
        if (res.confirm && res.content) {
          const order = this.getNextOrder();
          const block = createTextBlock(res.content, "tip", order);
          this.insertBlockAtPosition(block);
        }
      },
    });
  },

  addTransportBlock() {
    wx.showActionSheet({
      itemList: ["步行", "驾车", "公交", "地铁", "骑行"],
      success: (res) => {
        const modes = ["walk", "drive", "bus", "subway", "bike"];
        const order = this.getNextOrder();
        const block = createTransportBlock(
          { mode: modes[res.tapIndex] },
          order
        );
        this.insertBlockAtPosition(block);
      },
    });
  },

  addDayDividerBlock() {
    const currentDays = this.data.blocks.filter(
      (b) => b.type === BLOCK_TYPES.DAY_DIVIDER
    ).length;
    const order = this.getNextOrder();
    const block = createDayDividerBlock(
      currentDays + 1,
      `Day ${currentDays + 1}`,
      order
    );
    this.insertBlockAtPosition(block);

    // 更新 tripInfo 天数
    this.setData({
      "tripInfo.days": currentDays + 1,
    });
  },

  addImageBlock() {
    wx.showToast({ title: "图片功能开发中", icon: "none" });
  },

  addFromFavorites() {
    wx.showToast({ title: "收藏功能开发中", icon: "none" });
  },

  getNextOrder() {
    const { blocks, insertAfterId } = this.data;

    if (insertAfterId) {
      const index = blocks.findIndex((b) => b.id === insertAfterId);
      if (index >= 0 && index < blocks.length - 1) {
        // 在两个 block 之间插入
        return Math.floor((blocks[index].order + blocks[index + 1].order) / 2);
      } else if (index >= 0) {
        // 在最后一个后面插入
        return blocks[index].order + ORDER_INCREMENT;
      }
    }

    // 默认在最后添加
    if (blocks.length > 0) {
      return blocks[blocks.length - 1].order + ORDER_INCREMENT;
    }
    return ORDER_INCREMENT;
  },

  insertBlockAtPosition(block) {
    const blocks = [...this.data.blocks, block].sort(
      (a, b) => a.order - b.order
    );
    this.setData({ blocks });
    this.updateTripMeta();
  },

  // ============================================
  // Block 事件处理
  // ============================================

  onBlockNavigate(e) {
    const { location, name, address } = e.detail;
    if (location && location.lat && location.lng) {
      wx.openLocation({
        latitude: location.lat,
        longitude: location.lng,
        name: name || "",
        address: address || "",
        scale: 15,
      });
    }
  },

  onBlockDelete(e) {
    this.deleteBlock(e.detail.blockId);
  },

  onBlockEdit(e) {
    // 处理 Block 编辑事件
  },

  onBlockTextChange(e) {
    const { blockId, text, completed } = e.detail;
    if (completed) {
      this.updateBlock(blockId, { text: text });
    }
  },

  // ============================================
  // 其他功能
  // ============================================

  openMapView() {
    wx.showToast({ title: "地图模式开发中", icon: "none" });
  },

  shareTrip() {
    wx.showToast({ title: "分享功能开发中", icon: "none" });
  },

  aiOptimize() {
    wx.showToast({ title: "AI 优化开发中", icon: "none" });
  },

  editTitle() {
    wx.showModal({
      title: "修改标题",
      editable: true,
      placeholderText: this.data.tripInfo.title,
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ "tripInfo.title": res.content });
          this.saveTrip();
        }
      },
    });
  },

  changeBg() {
    wx.showToast({ title: "背景切换开发中", icon: "none" });
  },

  generatePoster() {
    wx.showToast({ title: "海报生成开发中", icon: "none" });
  },

  deleteTrip() {
    wx.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除吗？",
      success: (res) => {
        if (res.confirm) {
          wx.cloud
            .callFunction({
              name: "trip-service",
              data: { action: "delete", payload: { id: this.data.tripId } },
            })
            .then(() => {
              wx.showToast({ title: "已删除", icon: "success" });
              setTimeout(() => wx.navigateBack(), 1500);
            })
            .catch((err) => {
              console.error("删除失败:", err);
              wx.showToast({ title: "删除失败", icon: "none" });
            });
        }
      },
    });
  },

  // ============================================
  // 数据持久化
  // ============================================

  updateTripMeta() {
    // 计算总费用
    const totalCost = this.data.blocks
      .filter((b) => b.type === BLOCK_TYPES.POI)
      .reduce((sum, b) => sum + (b.content.cost || 0), 0);

    this.setData({
      "tripInfo.meta.totalCost": totalCost,
      "tripInfo.updatedAt": Date.now(),
    });
  },

  saveTrip() {
    const { tripId, tripInfo, blocks } = this.data;
    if (!tripId) return;

    const updateData = {
      title: tripInfo.title,
      city: tripInfo.city,
      days: tripInfo.days,
      intent: tripInfo.intent,
      meta: tripInfo.meta,
      blocks: blocks,
    };

    wx.cloud
      .callFunction({
        name: "trip-service",
        data: { action: "update", payload: { tripId, updateData } },
      })
      .catch((err) => {
        console.error("保存失败:", err);
      });
  },

  onShareAppMessage() {
    return {
      title: this.data.tripInfo.title || "我的路书",
      path: `/pages/trip-detail/trip-detail?id=${this.data.tripId}`,
    };
  },
});
