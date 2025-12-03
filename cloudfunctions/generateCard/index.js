// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { city, days, intent_tag } = event;

  console.log("收到请求参数:", { city, days, intent_tag });

  try {
    // 1. 从数据库查询符合条件的活动（使用数组查询）
    const _ = db.command;
    const result = await db
      .collection("activities")
      .where({
        city: city,
        tags: _.elemMatch(_.eq(intent_tag)), // 数组元素匹配
      })
      .get();

    const activities = result.data;
    console.log(`查询到 ${activities.length} 条活动数据`);

    if (activities.length === 0) {
      // 如果没有数据，返回更详细的错误信息
      return {
        success: false,
        message: `暂无"${city}"的"${intent_tag}"相关活动数据，请检查数据库`,
        debug: {
          city,
          intent_tag,
          queryResult: activities.length,
        },
      };
    }

    // 2. 使用规则引擎组合行程
    const plan = generateItinerary(activities, days);
    console.log("生成的行程计划:", plan);

    // 3. 生成卡片图片
    const fileID = await generateCardImage(plan, city, days, intent_tag);
    console.log("生成的文件ID:", fileID);

    return {
      success: true,
      fileID: fileID,
      plan: plan,
    };
  } catch (err) {
    console.error("云函数执行错误:", err);
    return {
      success: false,
      message: err.message,
      error: err.toString(),
    };
  }
};

// 规则引擎：组合行程
function generateItinerary(activities, days) {
  console.log(`开始组合行程，活动数量: ${activities.length}, 天数: ${days}`);

  const plan = {
    days: [],
    total_cost: 0,
    tips: "",
  };

  // 分类活动：主菜(>=4小时) 和 配菜(<4小时)
  const mainActivities = activities.filter((a) => a.duration >= 4);
  const sideActivities = activities.filter((a) => a.duration < 4);

  console.log(
    `主菜活动: ${mainActivities.length}个, 配菜活动: ${sideActivities.length}个`
  );

  // 已使用的活动ID，避免重复
  const usedActivityIds = new Set();

  // 为每一天生成行程
  for (let day = 1; day <= days; day++) {
    const dayPlan = {
      day: day,
      activities: [],
    };

    // 选择一个未使用的主菜活动
    const availableMainActivities = mainActivities.filter(
      (a) => !usedActivityIds.has(a._id)
    );

    if (availableMainActivities.length > 0) {
      // 随机选择主菜
      const mainIndex = Math.floor(
        Math.random() * availableMainActivities.length
      );
      const mainActivity = availableMainActivities[mainIndex];

      dayPlan.activities.push({
        name: mainActivity.name,
        category: mainActivity.category,
        duration: mainActivity.duration,
        cost: mainActivity.cost,
        description: mainActivity.description,
        district: mainActivity.district,
      });

      plan.total_cost += mainActivity.cost;
      usedActivityIds.add(mainActivity._id);

      // 尝试在同一区域找配菜
      const sameDistrictSides = sideActivities.filter(
        (a) =>
          a.district === mainActivity.district && !usedActivityIds.has(a._id)
      );

      // 添加1-2个配菜
      const sideCount = Math.random() > 0.5 ? 2 : 1;
      const sidesToChoose =
        sameDistrictSides.length > 0
          ? sameDistrictSides
          : sideActivities.filter((a) => !usedActivityIds.has(a._id));

      for (let i = 0; i < sideCount && sidesToChoose.length > 0; i++) {
        const sideIndex = Math.floor(Math.random() * sidesToChoose.length);
        const sideActivity = sidesToChoose[sideIndex];

        // 检查时长是否超过8小时
        const totalDuration = dayPlan.activities.reduce(
          (sum, a) => sum + a.duration,
          0
        );

        if (
          totalDuration + sideActivity.duration <= 8 &&
          !usedActivityIds.has(sideActivity._id)
        ) {
          dayPlan.activities.push({
            name: sideActivity.name,
            category: sideActivity.category,
            duration: sideActivity.duration,
            cost: sideActivity.cost,
            description: sideActivity.description,
            district: sideActivity.district,
          });
          plan.total_cost += sideActivity.cost;
          usedActivityIds.add(sideActivity._id);
        }
      }
    } else if (sideActivities.length > 0) {
      // 如果没有主菜了，就用配菜填充
      const availableSides = sideActivities.filter(
        (a) => !usedActivityIds.has(a._id)
      );
      const count = Math.min(3, availableSides.length);

      for (let i = 0; i < count; i++) {
        const sideIndex = Math.floor(Math.random() * availableSides.length);
        const sideActivity = availableSides[sideIndex];

        dayPlan.activities.push({
          name: sideActivity.name,
          category: sideActivity.category,
          duration: sideActivity.duration,
          cost: sideActivity.cost,
          description: sideActivity.description,
          district: sideActivity.district,
        });
        plan.total_cost += sideActivity.cost;
        usedActivityIds.add(sideActivity._id);
      }
    }

    plan.days.push(dayPlan);
  }

  // 生成提示
  const avgCostPerDay = plan.total_cost / days;
  if (avgCostPerDay > 500) {
    plan.tips = "行程比较满，建议提前出门哦！记得带好充电宝~";
  } else if (avgCostPerDay > 200) {
    plan.tips = "轻松愉快的行程，享受美好时光！";
  } else {
    plan.tips = "经济实惠的行程，性价比超高！";
  }

  console.log(`行程组合完成，总费用: ¥${plan.total_cost}`);

  return plan;
}

// 生成卡片图片（简化版，使用文本描述）
async function generateCardImage(plan, city, days, intent_tag) {
  // 注意：这里是简化实现
  // 实际应该使用 Canvas 或图片处理库来生成精美的卡片图
  // 由于微信云函数环境限制，这里先返回一个文本文件作为占位

  // 生成精美的文本卡片
  const divider = "━".repeat(30);
  const content = `
╔═══════════════════════════════════╗
║        🎉 3秒出卡 🎉              ║
║     智能生成你的专属行程           ║
╚═══════════════════════════════════╝

📍 城市：${city}
📅 天数：${days}天
🎯 目的：${intent_tag}

${divider}

${plan.days
  .map((d) => {
    const dayActivities = d.activities
      .map((a, index) => {
        const time = index === 0 ? "09:00" : index === 1 ? "13:00" : "16:00";
        return `  ${time} | ${a.name}
         ⏱ ${a.duration}小时 | 💰 ¥${a.cost}
         📝 ${a.description}`;
      })
      .join("\n\n");

    return `📆 第${d.day}天行程
${divider}
${dayActivities}`;
  })
  .join("\n\n")}

${divider}

💵 预估总费用：¥${plan.total_cost}
💡 温馨提示：${plan.tips}

${divider}

扫描小程序码，生成你的专属行程 👇
  `.trim();

  // 上传到云存储
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const fileName = `cards/${city}_${intent_tag}_${timestamp}_${random}.txt`;

  console.log("准备上传文件:", fileName);

  const uploadResult = await cloud.uploadFile({
    cloudPath: fileName,
    fileContent: Buffer.from(content, "utf-8"),
  });

  console.log("文件上传成功:", uploadResult.fileID);

  return uploadResult.fileID;
}
