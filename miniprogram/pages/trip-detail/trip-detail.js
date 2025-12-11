// pages/trip-detail/trip-detail.js

// ============================================
// BlockFactory 引入 + 常量
// ============================================

const { BlockFactory, BLOCK_TYPES } = require("../../utils/BlockFactory");
const ORDER_INCREMENT = 100;

// ============================================
// Page 定义
// ============================================

Page({
  data: {
    // 系统信息
    statusBarHeight: 20,

    scrollTop: 0,

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
    dayOverview: [],

    // UI 状态
    editMode: false,
    showAddDrawer: false,
    currentBg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",

    // 插入位置
    insertAfterId: null,
    insertBeforeId: null,

    // 移动状态
    movingBlockId: null,
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

  onPageScroll(e) {
    if (Math.abs(e.scrollTop - this.data.scrollTop) > 10) {
      this.setData({ scrollTop: e.scrollTop });
    }
  },

  onScrollView(e) {
    const st = (e.detail && e.detail.scrollTop) || 0;
    if (Math.abs(st - this.data.scrollTop) > 10) {
      this.setData({ scrollTop: st });
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
          this.updateTripMeta();
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

    const blocks = [
      BlockFactory.createDayDivider({
        dayIndex: 1,
        label: "Day 1",
        order: 100,
      }),
    ];

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
    try {
      wx.vibrateShort({ type: "medium" });
    } catch (e) {}
  },

  // 长按：进入移动模式
  onBlockLongPress(e) {
    const blockId =
      (e.currentTarget &&
        e.currentTarget.dataset &&
        e.currentTarget.dataset.blockId) ||
      (e.detail && e.detail.blockId);
    if (!blockId) return;
    this.setData({ movingBlockId: blockId, editMode: true });
    try {
      wx.vibrateShort({ type: "medium" });
    } catch (err) {}
  },

  // 取消移动
  cancelMove() {
    this.setData({ movingBlockId: null });
  },

  // 点击移动目标点
  onMoveTargetClick(e) {
    const insertIndex =
      e.currentTarget && e.currentTarget.dataset
        ? e.currentTarget.dataset.index
        : null;
    const { movingBlockId, blocks } = this.data;
    if (movingBlockId == null || insertIndex == null) return;

    const oldIndex = blocks.findIndex((b) => b.id === movingBlockId);
    if (oldIndex === -1) return;

    const newBlocks = blocks.slice();
    const [moving] = newBlocks.splice(oldIndex, 1);
    let targetIndex = Number(insertIndex);
    if (oldIndex < targetIndex) targetIndex -= 1; // 移除后索引前移

    newBlocks.splice(targetIndex, 0, moving);

    // 全量重排 order 为 100, 200, 300...
    const reindexed = newBlocks.map((b, idx) => ({
      ...b,
      order: (idx + 1) * ORDER_INCREMENT,
    }));

    this.setData({
      blocks: reindexed,
      movingBlockId: null,
      insertBeforeId: null,
      insertAfterId: null,
    });
    if (this.scheduleSave) this.scheduleSave();
    try {
      wx.vibrateShort({ type: "light" });
    } catch (err) {}
    wx.showToast({ title: "已移动", icon: "none" });
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
      insertBeforeId: beforeId || null,
      showAddDrawer: true,
    });
    try {
      wx.vibrateShort({ type: "light" });
    } catch (e) {}
  },

  // ============================================
  // 添加模块
  // ============================================

  showAddMenu() {
    this.setData({
      insertAfterId: null,
      insertBeforeId: null,
      showAddDrawer: true,
    });
  },

  hideAddDrawer() {
    this.setData({
      showAddDrawer: false,
      insertAfterId: null,
      insertBeforeId: null,
    });
  },

  stopPropagation() {
    // 阻止冒泡
  },

  addBlock(e) {
    const type = e.currentTarget.dataset.type;
    this.hideAddDrawer();
    try {
      wx.vibrateShort({ type: "light" });
    } catch (e) {}

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
        const block = BlockFactory.createPoi({
          name: res.name || "未命名地点",
          address: res.address,
          location:
            res.latitude && res.longitude
              ? { lat: res.latitude, lng: res.longitude }
              : null,
          order,
        });
        this.insertBlockAtPosition(block);
        if (this.scheduleSave) this.scheduleSave();
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
          const block = BlockFactory.createText({
            text: res.content,
            style: "tip",
            order,
          });
          this.insertBlockAtPosition(block);
          if (this.scheduleSave) this.scheduleSave();
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
        const block = BlockFactory.createTransport({
          mode: modes[res.tapIndex],
          order,
        });
        this.insertBlockAtPosition(block);
        if (this.scheduleSave) this.scheduleSave();
      },
    });
  },

  addDayDividerBlock() {
    const currentDays = this.data.blocks.filter(
      (b) => b.type === BLOCK_TYPES.DAY_DIVIDER
    ).length;
    const order = this.getNextOrder();
    const block = BlockFactory.createDayDivider({
      dayIndex: currentDays + 1,
      label: `Day ${currentDays + 1}`,
      order,
    });
    this.insertBlockAtPosition(block);

    // 更新 tripInfo 天数
    this.setData({
      "tripInfo.days": currentDays + 1,
    });
    if (this.scheduleSave) this.scheduleSave();
  },

  addImageBlock() {
    wx.showToast({ title: "图片功能开发中", icon: "none" });
  },

  addFromFavorites() {
    wx.showToast({ title: "收藏功能开发中", icon: "none" });
  },

  getNextOrder() {
    const { blocks, insertAfterId, insertBeforeId } = this.data;

    // 在某个块之前插入
    if (insertBeforeId) {
      const idx = blocks.findIndex((b) => b.id === insertBeforeId);
      if (idx === 0 && blocks.length > 0) {
        return Math.max(0, blocks[0].order - ORDER_INCREMENT);
      }
      if (idx > 0) {
        return Math.floor((blocks[idx - 1].order + blocks[idx].order) / 2);
      }
    }

    // 在某个块之后插入
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

  onBlockUpdate(e) {
    const { blockId, field, value, text, content, completed } = e.detail || {};
    if (!blockId) return;
    const blocks = this.data.blocks.map((b) => {
      if (b.id !== blockId) return b;
      const newContent = Object.assign({}, b.content);
      if (content && typeof content === "object") {
        Object.assign(newContent, content);
      } else if (field) {
        newContent[field] = value;
      } else if (typeof text === "string") {
        newContent.text = text;
      }
      return { ...b, content: newContent };
    });
    this.setData({ blocks });
    this.updateTripMeta();
    if (completed) {
      this.saveTrip();
    } else if (this.scheduleSave) {
      this.scheduleSave();
    }
  },

  // 插入：列表中间
  onInsert(e) {
    // 移动模式下禁用插入
    if (this.data.movingBlockId) return;
    const idx = e.currentTarget.dataset.index;
    const { blocks } = this.data;
    if (typeof idx === "number" && blocks[idx]) {
      this.setData({
        insertBeforeId: blocks[idx].id,
        insertAfterId: null,
        showAddDrawer: true,
      });
      try {
        wx.vibrateShort({ type: "light" });
      } catch (err) {}
    }
  },

  // 追加：列表末尾
  onAppendBlock() {
    // 移动模式下禁用追加
    if (this.data.movingBlockId) return;
    const { blocks } = this.data;
    const lastId = blocks.length ? blocks[blocks.length - 1].id : null;
    this.setData({
      insertAfterId: lastId,
      insertBeforeId: null,
      showAddDrawer: true,
    });
    try {
      wx.vibrateShort({ type: "light" });
    } catch (err) {}
  },

  toggleEditMode() {
    if (this.data.editMode) {
      this.exitEditMode();
    } else {
      this.enterEditMode();
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
    const blocksStr = encodeURIComponent(
      JSON.stringify(this.data.blocks || [])
    );
    wx.navigateTo({ url: `/pages/map-view/index?blocks=${blocksStr}` });
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
    if (this._generatingPoster) return;
    this._generatingPoster = true;
    wx.showLoading({ title: "生成中", mask: true });
    const { tripInfo, dayOverview } = this.data;
    const cover = tripInfo.coverUrl;
    const draw = (imgPath) => {
      const ctx = wx.createCanvasContext("posterCanvas", this);
      const W = 750,
        H = 1200;
      // bg
      if (imgPath) {
        ctx.drawImage(imgPath, 0, 0, W, 500);
        // gradient overlay
        const grd = ctx.createLinearGradient(0, 0, 0, 500);
        grd.addColorStop(0, "rgba(0,0,0,0.35)");
        grd.addColorStop(0.6, "rgba(0,0,0,0.0)");
        grd.addColorStop(1, "rgba(0,0,0,0.25)");
        ctx.setFillStyle(grd);
        ctx.fillRect(0, 0, W, 500);
      } else {
        // fallback gradient
        const grd2 = ctx.createLinearGradient(0, 0, W, 500);
        grd2.addColorStop(0, "#a18cd1");
        grd2.addColorStop(1, "#fbc2eb");
        ctx.setFillStyle(grd2);
        ctx.fillRect(0, 0, W, 500);
      }
      // white body
      ctx.setFillStyle("#ffffff");
      ctx.fillRect(0, 500, W, H - 500);
      // title
      ctx.setFillStyle("#111");
      ctx.setFontSize(44);
      ctx.setTextAlign("left");
      const title = tripInfo.title || "我的路书";
      ctx.fillText(title, 40, 580);
      // meta line
      ctx.setFillStyle("#666");
      ctx.setFontSize(26);
      const meta = `${tripInfo.city || "未知城市"}  ·  ${
        tripInfo.days || 0
      } Days`;
      ctx.fillText(meta, 40, 630);
      // route overview chips
      let y = 690;
      const chipH = 44;
      const gap = 12;
      let x = 40;
      (dayOverview || []).forEach((d) => {
        const txt = `D${d.index} · ${d.count}`;
        ctx.setFontSize(22);
        const w = ctx.measureText(txt).width + 46; // dot+padding
        if (x + w > W - 40) {
          x = 40;
          y += chipH + gap;
        }
        // chip bg
        ctx.setFillStyle("#f5f7fa");
        ctx.fillRect(x, y, w, chipH);
        // dot
        ctx.setFillStyle(d.color || "#333");
        ctx.beginPath();
        ctx.arc(x + 18, y + chipH / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        // text
        ctx.setFillStyle("#333");
        ctx.fillText(txt, x + 32, y + chipH / 2 + 8);
        x += w + gap;
      });
      // footer
      ctx.setFillStyle("#999");
      ctx.setFontSize(22);
      ctx.fillText("由 路书小程序 生成", 40, H - 60);
      ctx.draw(false, () => {
        wx.canvasToTempFilePath(
          {
            canvasId: "posterCanvas",
            success: (res) => {
              wx.hideLoading();
              this._generatingPoster = false;
              wx.previewImage({ urls: [res.tempFilePath] });
            },
            fail: (e) => {
              wx.hideLoading();
              this._generatingPoster = false;
              wx.showToast({ title: "生成失败", icon: "none" });
              console.error(e);
            },
          },
          this
        );
      });
    };

    if (cover) {
      wx.getImageInfo({
        src: cover,
        success: (r) => draw(r.path),
        fail: () => draw(""),
      });
    } else {
      draw("");
    }
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

    const dayOverview = this._computeDayOverview(this.data.blocks || []);

    this.setData({
      "tripInfo.meta.totalCost": totalCost,
      "tripInfo.updatedAt": Date.now(),
      dayOverview,
    });
  },

  _computeDayOverview(blocks) {
    const DAY_COLORS = [
      "#a18cd1",
      "#fcbad3",
      "#ffd3b6",
      "#a1c4fd",
      "#84fab0",
      "#f6d365",
      "#c79081",
      "#43e97b",
    ];
    let currentDay = 1;
    const counts = {};
    (blocks || []).forEach((b) => {
      if (b.type === BLOCK_TYPES.DAY_DIVIDER) {
        currentDay = Number(b.content && b.content.dayIndex) || currentDay + 1;
        return;
      }
      if (b.type === BLOCK_TYPES.POI && b.content && b.content.location) {
        counts[currentDay] = (counts[currentDay] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((idx) => ({
        index: idx,
        count: counts[idx],
        color: DAY_COLORS[(idx - 1) % DAY_COLORS.length],
      }));
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
  // 保存防抖与退出刷新
  scheduleSave(delay = 1500) {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this.saveTrip();
      this._saveTimer = null;
    }, delay);
  },

  flushSave() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      this.saveTrip();
    }
  },

  onUnload() {
    this.flushSave && this.flushSave();
  },

  onShareAppMessage() {
    return {
      title: this.data.tripInfo.title || "我的路书",
      path: `/pages/trip-detail/trip-detail?id=${this.data.tripId}`,
    };
  },
});
