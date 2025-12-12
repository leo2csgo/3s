// ============================================
// Block 工具函数 - Notion 风格数据结构支持
// ============================================

/**
 * 生成唯一的 Block ID
 * @returns {string} 格式: blk_xxxxxxxx
 */
function generateBlockId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "blk_";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * 生成唯一的 Trip ID
 * @returns {string} 格式: trip_xxxxxxxx
 */
function generateTripId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "trip_";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Block 类型枚举
 */
const BLOCK_TYPES = {
  DAY_DIVIDER: "day-divider",
  POI: "poi",
  TEXT: "text",
  IMAGE: "image",
  TRANSPORT: "transport",
};

/**
 * 创建 Day Divider Block
 * @param {number} dayIndex - 第几天
 * @param {number} order - 排序索引
 * @param {string} theme - 当日主题（可选）
 */
function createDayDividerBlock(dayIndex, order, theme = "") {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.DAY_DIVIDER,
    order: order,
    content: {
      dayIndex: dayIndex,
      label: `Day ${dayIndex}`,
      date: "",
      theme: theme,
    },
  };
}

/**
 * 创建 POI Block
 * @param {object} poiData - POI 数据
 * @param {number} order - 排序索引
 */
function createPoiBlock(poiData, order) {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.POI,
    order: order,
    content: {
      poiId: poiData.poiId || "",
      name: poiData.name || "",
      address: poiData.address || poiData.description || "",
      location: poiData.location || null,
      startTime: poiData.time || poiData.startTime || "",
      duration: poiData.duration || 120, // 默认2小时(分钟)
      cost: poiData.cost || 0,
      currency: "CNY",
      tags: poiData.tags || [],
      description: poiData.description || "",
    },
  };
}

/**
 * 创建 Text Block
 * @param {string} text - 文本内容
 * @param {number} order - 排序索引
 * @param {string} style - 样式: normal, warning, tip
 * @param {string} parentId - 父 Block ID（可选）
 */
function createTextBlock(text, order, style = "normal", parentId = null) {
  const block = {
    id: generateBlockId(),
    type: BLOCK_TYPES.TEXT,
    order: order,
    content: {
      text: text,
      style: style,
      markdown: false,
    },
  };
  if (parentId) {
    block.parentId = parentId;
  }
  return block;
}

/**
 * 创建 Transport Block
 * @param {object} transportData - 交通数据
 * @param {number} order - 排序索引
 */
function createTransportBlock(transportData, order) {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.TRANSPORT,
    order: order,
    content: {
      mode: transportData.mode || "walk",
      instruction: transportData.instruction || "",
      duration: transportData.duration || 0,
      cost: transportData.cost || 0,
      fromName: transportData.fromName || "",
      toName: transportData.toName || "",
    },
  };
}

/**
 * 创建 Image Block
 * @param {string} url - 图片 URL
 * @param {number} order - 排序索引
 * @param {string} caption - 图片描述
 */
function createImageBlock(url, order, caption = "") {
  return {
    id: generateBlockId(),
    type: BLOCK_TYPES.IMAGE,
    order: order,
    content: {
      url: url,
      width: null,
      height: null,
      caption: caption,
    },
  };
}

/**
 * 将旧的嵌套 planData 转换为扁平化的 Block 数组
 * @param {object} planData - 旧的嵌套行程数据
 * @param {object} options - 转换选项 { city, intent }
 * @returns {object} { tripInfo, blocks }
 */
function convertPlanToBlocks(planData, options = {}) {
  const { city = "", intent = "" } = options;
  const blocks = [];
  let orderCounter = 100; // 从100开始，便于中间插入
  const ORDER_INCREMENT = 100; // 每个 block 间隔100

  if (!planData || !planData.days) {
    return { tripInfo: null, blocks: [] };
  }

  // 遍历每一天
  planData.days.forEach((day, dayIdx) => {
    // 1. 创建 Day Divider
    const dayDivider = createDayDividerBlock(
      day.day || dayIdx + 1,
      orderCounter
    );
    blocks.push(dayDivider);
    orderCounter += ORDER_INCREMENT;

    // 2. 遍历当天的活动
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity, actIdx) => {
        // 创建 POI Block
        const poiBlock = createPoiBlock(
          {
            name: activity.name,
            time: activity.time,
            duration: (activity.duration || 2) * 60, // 转换为分钟
            cost: activity.cost || 0,
            description: activity.description || "",
            address: activity.address || activity.description || "",
            // 关键：如果 planData 中已经带有 location / tags，也一并传入，保证导航和地图可用
            location: activity.location || null,
            tags: activity.tags || [],
          },
          orderCounter
        );
        blocks.push(poiBlock);
        orderCounter += ORDER_INCREMENT;

        // 如果不是最后一个活动，可以选择性添加交通 Block
        // （这里暂时不自动添加，留给用户手动添加）
      });
    }
  });

  // 构建 tripInfo
  const tripInfo = {
    id: generateTripId(),
    title: `${city} ${planData.days.length}天 ${intent}`,
    city: city,
    days: planData.days.length,
    intent: intent,
    meta: {
      totalCost: planData.total_cost || 0,
      tips: planData.tips || "",
      coverImage: "",
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return { tripInfo, blocks };
}

/**
 * 将扁平化的 Block 数组转换回嵌套的 plan 结构
 * 用于海报生成等需要旧结构的场景
 * @param {array} blocks - Block 数组
 * @param {object} tripInfo - 路书元信息
 * @returns {object} plan - 嵌套的 plan 结构
 */
function convertBlocksToPlan(blocks, tripInfo) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  // 按 order 排序
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const days = [];
  let currentDay = null;
  let totalCost = 0;

  sortedBlocks.forEach((block) => {
    if (block.type === BLOCK_TYPES.DAY_DIVIDER) {
      // 创建新的一天
      currentDay = {
        day: block.content.dayIndex,
        date:
          block.content.date ||
          block.content.label ||
          `Day ${block.content.dayIndex}`,
        activities: [],
      };
      days.push(currentDay);
    } else if (block.type === BLOCK_TYPES.POI && currentDay) {
      // 添加活动到当天
      const cost = block.content.cost || 0;
      totalCost += cost;

      currentDay.activities.push({
        name: block.content.name || "",
        time: block.content.startTime || "",
        duration: Math.round((block.content.duration || 60) / 60), // 转回小时
        cost: cost,
        description: block.content.description || block.content.address || "",
        address: block.content.address || "",
        location: block.content.location || null,
      });
    }
    // TEXT、TRANSPORT、IMAGE 等 block 在海报中暂不处理
  });

  return {
    days: days,
    total_cost:
      totalCost || (tripInfo && tripInfo.meta && tripInfo.meta.totalCost) || 0,
    tips: (tripInfo && tripInfo.meta && tripInfo.meta.tips) || "",
  };
}

// ============================================
// Page 定义开始
// ============================================

Page({
  data: {
    // 城市相关：保留一维 cities 以兼容旧逻辑，selectedCity 为当前选择
    cities: ["上海", "杭州", "广州", "北京", "成都"],
    cityIndex: 0,
    selectedCity: "上海",
    showCityPanel: false,
    cityGroups: [
      {
        name: "热门城市",
        cities: [
          "北京",
          "上海",
          "广州",
          "深圳",
          "杭州",
          "成都",
          "重庆",
          "西安",
          "厦门",
          "三亚",
        ],
      },
      {
        name: "华北东北",
        cities: [
          "北京",
          "天津",
          "石家庄",
          "青岛",
          "济南",
          "大连",
          "沈阳",
          "哈尔滨",
        ],
      },
      {
        name: "华东",
        cities: ["上海", "南京", "苏州", "无锡", "杭州", "宁波", "合肥"],
      },
      {
        name: "华南西南",
        cities: [
          "广州",
          "深圳",
          "珠海",
          "桂林",
          "昆明",
          "大理",
          "丽江",
          "成都",
          "重庆",
        ],
      },
      {
        name: "西北西南",
        cities: ["西安", "兰州", "银川", "乌鲁木齐", "拉萨"],
      },
      {
        name: "港澳台",
        cities: ["香港", "澳门", "台北", "高雄", "花莲"],
      },
    ],
    // 游玩天数：默认支持 1~10 天，可根据需要继续扩展
    days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    dayIndex: 1, // 默认2天
    intents: ["亲子遛娃", "情侣约会", "朋友小聚", "美食探店"],
    intentIndex: 0,
    // AI 魔法生成弹层相关状态
    showAIPanel: false,
    // 目的地：既可以直接输入，也可以点热门目的地按钮
    hotDestinations: [
      "巴黎",
      "东京",
      "纽约",
      "巴厘岛",
      "伦敦",
      "罗马",
      "首尔",
      "曼谷",
    ],
    // 旅行偏好（可多选），同时映射到内部 intent_tag
    aiPreferences: [
      {
        id: "couple",
        label: "情侣",
        emoji: "💑",
        intent: "情侣约会",
        selected: false,
      },
      {
        id: "family",
        label: "亲子",
        emoji: "👨‍👩‍👧",
        intent: "亲子遛娃",
        selected: false,
      },
      {
        id: "food",
        label: "美食",
        emoji: "🍜",
        intent: "美食探店",
        selected: false,
      },
      {
        id: "photo",
        label: "摄影",
        emoji: "📸",
        intent: "朋友小聚",
        selected: false,
      },
      {
        id: "shopping",
        label: "购物",
        emoji: "🛍️",
        intent: "朋友小聚",
        selected: false,
      },
      {
        id: "culture",
        label: "文化",
        emoji: "🎭",
        intent: "朋友小聚",
        selected: false,
      },
    ],
    hasPrefSelected: false,
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
    currentBgImage: "", // 当前背景图片
    isEditing: false, // 是否处于编辑模式
    generatedImagePath: null, // 存储生成的最终海报路径
    qrCodeUrl: "", // 二维码图片URL
    checkList: [], // 行前清单数据
    travelTips: "", // 旅行贴士

    // ============================================
    // Block 数据结构 (Notion 风格)
    // ============================================
    tripInfo: null, // 路书元信息 { id, title, city, days, intent, meta, createdAt, updatedAt }
    blocks: [], // 扁平化的 Block 数组
    activeBlockId: null, // 当前激活/选中的 Block ID
    blockEditMode: false, // 是否处于块编辑模式
  },

  onLoad() {
    console.log("页面加载");
  },

  // 根据目的生成智能清单和贴士
  generateSmartData(intent, city) {
    let list = [];
    let tips = "";

    switch (intent) {
      case "亲子遛娃":
        list = [
          { text: "儿童水壶 & 零食", checked: false },
          { text: "驱蚊喷雾/防晒霜", checked: false },
          { text: "换洗衣物/纸尿裤", checked: false },
          { text: "便携婴儿车", checked: false },
        ];
        tips = `带娃去${city}建议避开早晚高峰，很多景点有母婴室，记得提前查好位置哦。`;
        break;
      case "情侣约会":
        list = [
          { text: "自拍杆/三脚架", checked: false },
          { text: "情侣穿搭", checked: false },
          { text: "充电宝 (拍照耗电)", checked: false },
          { text: "提前预定餐厅", checked: false },
        ];
        tips = `${city}的夜景很美，建议预留晚上时间CityWalk，氛围感拉满！`;
        break;
      case "美食探店":
        list = [
          { text: "健胃消食片", checked: false },
          { text: "排队神器 (小板凳)", checked: false },
          { text: "口腔喷雾", checked: false },
          { text: "相机/补光灯", checked: false },
        ];
        tips = `网红店建议提前取号，${city}的小巷子里往往藏着更地道的美味。`;
        break;
      default: // 朋友小聚等
        list = [
          { text: "身份证/学生证", checked: false },
          { text: "晴雨伞", checked: false },
          { text: "蓝牙音箱", checked: false },
          { text: "桌游/扑克", checked: false },
        ];
        tips = `出行注意防晒，${city}的公共交通很方便，建议地铁出行。`;
    }
    return { list, tips };
  },

  // 清单勾选交互
  toggleCheck(e) {
    const index = e.currentTarget.dataset.index;
    const key = `checkList[${index}].checked`;
    this.setData({
      [key]: !this.data.checkList[index].checked,
    });
  },

  // 城市选择变化
  onCityChange(e) {
    const idx = parseInt(e.detail.value);
    const name = this.data.cities[idx] || this.data.selectedCity;
    this.setData({
      cityIndex: idx,
      selectedCity: name,
    });
  },

  // 打开城市选择面板（按省份/热门/港澳台分组）
  openCityPanel() {
    console.log(
      "[index] openCityPanel tapped, before showCityPanel =",
      this.data.showCityPanel
    );
    this.setData({ showCityPanel: true }, () => {
      console.log(
        "[index] openCityPanel after setData, showCityPanel =",
        this.data.showCityPanel
      );
    });
  },

  // 空方法：用于阻止城市面板内部点击冒泡关闭面板
  noop() {},

  // 关闭城市选择面板
  closeCityPanel() {
    this.setData({ showCityPanel: false });
  },

  // 在城市面板中选择城市
  onSelectCity(e) {
    const name = e.currentTarget.dataset.city;
    if (!name) return;
    // 如果该城市在原来的 cities 数组中，则同步更新 cityIndex，方便兼容旧逻辑
    const idx = this.data.cities.indexOf(name);
    this.setData({
      selectedCity: name,
      showCityPanel: false,
      cityIndex: idx >= 0 ? idx : this.data.cityIndex,
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

  // ===== AI 魔法生成弹层：打开 / 关闭 =====
  openAIPanel() {
    // 每次打开时，默认勾选第一个偏好，方便快速开始
    const prefs = (this.data.aiPreferences || []).map((p, idx) => ({
      ...p,
      selected: idx === 0,
    }));
    this.setData({
      showAIPanel: true,
      aiPreferences: prefs,
      hasPrefSelected: prefs.length > 0,
    });
  },

  closeAIPanel() {
    this.setData({ showAIPanel: false });
  },

  // 目的地输入
  onCityInput(e) {
    const value = (e.detail && e.detail.value) || "";
    this.setData({
      selectedCity: value.trim(),
    });
  },

  // 点击热门目的地按钮
  onHotDestinationTap(e) {
    const name = e.currentTarget.dataset && e.currentTarget.dataset.city;
    if (!name) return;
    this.setData({
      selectedCity: name,
    });
  },

  // 天数步进：-1 / +1，限制在 days 数组范围内
  changeDay(e) {
    const delta = parseInt(e.currentTarget.dataset.delta || 0);
    if (!delta) return;
    const { dayIndex, days } = this.data;
    const maxIndex = (days || []).length - 1;
    let next = dayIndex + delta;
    if (next < 0) next = 0;
    if (next > maxIndex) next = maxIndex;
    if (next === dayIndex) return;
    this.setData({ dayIndex: next });
  },

  // 切换旅行偏好（可多选）
  togglePreference(e) {
    const id = e.currentTarget.dataset && e.currentTarget.dataset.id;
    if (!id) return;
    const prefs = (this.data.aiPreferences || []).map((p) =>
      p.id === id ? { ...p, selected: !p.selected } : p
    );
    const hasPrefSelected = prefs.some((p) => p.selected);
    this.setData({
      aiPreferences: prefs,
      hasPrefSelected,
    });
  },

  // 弹层里的「开始生成」按钮
  startAIGenerate() {
    const { selectedCity, aiPreferences, intents } = this.data;
    if (!selectedCity) {
      wx.showToast({ title: "请先选择或输入目的地", icon: "none" });
      return;
    }
    const picked = (aiPreferences || []).find((p) => p.selected);
    let intentTag = intents[this.data.intentIndex] || "朋友小聚";
    if (picked) {
      // 将首个偏好映射到内部 intent_tag
      const mapped = picked.intent;
      const idx = intents.indexOf(mapped);
      if (idx >= 0) {
        this.setData({ intentIndex: idx });
        intentTag = mapped;
      }
    }
    console.log("[AI 面板] 参数确认", {
      city: selectedCity,
      intentTag,
      dayIndex: this.data.dayIndex,
    });
    // 直接根据当前参数生成路书
    this.generateCard();
  },

  // 顶部关闭按钮：返回发现页或上一个页面
  onClosePage() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: "/pages/discover/discover" });
    }
  },

  // 生成卡片
  generateCard() {
    const {
      cities,
      cityIndex,
      days,
      dayIndex,
      intents,
      intentIndex,
      selectedCity,
    } = this.data;

    const city = selectedCity || cities[cityIndex];
    const day = days[dayIndex];
    const intent_tag = intents[intentIndex];

    console.log("🎯 用户选择:", {
      城市: city,
      天数: day,
      目的: intent_tag,
      原始索引: { cityIndex, dayIndex, intentIndex },
    });

    this.setData({
      loading: true,
      cardContent: "",
      cardImagePath: "",
    });

    // 显示加载提示
    wx.showLoading({
      title: `正在为您规划${day}天${intent_tag}行程...`,
      mask: true,
    });

    // 调用云函数
    wx.cloud
      .callFunction({
        name: "generateCard",
        data: {
          city: city,
          days: day,
          intent_tag: intent_tag,
          // 预留 provider 字段，当前默认走 "tencent-lbs" 管道
          provider: "tencent-lbs",
        },
      })
      .then((res) => {
        wx.hideLoading();

        console.log("☁️ 云函数返回:", res.result);

        if (res.result && res.result.success) {
          const {
            plan,
            content,
            isRealtime,
            tripInfo: cloudTripInfo,
            blocks: cloudBlocks,
          } = res.result;

          console.log("📋 生成的行程:", {
            天数: plan.days.length,
            总费用: plan.total_cost,
            是否实时: isRealtime,
            第一天活动数: plan.days[0]?.activities?.length || 0,
          });

          // 【新增】生成智能清单和贴士
          const smartData = this.generateSmartData(intent_tag, city);

          // 【优先使用云函数返回的 blocks，否则前端转换】
          let tripInfo = cloudTripInfo;
          let blocks = cloudBlocks;

          if (!blocks || blocks.length === 0) {
            // 兼容旧版云函数：前端转换
            const converted = convertPlanToBlocks(plan, {
              city: city,
              intent: intent_tag,
            });
            tripInfo = converted.tripInfo;
            blocks = converted.blocks;
            console.log("📦 前端 Block 转换完成");
          } else {
            console.log("📦 使用云函数返回的 blocks");
          }

          console.log("📦 Block 数据:", {
            tripId: tripInfo?.id,
            blockCount: blocks.length,
            blockTypes: blocks.map((b) => b.type),
          });

          this.setData({
            planData: plan, // 保留旧结构用于兼容（海报绘制等）
            cardContent: content,
            loading: false,
            // 注入清单和贴士数据
            checkList: smartData.list,
            travelTips: smartData.tips,
            generatedImagePath: null, // 重置海报状态
            // 【核心】Block 数据 - 驱动 UI 渲染
            tripInfo: tripInfo,
            blocks: blocks,
            activeBlockId: null,
            blockEditMode: false,
          });

          // 生成成功后，直接进入路书详情页（按路书页面结构展示）
          try {
            const payloadForTrip = {
              city,
              days: day,
              intent: intent_tag,
              blocks,
            };
            const encoded = encodeURIComponent(JSON.stringify(payloadForTrip));
            wx.navigateTo({
              url: `/pages/trip-detail/trip-detail?data=${encoded}`,
            });
          } catch (navErr) {
            console.error("跳转路书页面失败:", navErr);
          }

          // 根据数据来源显示不同提示
          if (!isRealtime) {
            wx.showToast({
              title: "网络不稳，已为您推荐热门路线",
              icon: "none",
              duration: 2000,
            });
          } else {
            wx.showToast({
              title: `${day}天${intent_tag}行程生成成功！`,
              icon: "success",
              duration: 1500,
            });
          }

          // 本页不再绘制 3 秒出卡图片，直接在路书页体验
        } else {
          throw new Error(res.result.error || "生成失败");
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("❌ 生成失败:", err);

        this.setData({
          loading: false,
        });

        wx.showToast({
          title: "网络不稳，已为您推荐热门路线",
          icon: "none",
          duration: 2000,
        });
      });
  },

  // ============================================
  // Block 操作方法 - CRUD
  // ============================================

  /**
   * 更新指定 Block
   * @param {string} blockId - Block ID
   * @param {object} newData - 要更新的数据（会与原 content 合并）
   */
  updateBlock(blockId, newData) {
    const { blocks } = this.data;
    const blockIndex = blocks.findIndex((b) => b.id === blockId);

    if (blockIndex === -1) {
      console.warn("❌ updateBlock: Block 不存在", blockId);
      return false;
    }

    // 深拷贝 blocks 数组
    const newBlocks = [...blocks];
    const block = { ...newBlocks[blockIndex] };

    // 合并更新 content
    block.content = {
      ...block.content,
      ...newData,
    };

    // 更新时间戳
    block.updatedAt = Date.now();

    newBlocks[blockIndex] = block;

    // 同时更新 tripInfo 的 updatedAt
    const newTripInfo = {
      ...this.data.tripInfo,
      updatedAt: Date.now(),
    };

    this.setData({
      blocks: newBlocks,
      tripInfo: newTripInfo,
    });

    console.log("✅ Block 已更新:", blockId, newData);
    return true;
  },

  /**
   * 删除指定 Block
   * @param {string} blockId - Block ID
   */
  deleteBlock(blockId) {
    const { blocks } = this.data;
    const blockIndex = blocks.findIndex((b) => b.id === blockId);

    if (blockIndex === -1) {
      console.warn("❌ deleteBlock: Block 不存在", blockId);
      return false;
    }

    const deletedBlock = blocks[blockIndex];

    // 过滤掉该 Block
    const newBlocks = blocks.filter((b) => b.id !== blockId);

    // 更新 tripInfo
    const newTripInfo = {
      ...this.data.tripInfo,
      updatedAt: Date.now(),
    };

    this.setData({
      blocks: newBlocks,
      tripInfo: newTripInfo,
    });

    console.log("🗑️ Block 已删除:", blockId, deletedBlock.type);

    wx.showToast({
      title: "已删除",
      icon: "success",
      duration: 1000,
    });

    return true;
  },

  /**
   * 在指定位置插入新 Block
   * @param {string} type - Block 类型
   * @param {string} afterBlockId - 在此 Block 之后插入（为空则在末尾插入）
   * @param {object} content - 初始内容（可选）
   */
  addBlock(type, afterBlockId = null, content = {}) {
    const { blocks } = this.data;

    // 计算新 Block 的 order
    let newOrder = 100;
    let insertIndex = blocks.length;

    if (afterBlockId) {
      const afterIndex = blocks.findIndex((b) => b.id === afterBlockId);
      if (afterIndex !== -1) {
        const afterBlock = blocks[afterIndex];
        const nextBlock = blocks[afterIndex + 1];

        if (nextBlock) {
          // 在两个 Block 之间插入
          newOrder = Math.floor((afterBlock.order + nextBlock.order) / 2);
        } else {
          // 在最后一个 Block 之后插入
          newOrder = afterBlock.order + 100;
        }

        insertIndex = afterIndex + 1;
      }
    } else if (blocks.length > 0) {
      // 在末尾插入
      newOrder = blocks[blocks.length - 1].order + 100;
    }

    // 根据类型创建 Block
    let newBlock = null;

    switch (type) {
      case BLOCK_TYPES.TEXT:
        newBlock = createTextBlock(
          content.text || "",
          newOrder,
          content.style || "normal"
        );
        break;
      case BLOCK_TYPES.POI:
        newBlock = createPoiBlock(content, newOrder);
        break;
      case BLOCK_TYPES.DAY_DIVIDER:
        const maxDayIndex = blocks
          .filter((b) => b.type === BLOCK_TYPES.DAY_DIVIDER)
          .reduce((max, b) => Math.max(max, b.content.dayIndex || 0), 0);
        newBlock = createDayDividerBlock(maxDayIndex + 1, newOrder);
        break;
      case BLOCK_TYPES.TRANSPORT:
        newBlock = createTransportBlock(content, newOrder);
        break;
      case BLOCK_TYPES.IMAGE:
        newBlock = createImageBlock(
          content.url || "",
          newOrder,
          content.caption || ""
        );
        break;
      default:
        console.warn("❌ addBlock: 未知的 Block 类型", type);
        return null;
    }

    // 插入到 blocks 数组
    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex, 0, newBlock);

    // 重新排序（按 order 排序）
    newBlocks.sort((a, b) => a.order - b.order);

    // 更新 tripInfo
    const newTripInfo = {
      ...this.data.tripInfo,
      updatedAt: Date.now(),
    };

    this.setData({
      blocks: newBlocks,
      tripInfo: newTripInfo,
      activeBlockId: newBlock.id, // 自动选中新 Block
    });

    console.log("➕ Block 已添加:", newBlock.id, type);
    return newBlock;
  },

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.setData({
      blockEditMode: !this.data.blockEditMode,
    });

    wx.showToast({
      title: this.data.blockEditMode ? "编辑模式开启" : "编辑模式关闭",
      icon: "none",
      duration: 1000,
    });
  },

  /**
   * 处理 Block 导航事件
   */
  onBlockNavigate(e) {
    const { blockId, name, address, location } = e.detail;
    console.log("🧭 导航:", name, location);
    // POI Block 内部已处理 wx.openLocation，这里可做额外逻辑
  },

  /**
   * 处理 Block 删除事件
   */
  onBlockDelete(e) {
    const { blockId } = e.detail;
    this.deleteBlock(blockId);
  },

  /**
   * 处理 Block 编辑事件
   */
  onBlockEdit(e) {
    const { blockId, field, value, completed } = e.detail;
    if (completed) {
      this.updateBlock(blockId, { [field]: value });
    }
  },

  /**
   * 处理 Text Block 文本变更事件
   */
  onBlockTextChange(e) {
    const { blockId, text, completed } = e.detail;
    if (completed) {
      this.updateBlock(blockId, { text: text });
    }
  },

  // ============================================
  // FAB 悬浮栏按钮事件
  // ============================================

  /**
   * 添加文本备注块
   */
  onAddTextBlock() {
    const { blocks } = this.data;

    // 找到最后一个非 day-divider 的 block 作为插入点
    let afterBlockId = null;
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type !== BLOCK_TYPES.DAY_DIVIDER) {
        afterBlockId = blocks[i].id;
        break;
      }
    }

    // 弹出输入框让用户输入备注
    wx.showModal({
      title: "添加备注",
      editable: true,
      placeholderText: "输入备注内容...",
      success: (res) => {
        if (res.confirm && res.content) {
          const newBlock = this.addBlock(BLOCK_TYPES.TEXT, afterBlockId, {
            text: res.content,
            style: "tip", // 默认使用 tip 样式
          });

          if (newBlock) {
            wx.showToast({
              title: "备注已添加",
              icon: "success",
              duration: 1000,
            });
          }
        }
      },
    });
  },

  /**
   * 添加地点块 (调用 wx.chooseLocation)
   */
  onAddPoiBlock() {
    const { blocks } = this.data;

    // 找到最后一个 POI block 作为插入点
    let afterBlockId = null;
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === BLOCK_TYPES.POI) {
        afterBlockId = blocks[i].id;
        break;
      }
    }

    // 如果没有 POI，就在最后一个 day-divider 后面插入
    if (!afterBlockId) {
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].type === BLOCK_TYPES.DAY_DIVIDER) {
          afterBlockId = blocks[i].id;
          break;
        }
      }
    }

    // 调用微信选择位置 API
    wx.chooseLocation({
      success: (res) => {
        console.log("📍 选择的地点:", res);

        const newBlock = this.addBlock(BLOCK_TYPES.POI, afterBlockId, {
          name: res.name || "未命名地点",
          address: res.address || "",
          location: {
            lat: res.latitude,
            lng: res.longitude,
          },
          startTime: "",
          duration: 60, // 默认 1 小时
          cost: 0,
          description: res.address || "",
        });

        if (newBlock) {
          wx.showToast({
            title: "地点已添加",
            icon: "success",
            duration: 1000,
          });
        }
      },
      fail: (err) => {
        console.log("选择地点失败或取消:", err);
        // 用户取消不提示错误
        if (err.errMsg && !err.errMsg.includes("cancel")) {
          wx.showToast({
            title: "选择地点失败",
            icon: "none",
          });
        }
      },
    });
  },

  // ============================================
  // 其他方法
  // ============================================

  // 保存到相册
  saveToAlbum() {
    const { cardImagePath, generatedImagePath } = this.data;
    const imagePath = generatedImagePath || cardImagePath;

    if (!imagePath) {
      wx.showToast({
        title: "请先生成海报",
        icon: "none",
      });
      return;
    }

    // 保存图片到相册
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
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
    const { themes, planData, blocks, tripInfo } = this.data;

    this.setData({
      themeIndex: index,
      showThemeSelector: false,
    });

    // 如果已有行程数据，重新绘制
    // 优先使用 blocks 数据
    let plan = planData;
    if (blocks && blocks.length > 0) {
      const convertedPlan = convertBlocksToPlan(blocks, tripInfo);
      if (
        convertedPlan &&
        convertedPlan.days &&
        convertedPlan.days.length > 0
      ) {
        plan = convertedPlan;
      }
    }

    if (plan) {
      wx.showToast({
        title: `切换到${themes[index].name}主题`,
        icon: "none",
        duration: 1500,
      });
      this.drawCardImage(plan);
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
    const { backgrounds } = this.data;
    const bg = backgrounds[index];

    console.log("选择背景:", bg.name, "索引:", index);

    // 如果是自定义图片背景
    if (bg.type === "image") {
      this.uploadCustomBackground();
      return;
    }

    this.setData({
      bgIndex: index,
      currentBgImage: "", // 清空自定义图片，使用渐变
      showBgSelector: false,
    });

    // 如果有行程数据，提示重新生成图片
    if (this.data.planData) {
      wx.showToast({
        title: `切换到${bg.name}背景`,
        icon: "none",
        duration: 1500,
      });
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

        this.setData({
          currentBgImage: tempFilePath,
          bgIndex: 4, // 自定义背景索引
          showBgSelector: false,
        });

        wx.showToast({
          title: "背景已更换",
          icon: "success",
        });
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

  // 生成分享海报
  generatePoster() {
    const { blocks, tripInfo, planData } = this.data;

    // 优先使用 blocks 数据（可能包含用户编辑后的内容）
    let plan = planData;
    if (blocks && blocks.length > 0) {
      const convertedPlan = convertBlocksToPlan(blocks, tripInfo);
      if (
        convertedPlan &&
        convertedPlan.days &&
        convertedPlan.days.length > 0
      ) {
        plan = convertedPlan;
        console.log("📦 使用 blocks 转换的 plan 生成海报");
      }
    }

    if (!plan) {
      wx.showToast({
        title: "请先生成行程",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "正在生成分享海报...",
      mask: true,
    });

    console.log("开始生成分享海报");

    // 先生成二维码，再绘制海报
    this.generateQRCode()
      .then(() => {
        // 绘制包含二维码的完整海报
        this.drawPosterWithQR(plan);
      })
      .catch((err) => {
        console.error("生成二维码失败:", err);
        // 即使二维码失败，也继续生成海报
        this.drawPosterWithQR(plan);
      });
  },

  // 生成小程序二维码
  generateQRCode() {
    return new Promise((resolve, reject) => {
      // 构造场景值，包含用户的行程参数
      const scene = `c=${this.data.cityIndex}&d=${this.data.dayIndex}&i=${this.data.intentIndex}`;

      wx.cloud
        .callFunction({
          name: "generateQRCode",
          data: {
            scene: scene,
          },
        })
        .then((res) => {
          if (res.result && res.result.success) {
            console.log("二维码生成成功:", res.result.fileID);

            // 获取临时链接
            wx.cloud
              .getTempFileURL({
                fileList: [res.result.fileID],
              })
              .then((tempRes) => {
                if (tempRes.fileList && tempRes.fileList.length > 0) {
                  this.setData({
                    qrCodeUrl: tempRes.fileList[0].tempFileURL,
                  });
                  resolve();
                } else {
                  reject(new Error("获取二维码临时链接失败"));
                }
              })
              .catch(reject);
          } else {
            reject(new Error(res.result.error || "生成二维码失败"));
          }
        })
        .catch(reject);
    });
  },

  // 返回编辑模式
  backToEdit() {
    this.setData({
      generatedImagePath: null,
    });
  },

  // 显示图片菜单
  showImageMenu() {
    wx.showActionSheet({
      itemList: ["保存到相册", "发送给朋友", "分享到朋友圈"],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.saveToAlbum();
            break;
          case 1:
            wx.showToast({
              title: "长按图片可直接发送",
              icon: "none",
            });
            break;
          case 2:
            wx.showToast({
              title: "长按图片可分享朋友圈",
              icon: "none",
            });
            break;
        }
      },
    });
  },

  // 监听活动描述编辑
  onActivityEdit(e) {
    const { dayIndex, actIndex } = e.currentTarget.dataset;
    const newVal = e.detail.value;

    console.log("编辑活动:", dayIndex, actIndex, newVal);

    // 更新数据源
    const updatePath = `planData.days[${dayIndex}].activities[${actIndex}].description`;
    this.setData({
      [updatePath]: newVal,
      isEditing: true,
    });

    // 标记数据已修改，需要重新生成图片
    console.log("活动描述已更新");
  },

  // 地图导航功能
  openMap(e) {
    const { location, address } = e.currentTarget.dataset;
    const locationName = location || address;

    if (!locationName) {
      wx.showToast({
        title: "地址信息不完整",
        icon: "none",
      });
      return;
    }

    console.log("打开地图导航:", locationName);

    wx.showLoading({ title: "打开地图..." });

    // 使用微信内置地图搜索
    // 注意：实际项目中建议先调用腾讯地图API获取精确经纬度
    setTimeout(() => {
      wx.hideLoading();

      // 方案1：直接搜索地点名称（推荐）
      wx.openLocation({
        latitude: 31.2304, // 默认上海坐标，实际应该通过API获取
        longitude: 121.4737,
        name: locationName,
        address: address || locationName,
        scale: 18,
      }).catch(() => {
        // 如果openLocation失败，提供备选方案
        wx.showModal({
          title: "导航提示",
          content: `即将导航到：${locationName}`,
          confirmText: "复制地址",
          success: (res) => {
            if (res.confirm) {
              wx.setClipboardData({
                data: locationName,
                success: () => {
                  wx.showToast({
                    title: "地址已复制",
                    icon: "success",
                  });
                },
              });
            }
          },
        });
      });
    }, 500);
  },

  // 生成图片 - 基于编辑后的数据
  generateImage() {
    const { blocks, tripInfo, planData } = this.data;

    // 优先使用 blocks 数据（可能包含用户编辑后的内容）
    let plan = planData;
    if (blocks && blocks.length > 0) {
      const convertedPlan = convertBlocksToPlan(blocks, tripInfo);
      if (
        convertedPlan &&
        convertedPlan.days &&
        convertedPlan.days.length > 0
      ) {
        plan = convertedPlan;
        console.log("📦 使用 blocks 转换的 plan 生成长图");
      }
    }

    if (!plan) {
      wx.showToast({
        title: "请先生成行程",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "生成图片中...",
      mask: true,
    });

    console.log("开始生成长图，使用最新的数据");

    // 使用现有的drawCardImage方法，传入最新数据
    this.drawCardImage(plan);
  },

  // 绘制包含二维码的海报
  drawPosterWithQR(plan) {
    const {
      cities,
      cityIndex,
      intents,
      intentIndex,
      days,
      dayIndex,
      backgrounds,
      bgIndex,
      currentBgImage,
      qrCodeUrl,
      selectedCity,
    } = this.data;

    console.log("开始绘制包含二维码的海报");

    // 动态计算画布高度
    const canvasWidth = 750;
    let estimatedHeight = 200; // 头部区域

    // 计算内容高度
    plan.days.forEach((day) => {
      estimatedHeight += 120; // 日期标题
      day.activities.forEach((activity) => {
        estimatedHeight += 200; // 每个活动项
        const descLines = Math.ceil((activity.description || "").length / 20);
        estimatedHeight += descLines * 30;
      });
      estimatedHeight += 40; // 天数间隔
    });

    estimatedHeight += 300; // 底部区域（包含二维码）
    const canvasHeight = Math.max(estimatedHeight, 1400);

    console.log("计算的海报高度:", canvasHeight);

    this.setData({
      canvasHeight: canvasHeight,
    });

    const ctx = wx.createCanvasContext("cardCanvas", this);
    const currentBg = backgrounds[bgIndex];

    // 1. 绘制背景
    if (currentBgImage) {
      ctx.drawImage(currentBgImage, 0, 0, canvasWidth, canvasHeight);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, currentBg.color1);
      gradient.addColorStop(1, currentBg.color2);
      ctx.setFillStyle(gradient);
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. 绘制毛玻璃遮罩
    ctx.setFillStyle("rgba(255, 255, 255, 0.85)");
    const maskPadding = 40;
    const maskWidth = canvasWidth - maskPadding * 2;
    const maskHeight = canvasHeight - maskPadding * 2;
    this.roundRect(ctx, maskPadding, maskPadding, maskWidth, maskHeight, 20);
    ctx.fill();

    let y = 120;

    // 3. 绘制标题
    ctx.setFillStyle("#333");
    ctx.setFontSize(44);
    ctx.setTextAlign("center");
    const titleCity = selectedCity || cities[cityIndex];
    ctx.fillText(
      `✈️ ${titleCity} · ${days[dayIndex]}天之旅`,
      canvasWidth / 2,
      y
    );
    y += 60;

    ctx.setFillStyle("#666");
    ctx.setFontSize(28);
    ctx.fillText(`${intents[intentIndex]} · 我的专属行程`, canvasWidth / 2, y);
    y += 80;

    // 4. 绘制分隔线
    ctx.setStrokeStyle("rgba(161, 140, 209, 0.3)");
    ctx.setLineWidth(2);
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(canvasWidth - 80, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 60;

    // 5. 绘制行程内容
    plan.days.forEach((day, dayIdx) => {
      // 日期标题
      ctx.setFillStyle("#a18cd1");
      const badgeWidth = 120;
      const badgeHeight = 40;
      const badgeX = 80;
      this.roundRect(ctx, badgeX, y - 30, badgeWidth, badgeHeight, 20);
      ctx.fill();

      ctx.setFillStyle("#fff");
      ctx.setFontSize(28);
      ctx.setTextAlign("center");
      ctx.fillText(`Day ${day.day}`, badgeX + badgeWidth / 2, y - 5);

      ctx.setFillStyle("#333");
      ctx.setFontSize(30);
      ctx.setTextAlign("left");
      ctx.fillText(
        day.date || `第${day.day}天`,
        badgeX + badgeWidth + 20,
        y - 5
      );
      y += 80;

      // 活动列表
      day.activities.forEach((activity) => {
        // 活动背景卡片
        ctx.setFillStyle("rgba(255, 255, 255, 0.6)");
        const cardHeight = 160;
        this.roundRect(ctx, 80, y - 20, canvasWidth - 160, cardHeight, 16);
        ctx.fill();

        // 时间和费用
        ctx.setFillStyle("rgba(136, 136, 136, 0.1)");
        this.roundRect(ctx, 100, y, 80, 30, 15);
        ctx.fill();

        ctx.setFillStyle("#888");
        ctx.setFontSize(24);
        ctx.setTextAlign("center");
        ctx.fillText(activity.time || "全天", 140, y + 20);

        ctx.setFillStyle("#e74c3c");
        ctx.setFontSize(24);
        ctx.setTextAlign("right");
        ctx.fillText(`¥${activity.cost}`, canvasWidth - 100, y + 20);

        y += 50;

        // 活动名称
        ctx.setFillStyle("#333");
        ctx.setFontSize(32);
        ctx.setTextAlign("left");
        ctx.fillText(activity.name, 100, y);

        y += 40;

        // 活动描述
        ctx.setFillStyle("#666");
        ctx.setFontSize(26);
        const descLines = this.wrapText(
          ctx,
          activity.description || "",
          canvasWidth - 200,
          26
        );
        descLines.forEach((line, idx) => {
          ctx.fillText(line, 100, y + idx * 35);
        });
        y += descLines.length * 35 + 20;

        // 时长
        ctx.setFillStyle("#888");
        ctx.setFontSize(24);
        ctx.fillText(`⏱ ${activity.duration}小时`, 100, y);
        y += 60;
      });

      y += 40; // 天数间隔
    });

    // 6. 绘制二维码区域
    y += 30;
    ctx.setStrokeStyle("rgba(161, 140, 209, 0.3)");
    ctx.setLineWidth(2);
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(canvasWidth - 80, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 50;

    // 二维码背景
    ctx.setFillStyle("rgba(255, 255, 255, 0.8)");
    this.roundRect(ctx, 80, y, canvasWidth - 160, 120, 16);
    ctx.fill();

    // 二维码文字
    ctx.setFillStyle("#333");
    ctx.setFontSize(28);
    ctx.setTextAlign("left");
    ctx.fillText("扫码获取同款行程", 100, y + 35);

    ctx.setFillStyle("#666");
    ctx.setFontSize(22);
    ctx.fillText("AI 智能定制 · 3秒出卡", 100, y + 65);

    // 绘制二维码图片
    const finalY = y;
    if (qrCodeUrl) {
      // 下载二维码图片并绘制
      wx.downloadFile({
        url: qrCodeUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            ctx.drawImage(
              res.tempFilePath,
              canvasWidth - 180,
              finalY + 10,
              100,
              100
            );
            this.finalizePoster(ctx, finalY + 140, plan);
          } else {
            this.finalizePoster(ctx, finalY + 120, plan);
          }
        },
        fail: () => {
          this.finalizePoster(ctx, finalY + 120, plan);
        },
      });
    } else {
      this.finalizePoster(ctx, y + 120, plan);
    }
  },

  // 完成海报绘制
  finalizePoster(ctx, y, plan) {
    // 总费用
    ctx.setFillStyle("#e74c3c");
    ctx.setFontSize(32);
    ctx.setTextAlign("center");
    ctx.fillText(`💰 预计总费用：¥${plan.total_cost}`, 375, y + 50);

    // 执行绘制
    ctx.draw(false, () => {
      console.log("海报绘制完成，开始转换");
      this.canvasToPoster();
    });
  },

  // Canvas转海报图片
  canvasToPoster() {
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
          console.log("✅ 海报生成成功:", res.tempFilePath);

          this.setData({
            generatedImagePath: res.tempFilePath,
            cardImagePath: res.tempFilePath, // 保持兼容
          });

          wx.hideLoading();
          wx.showToast({
            title: "海报生成成功！",
            icon: "success",
            duration: 1500,
          });
        },
        fail: (err) => {
          console.error("❌ 海报生成失败:", err);
          wx.hideLoading();
          wx.showToast({
            title: "海报生成失败",
            icon: "none",
          });
        },
      },
      this
    );
  },

  // 绘制长图海报
  drawCardImage(plan) {
    const {
      cities,
      cityIndex,
      intents,
      intentIndex,
      days,
      dayIndex,
      backgrounds,
      bgIndex,
      currentBgImage,
      selectedCity,
    } = this.data;

    console.log("开始绘制长图海报");

    // 动态计算画布高度 - 支持长图
    const canvasWidth = 750;
    let estimatedHeight = 200; // 头部区域

    // 计算内容高度
    plan.days.forEach((day) => {
      estimatedHeight += 120; // 日期标题
      day.activities.forEach((activity) => {
        estimatedHeight += 200; // 每个活动项
        // 根据描述长度增加高度
        const descLines = Math.ceil((activity.description || "").length / 20);
        estimatedHeight += descLines * 30;
      });
      estimatedHeight += 40; // 天数间隔
    });

    estimatedHeight += 200; // 底部区域
    const canvasHeight = Math.max(estimatedHeight, 1200);

    console.log("计算的长图高度:", canvasHeight);

    // 更新Canvas尺寸
    this.setData({
      canvasHeight: canvasHeight,
    });

    const ctx = wx.createCanvasContext("cardCanvas", this);
    const currentBg = backgrounds[bgIndex];

    // 1. 绘制背景
    if (currentBgImage) {
      // 自定义图片背景
      ctx.drawImage(currentBgImage, 0, 0, canvasWidth, canvasHeight);
    } else {
      // 渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, currentBg.color1);
      gradient.addColorStop(1, currentBg.color2);
      ctx.setFillStyle(gradient);
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. 绘制毛玻璃遮罩
    ctx.setFillStyle("rgba(255, 255, 255, 0.85)");
    const maskPadding = 40;
    const maskWidth = canvasWidth - maskPadding * 2;
    const maskHeight = canvasHeight - maskPadding * 2;
    this.roundRect(ctx, maskPadding, maskPadding, maskWidth, maskHeight, 20);
    ctx.fill();

    let y = 120;

    // 3. 绘制标题
    ctx.setFillStyle("#333");
    ctx.setFontSize(44);
    ctx.setTextAlign("center");
    const titleCity = selectedCity || cities[cityIndex];
    ctx.fillText(
      `✈️ ${titleCity} · ${days[dayIndex]}天之旅`,
      canvasWidth / 2,
      y
    );
    y += 60;

    ctx.setFillStyle("#666");
    ctx.setFontSize(28);
    ctx.fillText(`${intents[intentIndex]} · 我的专属行程`, canvasWidth / 2, y);
    y += 80;

    // 4. 绘制分隔线
    ctx.setStrokeStyle("rgba(161, 140, 209, 0.3)");
    ctx.setLineWidth(2);
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(canvasWidth - 80, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 60;

    // 5. 绘制行程内容
    plan.days.forEach((day, dayIdx) => {
      // 日期标题
      ctx.setFillStyle("#fff");
      const badgeWidth = 120;
      const badgeHeight = 40;
      const badgeX = 80;
      this.roundRect(ctx, badgeX, y - 30, badgeWidth, badgeHeight, 20);
      ctx.fill();

      ctx.setFillStyle("#a18cd1");
      ctx.setFontSize(28);
      ctx.setTextAlign("center");
      ctx.fillText(`Day ${day.day}`, badgeX + badgeWidth / 2, y - 5);

      ctx.setFillStyle("#333");
      ctx.setFontSize(30);
      ctx.setTextAlign("left");
      ctx.fillText(
        day.date || `第${day.day}天`,
        badgeX + badgeWidth + 20,
        y - 5
      );
      y += 80;

      // 活动列表
      day.activities.forEach((activity, actIndex) => {
        // 活动背景卡片
        ctx.setFillStyle("rgba(255, 255, 255, 0.6)");
        const cardHeight = 160;
        this.roundRect(ctx, 80, y - 20, canvasWidth - 160, cardHeight, 16);
        ctx.fill();

        // 时间标签
        ctx.setFillStyle("rgba(136, 136, 136, 0.1)");
        this.roundRect(ctx, 100, y, 80, 30, 15);
        ctx.fill();

        ctx.setFillStyle("#888");
        ctx.setFontSize(24);
        ctx.setTextAlign("center");
        ctx.fillText(activity.time || "全天", 140, y + 20);

        // 费用
        ctx.setFillStyle("#e74c3c");
        ctx.setFontSize(24);
        ctx.setTextAlign("right");
        ctx.fillText(`¥${activity.cost}`, canvasWidth - 100, y + 20);

        y += 50;

        // 活动名称
        ctx.setFillStyle("#333");
        ctx.setFontSize(32);
        ctx.setTextAlign("left");
        ctx.fillText(activity.name, 100, y);

        // 导航图标
        ctx.setFillStyle("#007aff");
        ctx.setFontSize(20);
        ctx.setTextAlign("right");
        ctx.fillText("� 导航", canvasWidth - 100, y);

        y += 40;

        // 活动描述
        ctx.setFillStyle("#666");
        ctx.setFontSize(26);
        const descLines = this.wrapText(
          ctx,
          activity.description || "",
          canvasWidth - 200,
          26
        );
        descLines.forEach((line, idx) => {
          ctx.fillText(line, 100, y + idx * 35);
        });
        y += descLines.length * 35 + 20;

        // 时长
        ctx.setFillStyle("#888");
        ctx.setFontSize(24);
        ctx.fillText(`⏱ ${activity.duration}小时`, 100, y);
        y += 60;
      });

      y += 40; // 天数间隔
    });

    // 6. 绘制底部
    y += 30;
    ctx.setStrokeStyle("rgba(161, 140, 209, 0.3)");
    ctx.setLineWidth(2);
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(canvasWidth - 80, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 50;

    ctx.setFillStyle("#e74c3c");
    ctx.setFontSize(32);
    ctx.setTextAlign("center");
    ctx.fillText(`💰 预计总费用：¥${plan.total_cost}`, canvasWidth / 2, y);
    y += 50;

    ctx.setFillStyle("#999");
    ctx.setFontSize(24);
    ctx.fillText("Created by 3秒出卡", canvasWidth / 2, y);

    // 执行绘制
    ctx.draw(false, () => {
      console.log("长图绘制完成，开始转换");
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
