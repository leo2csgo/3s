const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, payload = {} } = event || {};
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      // 获取行程列表（不返回 blocks，节省流量）
      case "list": {
        const res = await db
          .collection("trips")
          .where({ _openid: openid })
          .field({ blocks: false })
          .orderBy("updatedAt", "desc")
          .get();
        return res;
      }

      // 获取路书详情（包含 blocks）
      case "detail": {
        const { id } = payload;
        if (!id) return { code: 400, msg: "missing id" };
        const res = await db.collection("trips").doc(id).get();
        return res;
      }

      // 创建新路书
      case "create": {
        const { tripInfo = {}, blocks = [] } = payload;
        const now = Date.now();
        const data = {
          title: tripInfo.title || "我的路书",
          city: tripInfo.city || "",
          days: tripInfo.days || 1,
          intent: tripInfo.intent || "",
          // 封面字段：兼容旧字段 coverImage，同时支持新的 coverUrl / coverFileID
          coverUrl: tripInfo.coverUrl || tripInfo.coverImage || "",
          coverFileID: tripInfo.coverFileID || "",
          coverImage: tripInfo.coverImage || tripInfo.coverUrl || "",
          status: tripInfo.status || "planning",
          meta: tripInfo.meta || { totalCost: 0 },
          blocks: Array.isArray(blocks) ? blocks : [],
          createdAt: tripInfo.createdAt || now,
          updatedAt: tripInfo.updatedAt || now,
        };
        const res = await db.collection("trips").add({ data });
        return res; // { _id }
      }

      // 更新路书
      case "update": {
        const { tripId, updateData = {} } = payload;
        if (!tripId) return { code: 400, msg: "missing tripId" };
        const data = {
          ...updateData,
          updatedAt: Date.now(),
        };
        const res = await db.collection("trips").doc(tripId).update({ data });
        return res; // { stats }
      }

      // 删除路书
      case "delete": {
        const { id } = payload;
        if (!id) return { code: 400, msg: "missing id" };
        const res = await db.collection("trips").doc(id).remove();
        return res; // { stats }
      }

      // 统计信息（用于 Profile）
      case "stats": {
        const res = await db
          .collection("trips")
          .where({ _openid: openid })
          .field({ city: true, blocks: true })
          .get();
        const list = res.data || [];
        const tripCount = list.length;
        const poiCount = list.reduce(
          (sum, t) =>
            sum + (t.blocks || []).filter((b) => b.type === "poi").length,
          0
        );
        const cityCount = new Set(list.map((t) => t.city).filter(Boolean)).size;
        return { tripCount, poiCount, cityCount };
      }

      default:
        return { code: -1, msg: "Unknown action" };
    }
  } catch (err) {
    console.error("[trip-service] error:", err);
    return {
      code: 500,
      msg: "internal error",
      error: String((err && err.message) || err),
    };
  }
};
