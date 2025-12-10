// 云函数：获取腾讯 LBS POI 数据（SK 签名校验版本）
const cloud = require("wx-server-sdk");
const axios = require("axios");
const crypto = require("crypto");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 腾讯地图配置
const TENCENT_MAP_KEY = "OBHBZ-GGJ6Z-EVWXD-TZYKA-GIIEQ-SHFGE";
const TENCENT_MAP_SK = "Nf5KUXDIkQoxs54FNNzPaZdIDpYICmQ7";

// 腾讯地图官方签名算法
function generateSignature(params, sk) {
  // 1. 对参数按 key 进行字典序排序
  const sortedKeys = Object.keys(params).sort();

  // 2. 拼接参数字符串（标准格式）
  let queryString = "";
  sortedKeys.forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      queryString += `${key}=${params[key]}&`;
    }
  });

  // 3. 去掉最后的 &
  queryString = queryString.slice(0, -1);

  // 4. 拼接完整的签名字符串：请求路径 + ? + 参数 + SK
  const signStr = `/ws/place/v1/search?${queryString}${sk}`;

  console.log("签名原始字符串:", signStr);

  // 5. 计算 MD5
  const signature = crypto.createHash("md5").update(signStr).digest("hex");
  console.log("生成的签名:", signature);

  return signature;
}

// 调用腾讯地图 API（带签名）
async function callTencentAPI(params) {
  try {
    // 生成签名
    const sig = generateSignature(params, TENCENT_MAP_SK);

    // 添加签名到参数
    const finalParams = {
      ...params,
      sig: sig,
    };

    console.log("最终请求参数:", JSON.stringify(finalParams));

    const response = await axios.get(
      "https://apis.map.qq.com/ws/place/v1/search",
      {
        params: finalParams,
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("API 调用失败:", error.message);
    if (error.response) {
      console.error("响应数据:", error.response.data);
      console.error("响应状态:", error.response.status);
    }
    throw error;
  }
}

// 智能分类标签字典
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
  ],
};

// 搜索关键词组合
const SEARCH_KEYWORDS = {
  亲子遛娃: ["景点", "乐园", "博物馆", "科技馆", "动物园"],
  情侣约会: ["景点", "夜景", "咖啡厅", "公园", "观景台"],
  朋友小聚: ["网红", "打卡", "美食", "酒吧", "商圈"],
  美食探店: ["美食", "餐厅", "小吃", "特色菜", "网红店"],
};

exports.main = async (event, context) => {
  const { city } = event;

  console.log("========== getPoiList 开始（SK签名版本） ==========");
  console.log("输入城市:", city);
  console.log("腾讯地图 Key:", TENCENT_MAP_KEY ? "已配置" : "未配置");
  console.log("腾讯地图 SK:", TENCENT_MAP_SK ? "已配置" : "未配置");

  // 参数验证
  if (!city) {
    console.error("城市参数为空");
    return {
      success: false,
      error: "城市参数不能为空",
      data: [],
    };
  }

  try {
    // 调用腾讯 LBS API
    const poiList = await fetchTencentPOI(city);

    console.log("POI 数据获取成功，数量:", poiList.length);
    console.log("前3个POI:", JSON.stringify(poiList.slice(0, 3)));

    return {
      success: true,
      data: poiList,
      message: "数据获取成功",
    };
  } catch (error) {
    console.error("POI 数据获取失败 - 错误类型:", error.name);
    console.error("POI 数据获取失败 - 错误信息:", error.message);
    console.error("POI 数据获取失败 - 完整错误:", error);

    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// 调用腾讯地图 API 获取 POI
async function fetchTencentPOI(city) {
  const allPOIs = [];

  // 多关键词搜索，覆盖不同类型
  const keywords = [
    `${city}景点`,
    `${city}乐园`,
    `${city}博物馆`,
    `${city}夜景`,
    `${city}亲子`,
  ];

  console.log("开始搜索关键词:", keywords);

  for (const keyword of keywords) {
    try {
      console.log(`正在搜索: ${keyword}`);

      // 构建请求参数
      const params = {
        keyword: keyword,
        boundary: `region(${city},0)`,
        page_size: 10,
        page_index: 1,
        key: TENCENT_MAP_KEY,
      };

      // 调用 API（自动生成签名）
      const responseData = await callTencentAPI(params);

      console.log(`${keyword} - 响应状态:`, responseData.status);
      console.log(`${keyword} - 响应消息:`, responseData.message);

      if (responseData && responseData.status === 0) {
        const pois = responseData.data || [];
        console.log(`${keyword} - 获取到 ${pois.length} 个POI`);

        pois.forEach((poi) => {
          allPOIs.push({
            name: poi.title,
            address: poi.address,
            category: poi.category,
            location: poi.location,
          });
        });
      } else {
        console.warn(`${keyword} - API返回非0状态:`, responseData);
      }
    } catch (error) {
      console.error(`关键词 ${keyword} 搜索失败:`, error.message);
      // 继续下一个关键词
    }
  }

  console.log("搜索完成，总共获取到:", allPOIs.length, "个POI");

  // 去重（按名称）
  const uniquePOIs = [];
  const nameSet = new Set();

  allPOIs.forEach((poi) => {
    if (!nameSet.has(poi.name)) {
      nameSet.add(poi.name);
      uniquePOIs.push(poi);
    }
  });

  console.log("去重后:", uniquePOIs.length, "个POI");

  // 返回前 15 个
  const result = uniquePOIs.slice(0, 15);
  console.log("最终返回:", result.length, "个POI");

  return result;
}

// 智能分类：根据 POI 名称和分类判断标签
function classifyPOI(poi, purpose) {
  const keywords = TAG_KEYWORDS[purpose] || [];
  const text = `${poi.name} ${poi.category}`.toLowerCase();

  // 计算匹配度
  let score = 0;
  keywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      score += 1;
    }
  });

  return score;
}

// 导出分类函数供其他云函数使用
module.exports.classifyPOI = classifyPOI;
module.exports.TAG_KEYWORDS = TAG_KEYWORDS;
