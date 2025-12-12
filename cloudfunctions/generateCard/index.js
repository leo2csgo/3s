// 云函数：生成行程卡片（升级版：腾讯 LBS + 智能分天 + 完美兜底）
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const FALLBACK_DATA = require("./fallbackData");

// 智能分类标签字典（增强版）
const TAG_KEYWORDS = {
  亲子遛娃: [
    "迪士尼",
    "海洋馆",
    "乐园",
    "动物园",
    "儿童",
    "科技馆",
    "水族馆",
    "游乐",
    "亲子",
    "童话",
    "主题公园",
    "游戏",
    "体验馆",
    "儿童乐园",
  ],
  情侣约会: [
    "外滩",
    "夜景",
    "咖啡",
    "酒吧",
    "甜品",
    "江景",
    "灯光秀",
    "浪漫",
    "情侣",
    "观景",
    "公园",
    "湖景",
    "山景",
    "温泉",
    "SPA",
  ],
  朋友小聚: [
    "网红",
    "打卡",
    "ins",
    "小红书",
    "下午茶",
    "拍照",
    "美食",
    "酒吧",
    "KTV",
    "桌游",
    "密室",
    "剧本杀",
    "电影",
    "购物",
  ],
  美食探店: [
    "餐厅",
    "美食",
    "小吃",
    "火锅",
    "烧烤",
    "海鲜",
    "甜品",
    "咖啡",
    "茶馆",
    "特色菜",
    "本帮菜",
    "川菜",
    "粤菜",
    "日料",
    "西餐",
  ],
};

// 预算范围配置
const BUDGET_RANGE = {
  亲子遛娃: { min: 600, max: 1200 },
  情侣约会: { min: 400, max: 800 },
  朋友小聚: { min: 300, max: 600 },
  美食探店: { min: 500, max: 900 },
};

// 云函数入口函数
// 预留 provider 字段，后续可根据 provider 使用 DeepSeek / 腾讯云大模型等生成行程
// provider 取值示例："tencent-lbs"(默认)、"deepseek", "tencent-llm"
exports.main = async (event, context) => {
  let { city, days, intent_tag, provider } = event;
  const modelProvider = provider || "tencent-lbs";

  console.log("收到请求:", { city, days, intent_tag, provider: modelProvider });

  // 参数验证
  if (!city || !days || !intent_tag) {
    console.error("参数验证失败:", { city, days, intent_tag });
    return {
      success: false,
      error: "参数不完整：city、days、intent_tag 都是必需的",
      data: null,
      isRealtime: false,
    };
  }

  // 标准化天数参数
  if (typeof days === "number") {
    days = days + "天";
  } else if (typeof days === "string") {
    // 如果是 "1"、"2"、"3" 这样的字符串，转换为 "1天"、"2天"、"3天"
    if (["1", "2", "3"].includes(days)) {
      days = days + "天";
    }
  }

  // 验证参数类型和范围
  if (typeof city !== "string" || city.trim() === "") {
    return {
      success: false,
      error: "城市名称格式错误",
      data: null,
      isRealtime: false,
    };
  }

  if (!["1天", "2天", "3天"].includes(days)) {
    console.error("天数参数错误:", days, "期望: 1天、2天、3天");
    return {
      success: false,
      error: `天数参数错误：${days}，只支持 1天、2天、3天`,
      data: null,
      isRealtime: false,
    };
  }

  if (!["亲子遛娃", "情侣约会", "朋友小聚", "美食探店"].includes(intent_tag)) {
    return {
      success: false,
      error: "目的标签错误",
      data: null,
      isRealtime: false,
    };
  }

  console.log("参数验证通过:", { city, days, intent_tag });

  try {
    // 尝试获取实时 POI 数据
    console.log("开始获取实时 POI 数据...");
    const poiResult = await cloud.callFunction({
      name: "getPoiList",
      data: { city: city.trim() },
    });

    console.log("getPoiList 调用结果:", poiResult);

    let activities = [];
    let isRealtime = false;

    if (
      poiResult.result &&
      poiResult.result.success &&
      poiResult.result.data.length > 0
    ) {
      // 使用实时数据
      console.log("✅ 使用实时 POI 数据，数量:", poiResult.result.data.length);
      activities = convertPOIToActivities(poiResult.result.data, intent_tag);
      isRealtime = true;
    } else {
      // 使用兜底数据
      console.log("⚠️ 实时数据获取失败，使用兜底数据");
      console.log("失败原因:", poiResult.result?.error || "未知错误");
      activities = getFallbackActivities(city, intent_tag);
      isRealtime = false;
    }

    if (activities.length === 0) {
      throw new Error(`暂不支持 ${city} 的行程规划`);
    }

    // 生成智能行程
    const plan = generateSmartPlan(activities, days, intent_tag);
    const content = generateTextContent(plan, city, days, intent_tag);

    // 【新增】转换为 Block 结构
    const { tripInfo, blocks } = convertPlanToBlocks(plan, {
      city: city,
      intent: intent_tag,
      days: days,
    });

    console.log("✅ 行程生成成功:", {
      城市: city,
      天数: days,
      目的: intent_tag,
      景点数量: activities.length,
      是否实时: isRealtime,
      blocks数量: blocks.length,
    });

    return {
      success: true,
      plan: plan, // 保留旧结构用于兼容
      content: content,
      isRealtime: isRealtime,
      // 【新增】Block 数据
      tripInfo: tripInfo,
      blocks: blocks,
    };
  } catch (error) {
    console.error("❌ 生成行程失败:", error);

    // 最后的兜底：返回兜底数据
    try {
      const fallbackActivities = getFallbackActivities(city, intent_tag);
      if (fallbackActivities.length > 0) {
        const plan = generateSmartPlan(fallbackActivities, days, intent_tag);
        const content = generateTextContent(plan, city, days, intent_tag);

        // 【新增】转换为 Block 结构
        const { tripInfo, blocks } = convertPlanToBlocks(plan, {
          city: city,
          intent: intent_tag,
          days: days,
        });

        console.log("🔄 使用最终兜底数据, blocks:", blocks.length);

        return {
          success: true,
          plan: plan,
          content: content,
          isRealtime: false,
          tripInfo: tripInfo,
          blocks: blocks,
        };
      }
    } catch (fallbackError) {
      console.error("❌ 兜底数据也失败:", fallbackError);
    }

    return {
      success: false,
      error: error.message,
      data: null,
      isRealtime: false,
    };
  }
};

/**
 * 统一的大模型返回结构约定（DeepSeek / 腾讯云等）：
 * {
 *   success: boolean,
 *   plan: { days: Array, total_cost: number },
 *   content: string,
 *   isRealtime: boolean,
 *   tripInfo: object,
 *   blocks: Array<object>,
 * }
 *
 * 这里只是预留接口，当前版本仍然只使用 LBS + 兜底数据方案。
 * 后续接入 DeepSeek / 腾讯云大模型时，可以在这里实现真实调用，
 * 并将返回结果转换为上述统一结构即可与前端完全兼容。
 */
async function generatePlanWithModel({ city, days, intent_tag, provider }) {
  console.log("generatePlanWithModel 占位实现", {
    city,
    days,
    intent_tag,
    provider,
  });
  return null;
}

// 将腾讯 LBS POI 转换为活动格式（增强版）
function convertPOIToActivities(pois, purpose) {
  console.log("开始转换 POI 数据，目的:", purpose);

  const activities = pois.map((poi) => {
    // 计算匹配度
    const score = calculateMatchScore(poi, purpose);

    // 估算时长和费用
    const { duration, cost } = estimateDurationAndCost(poi, purpose);

    return {
      name: poi.name,
      address: poi.address,
      category: poi.category,
      // 关键：保留腾讯 LBS 返回的经纬度，后续用于路书 POI、地图模式和导航
      location: poi.location || null,
      duration: duration,
      cost: cost,
      description: `${poi.category} - ${poi.address}`,
      score: score, // 匹配度分数
      purpose: purpose, // 添加目的标记
    };
  });

  // 按匹配度排序，分数高的在前
  activities.sort((a, b) => b.score - a.score);

  // 过滤掉分数太低的活动（小于5分的基本不相关）
  const filteredActivities = activities.filter((act) => act.score >= 5);

  console.log("POI 转换完成，活动数量:", filteredActivities.length);
  console.log(
    "前3个活动分数:",
    filteredActivities.slice(0, 3).map((act) => ({
      name: act.name,
      score: act.score,
      category: act.category,
    }))
  );

  return filteredActivities;
}

// 计算 POI 与目的的匹配度（增强版）
function calculateMatchScore(poi, purpose) {
  const keywords = TAG_KEYWORDS[purpose] || [];
  const text = `${poi.name} ${poi.category}`.toLowerCase();

  let score = 0;

  // 关键词匹配（权重更高）
  keywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      score += 20; // 提高匹配分数
    }
  });

  // 根据不同目的调整分类权重
  const category = poi.category.toLowerCase();

  if (purpose === "美食探店") {
    if (
      category.includes("餐厅") ||
      category.includes("美食") ||
      category.includes("小吃")
    ) {
      score += 15;
    }
    if (
      category.includes("咖啡") ||
      category.includes("甜品") ||
      category.includes("茶")
    ) {
      score += 10;
    }
  } else if (purpose === "亲子遛娃") {
    if (
      category.includes("乐园") ||
      category.includes("动物园") ||
      category.includes("儿童")
    ) {
      score += 15;
    }
    if (
      category.includes("博物馆") ||
      category.includes("科技馆") ||
      category.includes("水族馆")
    ) {
      score += 10;
    }
  } else if (purpose === "情侣约会") {
    if (
      category.includes("景点") ||
      category.includes("公园") ||
      category.includes("江景")
    ) {
      score += 15;
    }
    if (
      category.includes("咖啡") ||
      category.includes("酒吧") ||
      category.includes("甜品")
    ) {
      score += 10;
    }
  } else if (purpose === "朋友小聚") {
    if (
      category.includes("酒吧") ||
      category.includes("ktv") ||
      category.includes("娱乐")
    ) {
      score += 15;
    }
    if (
      category.includes("网红") ||
      category.includes("拍照") ||
      category.includes("打卡")
    ) {
      score += 10;
    }
  }

  // 基础分
  return Math.max(score, 1);
}

// 估算时长和费用
function estimateDurationAndCost(poi, purpose) {
  const category = poi.category.toLowerCase();

  // 根据分类估算时长
  let duration = 3; // 默认 3 小时
  if (category.includes("乐园") || category.includes("主题")) {
    duration = 6;
  } else if (category.includes("博物馆") || category.includes("公园")) {
    duration = 4;
  } else if (category.includes("餐厅") || category.includes("咖啡")) {
    duration = 2;
  }

  // 根据目的估算费用
  const budgetRange = BUDGET_RANGE[purpose] || { min: 300, max: 600 };
  const cost =
    Math.floor((Math.random() * (budgetRange.max - budgetRange.min)) / 4) +
    budgetRange.min / 4;

  return { duration, cost };
}

// 获取兜底数据
function getFallbackActivities(city, purpose) {
  console.log("使用兜底数据 - 城市:", city, "目的:", purpose);

  // 如果 purpose 为空，使用默认值
  if (!purpose) {
    console.warn("目的为空，使用默认值: 亲子遛娃");
    purpose = "亲子遛娃";
  }

  // 尝试获取指定城市的数据
  if (FALLBACK_DATA[city] && FALLBACK_DATA[city][purpose]) {
    console.log(
      `找到兜底数据: ${city} - ${purpose}, 数量:`,
      FALLBACK_DATA[city][purpose].length
    );
    return FALLBACK_DATA[city][purpose];
  }

  // 如果城市不存在，使用上海数据
  console.log(`城市 ${city} 不存在，使用上海兜底数据`);
  if (FALLBACK_DATA["上海"] && FALLBACK_DATA["上海"][purpose]) {
    console.log(
      `找到上海兜底数据: ${purpose}, 数量:`,
      FALLBACK_DATA["上海"][purpose].length
    );
    return FALLBACK_DATA["上海"][purpose];
  }

  // 最后的兜底：返回上海的第一个目的的数据
  console.warn("无法找到匹配的兜底数据，使用上海亲子遛娃数据");
  return FALLBACK_DATA["上海"]["亲子遛娃"] || [];
}

// 智能分配行程到天数
function generateSmartPlan(activities, days, purpose) {
  console.log("开始智能分配行程 - 天数:", days, "活动数量:", activities.length);

  // 标准化天数参数
  let numDays = days;
  if (typeof days === "string") {
    if (days.includes("天")) {
      numDays = parseInt(days.replace("天", ""));
    } else {
      numDays = parseInt(days);
    }
  }

  if (!numDays || numDays < 1 || numDays > 3) {
    console.warn("天数无效，使用默认值: 2");
    numDays = 2;
  }

  console.log("处理后的天数:", numDays);

  if (!activities || activities.length === 0) {
    console.error("没有活动数据，返回空计划");
    return {
      days: [],
      total_cost: 0,
      tips: "暂无行程数据",
    };
  }

  const selectedActivities = activities.slice(0, 8);
  console.log("选中的活动数量:", selectedActivities.length);

  const plan = {
    days: [],
    total_cost: 0,
    tips: "轻松愉快的行程，享受美好时光！",
  };

  if (numDays === 1) {
    // 1天：3-4个活动，合理时间分配
    const dayActivities = selectedActivities.slice(0, 4);
    plan.days.push({
      day: 1,
      date: "Day 1",
      activities: dayActivities.map((act, index) => {
        const timeSlots = ["9:00", "11:30", "14:00", "16:30"];
        return {
          time: timeSlots[index] || `${9 + index * 2}:00`,
          name: act.name,
          duration: act.duration,
          cost: act.cost,
          // 保留地址和经纬度，后续用于路书 POI、地图模式和导航
          description: act.description || act.address,
          address: act.address || "",
          location: act.location || null,
        };
      }),
    });
  } else if (numDays === 2) {
    // 2天：每天3-4个活动
    for (let dayNum = 1; dayNum <= 2; dayNum++) {
      const startIdx = (dayNum - 1) * 4;
      const dayActivities = selectedActivities.slice(startIdx, startIdx + 4);

      plan.days.push({
        day: dayNum,
        date: `Day ${dayNum}`,
        activities: dayActivities.map((act, index) => {
          // 根据活动类型和时长智能分配时间
          const time = generateSmartTime(act, index, purpose);
          return {
            time: time,
            name: act.name,
            duration: act.duration,
            cost: act.cost,
            // 保留地址和经纬度
            description: act.description || act.address,
            address: act.address || "",
            location: act.location || null,
          };
        }),
      });
    }
  } else if (numDays === 3) {
    // 3天：平均分配
    const perDay = Math.ceil(selectedActivities.length / 3);

    for (let i = 0; i < 3; i++) {
      const dayActivities = selectedActivities.slice(
        i * perDay,
        (i + 1) * perDay
      );

      plan.days.push({
        day: i + 1,
        date: `Day ${i + 1}`,
        activities: dayActivities.map((act, index) => {
          const time = generateSmartTime(act, index, purpose);
          return {
            time: time,
            name: act.name,
            duration: act.duration,
            cost: act.cost,
            // 保留地址和经纬度
            description: act.description || act.address,
            address: act.address || "",
            location: act.location || null,
          };
        }),
      });
    }
  }

  // 计算总费用
  plan.days.forEach((day) => {
    day.activities.forEach((act) => {
      plan.total_cost += act.cost;
    });
  });

  console.log(
    `行程分配完成，实际天数: ${plan.days.length}，总费用: ${plan.total_cost}`
  );

  return plan;
}

// 智能时间分配函数
function generateSmartTime(activity, index, purpose) {
  const category = activity.category?.toLowerCase() || "";
  const name = activity.name?.toLowerCase() || "";

  // 根据活动类型和目的智能分配时间
  if (purpose === "美食探店") {
    // 美食探店：早餐、午餐、下午茶、晚餐
    const foodTimes = ["8:30", "12:00", "15:30", "18:30"];
    return foodTimes[index] || `${9 + index * 3}:00`;
  } else if (purpose === "亲子遛娃") {
    // 亲子游：避开太早和太晚
    const familyTimes = ["9:30", "11:30", "14:00", "16:00"];
    return familyTimes[index] || `${9 + index * 2}:30`;
  } else if (purpose === "情侣约会") {
    // 情侣约会：浪漫时间安排
    if (category.includes("咖啡") || category.includes("甜品")) {
      return index === 0 ? "10:00" : "15:00"; // 上午咖啡或下午茶
    } else if (category.includes("景点") || category.includes("公园")) {
      return index === 0 ? "9:00" : "14:30"; // 上午或下午游览
    } else if (category.includes("酒吧") || name.includes("夜景")) {
      return "19:00"; // 晚上
    }
    const dateTimes = ["10:00", "13:30", "16:00", "19:00"];
    return dateTimes[index] || `${10 + index * 3}:00`;
  } else if (purpose === "朋友小聚") {
    // 朋友聚会：灵活时间
    if (category.includes("ktv") || category.includes("酒吧")) {
      return "20:00"; // 晚上娱乐
    } else if (category.includes("咖啡") || name.includes("下午茶")) {
      return "15:00"; // 下午茶时间
    }
    const friendTimes = ["10:30", "13:00", "16:30", "19:30"];
    return friendTimes[index] || `${10 + index * 3}:00`;
  }

  // 默认时间分配
  const defaultTimes = ["9:30", "12:30", "15:30", "18:00"];
  return defaultTimes[index] || `${9 + index * 3}:00`;
}

// 生成文本内容
function generateTextContent(plan, city, days, purpose) {
  let content = `【${city} ${days}天${purpose}行程】\n\n`;

  plan.days.forEach((day) => {
    content += `📅 ${day.date}\n`;
    day.activities.forEach((act) => {
      content += `${act.time} ${act.name}\n`;
      content += `  ⏱ ${act.duration}小时 | 💰 ¥${act.cost}\n`;
      content += `  📍 ${act.description}\n\n`;
    });
  });

  content += `💰 预计总费用：¥${plan.total_cost}\n`;
  content += `💡 ${plan.tips}`;

  return content;
}

// 保存到云存储
async function saveToCloud(city, purpose, content) {
  try {
    // 处理 undefined 值
    city = city || "unknown";
    purpose = purpose || "travel";

    const timestamp = Date.now();
    const fileName = `cards/${city}_${purpose}_${timestamp}_${Math.floor(
      Math.random() * 10000
    )}.txt`;

    const result = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: Buffer.from(content, "utf-8"),
    });

    console.log("保存成功:", result.fileID);
    return result.fileID;
  } catch (error) {
    console.error("保存失败:", error);
    return "";
  }
}

// ============================================
// Block 转换层 (Adapter) - 将嵌套结构拍平为 Block 数组
// ============================================

/**
 * 生成唯一的 Block ID
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
 * 将嵌套的 plan 结构转换为扁平化的 Block 数组
 * @param {object} plan - 原始嵌套行程数据
 * @param {object} options - 额外选项 { city, intent, days }
 * @returns {object} { tripInfo, blocks }
 */
function convertPlanToBlocks(plan, options = {}) {
  const { city = "", intent = "", days = 1 } = options;
  const blocks = [];
  let orderCounter = 100;
  const ORDER_INCREMENT = 100;

  if (!plan || !plan.days) {
    return { tripInfo: null, blocks: [] };
  }

  // 遍历每一天
  plan.days.forEach((day) => {
    // 1. 创建 Day Divider Block
    blocks.push({
      id: generateBlockId(),
      type: "day-divider",
      order: orderCounter,
      content: {
        dayIndex: day.day,
        label: `Day ${day.day}`,
        date: day.date || "",
        theme: "",
      },
    });
    orderCounter += ORDER_INCREMENT;

    // 2. 遍历当天的活动
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity) => {
        // 创建 POI Block
        blocks.push({
          id: generateBlockId(),
          type: "poi",
          order: orderCounter,
          content: {
            poiId: "",
            name: activity.name || "",
            address: activity.address || activity.description || "",
            location: activity.location || null,
            startTime: activity.time || "",
            duration: (activity.duration || 2) * 60, // 转换为分钟
            cost: activity.cost || 0,
            currency: "CNY",
            tags: [],
            description: activity.description || "",
          },
        });
        orderCounter += ORDER_INCREMENT;
      });
    }
  });

  // 构建 tripInfo
  const tripInfo = {
    id: generateTripId(),
    title: `${city} ${plan.days.length}天 ${intent}`,
    city: city,
    days: plan.days.length,
    intent: intent,
    meta: {
      totalCost: plan.total_cost || 0,
      tips: plan.tips || "",
      coverImage: "",
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  console.log("📦 Block 转换完成:", {
    tripId: tripInfo.id,
    blockCount: blocks.length,
  });

  return { tripInfo, blocks };
}
