// pages/trip-detail/trip-detail.js

// ============================================
// BlockFactory 引入 + 常量
// ============================================

const { BlockFactory, BLOCK_TYPES } = require("../../utils/BlockFactory");
const ORDER_INCREMENT = 100;

// ============================================
//
//
function _fetchTripCode(tripId) {
  if (!tripId || !wx.cloud) return Promise.resolve(null);
  return wx.cloud
    .callFunction({
      name: "trip-service",
      data: {
        action: "genCode",
        payload: {
          tripId,
          path: `/pages/trip-detail/trip-detail?id=${tripId}`,
        },
      },
    })
    .then((res) => {
      const r = (res && res.result) || {};
      const fileID = r.fileID || r.codeFileID || "";
      const url = r.tempUrl || r.url || "";
      if (!fileID && !url) return null;
      return { fileID, url };
    })
    .catch(() => null);
}

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
              // 
              coverUrl: doc.coverUrl || doc.coverImage || "",
              coverFileID: doc.coverFileID || "",
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
    const { blocks, tripInfo } = this.data;
    let newBlocks = blocks;
    let changed = false;
    // 若当前路书中还没有任何 Day 分隔卡，自动在最前面插入 Day 1
    const hasDay = (blocks || []).some(
      (b) => b.type === BLOCK_TYPES.DAY_DIVIDER
    );
    if (!hasDay) {
      const baseOrder = blocks.length
        ? Math.min.apply(
            null,
            blocks.map((b) =>
              typeof b.order === "number" ? b.order : ORDER_INCREMENT
            )
          ) - ORDER_INCREMENT
        : ORDER_INCREMENT;
      const dayBlock = BlockFactory.createDayDivider({
        dayIndex: 1,
        label: "Day 1",
        order: baseOrder,
      });
      newBlocks = [...blocks, dayBlock].sort((a, b) => a.order - b.order);
      changed = true;
    }
    this.setData({
      editMode: true,
      blocks: newBlocks,
      "tripInfo.days": (tripInfo && tripInfo.days) > 0 ? tripInfo.days : 1,
    });
    if (changed && this.scheduleSave) {
      this.scheduleSave();
    }
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
    // 仅关闭抽屉，不立刻清空插入位置，确保 getNextOrder 还能读到 insertBeforeId/insertAfterId
    this.setData({ showAddDrawer: false });
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
      case "checklist":
        this.addChecklistBlock();
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

  addChecklistBlock() {
    const order = this.getNextOrder();
    const block = BlockFactory.createChecklist({ items: [], order });
    this.insertBlockAtPosition(block);
    if (this.scheduleSave) this.scheduleSave();
  },

  addImageBlock() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath =
          res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!tempFilePath) return;
        const order = this.getNextOrder();
        if (!wx.cloud) {
          const block = BlockFactory.createImage({ url: tempFilePath, order });
          this.insertBlockAtPosition(block);
          if (this.scheduleSave) this.scheduleSave();
          wx.showToast({ title: "已添加图片", icon: "success" });
          return;
        }
        wx.showLoading({ title: "上传中...", mask: true });
        const cloudPath = `trips/${
          this.data.tripId || "tmp"
        }/${Date.now()}.jpg`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: (up) => {
            wx.cloud.getTempFileURL({
              fileList: [up.fileID],
              success: (r) => {
                const url =
                  (r.fileList && r.fileList[0] && r.fileList[0].tempFileURL) ||
                  up.fileID;
                const block = BlockFactory.createImage({
                  url,
                  fileID: up.fileID,
                  order,
                });
                this.insertBlockAtPosition(block);
                if (this.scheduleSave) this.scheduleSave();
                wx.hideLoading();
                wx.showToast({ title: "已添加图片", icon: "success" });
              },
              fail: () => {
                const block = BlockFactory.createImage({
                  url: up.fileID,
                  fileID: up.fileID,
                  order,
                });
                this.insertBlockAtPosition(block);
                if (this.scheduleSave) this.scheduleSave();
                wx.hideLoading();
                wx.showToast({ title: "已添加图片", icon: "success" });
              },
            });
          },
          fail: (err) => {
            console.error(err);
            wx.hideLoading();
            wx.showToast({ title: "上传失败", icon: "none" });
          },
        });
      },
    });
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
    this.setData({
      blocks,
      insertBeforeId: null,
      insertAfterId: null,
    });
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

  // 封面点击：编辑态更换封面；浏览态预览大图
  onCoverTap() {
    const { editMode, tripInfo } = this.data;
    const url =
      tripInfo.coverUrl ||
      "https://images.unsplash.com/photo-1431274172761-fca41d930114?q=80&w=1080";

    if (editMode) {
      this.changeCover();
      return;
    }

    if (!url) return;
    wx.previewImage({ urls: [url] });
  },

  // 更换封面
  changeCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath =
          res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!tempFilePath) return;
        const setCover = (url, fileID = "") => {
          this.setData({
            "tripInfo.coverUrl": url,
            "tripInfo.coverFileID": fileID,
          });
          this.saveTrip();
          wx.showToast({ title: "封面已更新", icon: "success" });
        };
        if (!wx.cloud) {
          setCover(tempFilePath, "");
          return;
        }
        wx.showLoading({ title: "上传中...", mask: true });
        const cloudPath = `trips/${
          this.data.tripId || "tmp"
        }/cover_${Date.now()}.jpg`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: (up) => {
            wx.cloud.getTempFileURL({
              fileList: [up.fileID],
              success: (r) => {
                const url =
                  (r.fileList && r.fileList[0] && r.fileList[0].tempFileURL) ||
                  up.fileID;
                setCover(url, up.fileID);
                wx.hideLoading();
              },
              fail: () => {
                setCover(up.fileID, up.fileID);
                wx.hideLoading();
              },
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "上传失败", icon: "none" });
          },
        });
      },
    });
  },

  // 发布行程（占位：保存后提示）
  publishTrip() {
    this.flushSave && this.flushSave();
    const doAfterPublish = () => {
      wx.showModal({
        title: "发布成功",
        content: "是否生成长图海报用于分享？",
        confirmText: "生成海报",
        cancelText: "稍后再说",
        success: (res) => {
          if (res.confirm) {
            this.generatePoster();
          }
        },
      });
    };
    if (!wx.cloud || !this.data.tripId) {
      wx.showToast({ title: "已发布（本地）", icon: "success" });
      doAfterPublish();
      return;
    }
    wx.cloud
      .callFunction({
        name: "trip-service",
        data: { action: "publish", payload: { id: this.data.tripId } },
      })
      .then(() => {
        wx.showToast({ title: "已发布", icon: "success" });
        doAfterPublish();
      })
      .catch(() => wx.showToast({ title: "发布失败", icon: "none" }));
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
    const { tripInfo, tripId, blocks } = this.data;
    const cover = tripInfo.coverUrl;

    // tasks
    const coverTask = new Promise((resolve) => {
      if (!cover) return resolve("");
      wx.getImageInfo({
        src: cover,
        success: (r) => resolve(r.path),
        fail: () => resolve(""),
      });
    });
    const codeTask = _fetchTripCode(tripId)
      .then((code) =>
        code && code.url
          ? new Promise((resolve) => {
              wx.getImageInfo({
                src: code.url,
                success: (r) => resolve({ path: r.path, fileID: code.fileID }),
                fail: () => resolve(null),
              });
            })
          : null
      )
      .catch(() => null);

    Promise.all([coverTask, codeTask]).then(([imgPath, codeObj]) => {
      const ctx = wx.createCanvasContext("posterCanvas", this);
      const W = 750;
      const posterDays = this._buildPosterDaySummaries(blocks || []);
      // 根据「天数 + 每天地点数」估算长图高度，尽量完整容纳行程
      const totalPois = (posterDays || []).reduce(
        (sum, d) => sum + ((d && d.pois && d.pois.length) || 0),
        0
      );
      const baseH = 1100; // 封面 + 标题区域
      const perDay = 70; // 每个 Day 标题区域高度
      const perPoi = 32; // 每个地点行高度预估
      const maxH = 2200;
      const minH = 1200;
      let H = baseH + (posterDays.length || 0) * perDay + totalPois * perPoi;
      H = Math.max(minH, Math.min(maxH, H));
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
      // title：放在上方渐变区域底部，避免顶部大片留白
      ctx.setFillStyle("#ffffff");
      ctx.setFontSize(44);
      ctx.setTextAlign("left");
      const title = tripInfo.title || "我的路书";
      ctx.fillText(title, 40, 420);
      // meta line（同样放在渐变区域内）
      ctx.setFillStyle("rgba(255,255,255,0.9)");
      ctx.setFontSize(26);
      const meta = `${tripInfo.city || "未知城市"}  ·  ${
        tripInfo.days || 0
      } Days`;
      ctx.fillText(meta, 40, 470);
      // 路书正文：更具分享感的布局（徽章 / 分割 / 地址）
      let y = 560;
      const bodyLeft = 40;
      const bodyRight = W - 40;
      const textW = bodyRight - bodyLeft;
      const theme = {
        primary: "#6C5CE7",
        text: "#333",
        sub: "#777",
        bullet: "#999",
      };

      // Header 徽章（城市 + 天数）
      try {
        const badgeCity =
          tripInfo.city || this._deriveCityFromBlocks(blocks || []) || "旅途";
        this._drawPill(
          ctx,
          badgeCity,
          bodyLeft,
          y - 40,
          theme.primary,
          "#fff",
          22
        );
        const daysBadge = `${
          tripInfo.days || (posterDays && posterDays.length) || 1
        } Days`;
        const cityWidth = Math.ceil(ctx.measureText(badgeCity).width);
        this._drawPill(
          ctx,
          daysBadge,
          bodyLeft + 18 + cityWidth + 28,
          y - 40,
          "rgba(108,92,231,0.15)",
          theme.primary,
          22
        );
      } catch (e) {}

      const detailDays = this._buildPosterDayDetails(blocks || []);
      (detailDays || []).forEach((d) => {
        // Day 标题徽章
        this._drawPill(
          ctx,
          `Day ${d.day}`,
          bodyLeft,
          y,
          "rgba(108,92,231,0.12)",
          theme.primary,
          24
        );
        y += 42;

        // 当天所有条目
        (d.items || []).forEach((it) => {
          // bullet 点
          ctx.setFillStyle(theme.bullet);
          ctx.beginPath();
          ctx.arc(bodyLeft + 6, y - 10, 4, 0, Math.PI * 2);
          ctx.fill();

          // 名称
          ctx.setFillStyle(theme.text);
          ctx.setFontSize(26);
          y = this._wrapText(
            ctx,
            it.name || "",
            bodyLeft + 18,
            y,
            textW - 24,
            34
          );

          // 地址（可选）
          if (it.address) {
            ctx.setFillStyle(theme.sub);
            ctx.setFontSize(20);
            y = this._wrapText(
              ctx,
              it.address,
              bodyLeft + 18,
              y,
              textW - 24,
              28
            );
          }
          y += 6;
        });

        // 分割线
        ctx.setStrokeStyle("rgba(0,0,0,0.06)");
        ctx.beginPath();
        ctx.moveTo(bodyLeft, y);
        ctx.lineTo(bodyRight, y);
        ctx.stroke();
        y += 18;
      });

      // QR code overlay (optional)
      if (codeObj && codeObj.path) {
        const size = 160;
        const px = W - 40 - size;
        const py = H - 40 - size;
        // 背景白卡，提升对比
        ctx.setFillStyle("rgba(255,255,255,0.96)");
        ctx.fillRect(px - 18, py - 28, size + 36, size + 64);
        ctx.drawImage(codeObj.path, px, py, size, size);
        ctx.setFillStyle("#444");
        ctx.setFontSize(20);
        ctx.fillText("长按识别 · 获取完整路线", px - 18, py - 36);
      }

      // footer：应用说明 + 品牌文案
      ctx.setFillStyle("#999");
      ctx.setFontSize(22);
      ctx.fillText("扫码打开小程序，查看和编辑完整路书", 40, H - 96);
      ctx.fillText("由「路书小程序」生成 · AI 魔法行程助手", 40, H - 60);
      ctx.draw(false, () => {
        wx.canvasToTempFilePath(
          {
            canvasId: "posterCanvas",
            // 指定导出区域尺寸，避免长图被裁剪
            width: W,
            height: H,
            destWidth: W * 2,
            destHeight: H * 2,
            success: (res) => {
              const temp = res.tempFilePath;
              const finish = () => {
                wx.hideLoading();
                this._generatingPoster = false;
                wx.previewImage({ urls: [temp] });
              };
              // upload poster & record share history

              if (tripId && wx.cloud) {
                const cloudPath = `posters/${tripId}_${Date.now()}.jpg`;
                wx.cloud
                  .uploadFile({ cloudPath, filePath: temp })
                  .then((up) => {
                    const posterFileID = up.fileID;
                    const codeFileID = codeObj && codeObj.fileID;
                    wx.cloud
                      .callFunction({
                        name: "trip-service",
                        data: {
                          action: "shareRecord",
                          payload: { tripId, posterFileID, codeFileID },
                        },
                      })
                      .finally(finish);
                  })
                  .catch(finish);
              } else {
                finish();
              }
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
    });
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
    // 计算总费用（包含所有带 cost 字段的块）
    const totalCost = (this.data.blocks || []).reduce(
      (sum, b) => sum + (Number(b?.content?.cost) || 0),
      0
    );

    const dayOverview = this._computeDayOverview(this.data.blocks || []);

    const derivedCity = this._deriveCityFromBlocks(this.data.blocks || []);
    if (derivedCity && derivedCity !== this.data.tripInfo.city) {
      this.setData({ "tripInfo.city": derivedCity });
    }
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

  // 为长图海报构建按天的地点概览
  _buildPosterDaySummaries(blocks) {
    const map = {};
    let currentDay = 1;
    (blocks || []).forEach((b) => {
      if (b.type === BLOCK_TYPES.DAY_DIVIDER) {
        const idx = Number(b.content && b.content.dayIndex);
        if (idx && idx > 0) {
          currentDay = idx;
        } else {
          currentDay += 1;
        }
        if (!map[currentDay]) {
          map[currentDay] = { day: currentDay, pois: [] };
        }
        return;
      }
      if (b.type === BLOCK_TYPES.POI && b.content) {
        const name = b.content.name || "";
        if (!name) return;
        if (!map[currentDay]) {
          map[currentDay] = { day: currentDay, pois: [] };
        }
        map[currentDay].pois.push(name);
      }
    });
    return Object.keys(map)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((d) => map[d]);
  },

  // 文本自动换行绘制，返回最新的 y 坐标，方便继续往下排版
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    let line = "";
    for (let i = 0; i < text.length; i++) {
      const testLine = line + text[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = text[i];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  },

  // 绘制圆角胶囊徽章
  _drawPill(ctx, text, x, y, bgColor, textColor, fontSize = 22) {
    if (!text) return 0;
    const padX = 14;
    const padY = 8;
    ctx.setFontSize(fontSize);
    const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
    const h = fontSize + padY * 2;
    const r = h / 2;
    ctx.beginPath();
    ctx.setFillStyle(bgColor || "#000");
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + r, r, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.closePath();
    ctx.fill();
    ctx.setFillStyle(textColor || "#fff");
    ctx.fillText(text, x + padX, y + padY + fontSize - 4);
    return h;
  },

  // 为长图构建按天的详细列表（含地址）
  _buildPosterDayDetails(blocks) {
    const map = {};
    let currentDay = 1;
    (blocks || []).forEach((b) => {
      if (b.type === BLOCK_TYPES.DAY_DIVIDER) {
        const idx = Number(b.content && b.content.dayIndex);
        if (idx && idx > 0) {
          currentDay = idx;
        } else {
          currentDay += 1;
        }
        if (!map[currentDay]) map[currentDay] = { day: currentDay, items: [] };
        return;
      }
      if (b.type === BLOCK_TYPES.POI && b.content) {
        const name = b.content.name || "";
        if (!name) return;
        const address = b.content.address || "";
        if (!map[currentDay]) map[currentDay] = { day: currentDay, items: [] };
        map[currentDay].items.push({ name, address });
      }
    });
    return Object.keys(map)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((d) => map[d]);
  },

  _deriveCityFromBlocks(blocks) {
    for (let i = 0; i < (blocks || []).length; i++) {
      const b = blocks[i];
      if (b.type === BLOCK_TYPES.POI && b.content) {
        if (b.content.city) return b.content.city;
        const addr = b.content.address || "";
        const idx = addr.indexOf("市");
        if (idx > 0) return addr.slice(0, idx + 1);
        const idx2 = addr.indexOf("县");
        if (idx2 > 0) return addr.slice(0, idx2 + 1);
        const idx3 = addr.indexOf("区");
        if (idx3 > 0) return addr.slice(0, idx3 + 1);
      }
    }
    return "";
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
      // 
      coverUrl: tripInfo.coverUrl || "",
      coverFileID: tripInfo.coverFileID || "",
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
