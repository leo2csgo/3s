// pages/discover/discover.js
Page({
  data: {
    // AI 生成参数
    showAIPanel: false,
    loading: false,
    cities: ["上海", "杭州", "广州", "北京", "成都", "西安", "重庆", "厦门"],
    cityIndex: 0,
    days: [1, 2, 3, 4, 5],
    dayIndex: 1,
    intents: ["亲子遛娃", "情侣约会", "朋友聚会", "独自探索", "特种兵打卡"],
    intentIndex: 0,

    // 推荐模版
    templates: [
      {
        id: "tpl_001",
        title: "上海迪士尼亲子2日",
        city: "上海",
        days: 2,
        cover: "/images/3s.jpg",
        tags: ["亲子", "主题乐园"],
      },
      {
        id: "tpl_002",
        title: "杭州西湖漫步",
        city: "杭州",
        days: 1,
        cover: "/images/3s.jpg",
        tags: ["情侣", "自然风光"],
      },
      {
        id: "tpl_003",
        title: "成都美食之旅",
        city: "成都",
        days: 3,
        cover: "/images/3s.jpg",
        tags: ["美食", "文化"],
      },
    ],

    // 筛选与榜单
    filters: ["全部", "亲子", "情侣", "美食", "自然", "文化"],
    activeFilter: 0,
    displayTemplates: [],
    latestTemplates: [],
    editorPicks: [],

    // 分类
    categories: [
      { id: "cat_family", icon: "👨‍👩‍👧", name: "亲子" },
      { id: "cat_couple", icon: "💑", name: "情侣" },
      { id: "cat_food", icon: "🍜", name: "美食" },
      { id: "cat_nature", icon: "🏞️", name: "自然" },
      { id: "cat_culture", icon: "🏛️", name: "文化" },
      { id: "cat_adventure", icon: "🎢", name: "冒险" },
      { id: "cat_relax", icon: "🧘", name: "休闲" },
      { id: "cat_photo", icon: "📸", name: "拍照" },
    ],
  },

  onLoad() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    }
    this.bootstrapLists();
  },

  // 显示 AI 生成面板
  goToAIGenerate() {
    this.setData({
      showAIPanel: !this.data.showAIPanel,
    });
  },

  // 创建空白路书
  createBlankTrip() {
    const now = Date.now();
    const tripInfo = {
      title: "我的路书",
      city: this.data.cities[this.data.cityIndex],
      days: this.data.days[this.data.dayIndex],
      intent: this.data.intents[this.data.intentIndex],
      meta: { totalCost: 0 },
      createdAt: now,
      updatedAt: now,
    };

    wx.cloud
      .callFunction({
        name: "trip-service",
        data: { action: "create", payload: { tripInfo, blocks: [] } },
      })
      .then((res) => {
        const id = res.result && res.result._id;
        if (id) {
          wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${id}` });
        } else {
          wx.showToast({ title: "创建失败", icon: "none" });
        }
      })
      .catch((err) => {
        console.error("创建失败:", err);
        wx.showToast({ title: "创建失败", icon: "none" });
      });
  },

  // 选择器变更
  onCityChange(e) {
    this.setData({ cityIndex: parseInt(e.detail.value) });
  },

  onDayChange(e) {
    this.setData({ dayIndex: parseInt(e.detail.value) });
  },

  onIntentChange(e) {
    this.setData({ intentIndex: parseInt(e.detail.value) });
  },

  // AI 生成路书
  generateTrip() {
    const { cities, cityIndex, days, dayIndex, intents, intentIndex } =
      this.data;

    this.setData({ loading: true });

    const requestedDays = days[dayIndex];
    const safeDays = Math.min(requestedDays, 3);
    const rawIntent = intents[intentIndex];
    const intentTag = ["亲子遛娃", "情侣约会", "朋友小聚", "美食探店"].includes(
      rawIntent
    )
      ? rawIntent
      : rawIntent === "朋友聚会"
      ? "朋友小聚"
      : "亲子遛娃"; // 默认回退

    if (requestedDays > 3) {
      wx.showToast({ title: "生成暂支持≤3天，已按3天生成", icon: "none" });
    }

    wx.cloud
      .callFunction({
        name: "generateCard",
        data: {
          city: cities[cityIndex],
          days: safeDays,
          intent_tag: intentTag,
        },
      })
      .then((res) => {
        if (res.result && res.result.success) {
          const { tripInfo, blocks } = res.result;
          return wx.cloud.callFunction({
            name: "trip-service",
            data: { action: "create", payload: { tripInfo, blocks } },
          });
        } else {
          const msg = (res.result && res.result.error) || "生成失败";
          throw new Error(msg);
        }
      })
      .then((createRes) => {
        this.setData({ loading: false });
        const id = createRes.result && createRes.result._id;
        if (id) {
          wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${id}` });
        } else {
          wx.showToast({ title: "创建失败", icon: "none" });
        }
      })
      .catch((err) => {
        console.error("生成失败:", err);
        this.setData({ loading: false });
        wx.showToast({ title: "生成失败", icon: "none" });
      });
  },

  // 使用模版
  useTemplate(e) {
    const templateId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/trip-detail/trip-detail?templateId=${templateId}`,
    });
  },

  // 查看全部模版
  viewAllTemplates() {
    wx.showToast({ title: "更多模版开发中", icon: "none" });
  },

  // 分类入口
  goToCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    wx.showToast({ title: "分类功能开发中", icon: "none" });
  },

  // 初始化榜单并应用筛选
  bootstrapLists() {
    const templates = this.data.templates || [];
    const latest = [...templates].reverse();
    const picks = [...templates];
    this.setData(
      {
        latestTemplates: latest,
        editorPicks: picks,
      },
      () => this.applyFilter()
    );
  },

  // 应用筛选
  applyFilter() {
    const { templates, filters, activeFilter } = this.data;
    const label = filters[activeFilter];
    if (label === "全部") {
      this.setData({ displayTemplates: templates });
    } else {
      const list = (templates || []).filter((t) =>
        (t.tags || []).includes(label)
      );
      this.setData({ displayTemplates: list });
    }
  },

  // 切换筛选
  onFilterTap(e) {
    const index = e.currentTarget.dataset.index;
    if (typeof index !== "number") return;
    this.setData({ activeFilter: index }, () => this.applyFilter());
  },
});
