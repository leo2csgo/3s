// 云函数：生成小程序码
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const { scene } = event;

  try {
    console.log("开始生成小程序码，scene:", scene);

    // 调用微信开放接口生成小程序码
    // 注意：getUnlimited 不需要 page 参数，会跳转到主页
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: scene || "default",
      // page 参数对于 getUnlimited 是可选的，不传则跳转到主页
      width: 280,
      autoColor: false,
      lineColor: { r: 102, g: 126, b: 234 }, // 主题色
      isHyaline: true, // 透明底色
    });

    console.log("小程序码生成成功");

    // 上传到云存储
    const timestamp = Date.now();
    const fileName = `qrcodes/qr_${timestamp}.png`;

    const uploadResult = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: result.buffer,
    });

    console.log("小程序码上传成功:", uploadResult.fileID);

    return {
      success: true,
      fileID: uploadResult.fileID,
    };
  } catch (err) {
    console.error("生成小程序码失败:", err);
    return {
      success: false,
      error: err.message,
    };
  }
};
