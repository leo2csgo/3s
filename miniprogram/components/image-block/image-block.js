Component({
  properties: {
    block: Object,
    editMode: Boolean,
  },
  data: {
    images: [],
    caption: "",
    layoutClass: "layout-0",
  },
  observers: {
    block: function (b) {
      if (!b) return;
      const content = b.content || {};
      const images =
        Array.isArray(content.images) && content.images.length
          ? content.images.map((it) => ({
              url: it.url || "",
              fileID: it.fileID || "",
            }))
          : content.url
          ? [{ url: content.url, fileID: content.fileID || "" }]
          : [];
      this.setData({
        images,
        caption: content.caption || "",
        layoutClass: this._computeLayoutClass(images.length),
      });
    },
  },
  methods: {
    _computeLayoutClass(count) {
      if (count <= 0) return "layout-0";
      if (count === 1) return "layout-1";
      if (count === 2) return "layout-2";
      if (count === 3) return "layout-3";
      if (count === 4) return "layout-4";
      if (count <= 6) return "layout-6";
      return "layout-9";
    },
    _updateImages(images, caption) {
      const safeImages = images || [];
      this.setData({
        images: safeImages,
        caption: caption !== undefined ? caption : this.data.caption,
        layoutClass: this._computeLayoutClass(safeImages.length),
      });
      this._emit(
        safeImages,
        caption !== undefined ? caption : this.data.caption
      );
    },
    _emit(images, caption) {
      const first = images[0] || {};
      this.triggerEvent("update", {
        blockId: this.data.block.id,
        content: {
          images,
          caption,
          url: first.url || "",
          fileID: first.fileID || "",
        },
      });
    },
    onPreview(e) {
      const idx = Number(e.currentTarget.dataset.index || 0);
      const urls = (this.data.images || []).map((it) => it.url).filter(Boolean);
      if (!urls.length) return;
      wx.previewImage({ current: urls[idx] || urls[0], urls });
    },
    // 添加图片：可多选，最多 9 张（按剩余数量限制）
    onAdd() {
      const current = (this.data.images || []).length;
      const remain = 9 - current;
      if (remain <= 0) return;
      wx.chooseMedia({
        count: remain,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const files = res.tempFiles || [];
          if (!files.length) return;
          wx.showLoading({ title: "上传中...", mask: true });
          this._uploadFilesSequentially(files)
            .then((newItems) => {
              const images = (this.data.images || []).concat(newItems);
              this._updateImages(images);
              wx.hideLoading();
              wx.showToast({ title: "已添加", icon: "success" });
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: "上传失败", icon: "none" });
            });
        },
      });
    },
    onReplace(e) {
      const idx = Number(e.currentTarget.dataset.index);
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const f = res.tempFiles && res.tempFiles[0];
          if (!f) return;
          wx.showLoading({ title: "上传中...", mask: true });
          this._uploadOne(f.tempFilePath)
            .then((item) => {
              const images = (this.data.images || []).slice();
              images[idx] = item;
              this._updateImages(images);
              wx.hideLoading();
              wx.showToast({ title: "已更新", icon: "success" });
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: "失败", icon: "none" });
            });
        },
      });
    },
    onRemove(e) {
      const idx = Number(e.currentTarget.dataset.index);
      const images = (this.data.images || []).slice();
      images.splice(idx, 1);
      this._updateImages(images);
    },
    onCaptionBlur(e) {
      const caption = e.detail.value || "";
      this._updateImages(this.data.images || [], caption);
    },
    async _uploadFilesSequentially(files) {
      const out = [];
      for (const f of files) {
        const item = await this._uploadOne(f.tempFilePath);
        out.push(item);
      }
      return out;
    },
    _uploadOne(tempPath) {
      return new Promise((resolve, reject) => {
        const cloudPath = `images/${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}.jpg`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (up) => {
            wx.cloud.getTempFileURL({
              fileList: [up.fileID],
              success: (r) => {
                const url =
                  (r.fileList && r.fileList[0] && r.fileList[0].tempFileURL) ||
                  up.fileID;
                resolve({ url, fileID: up.fileID });
              },
              fail: () => resolve({ url: up.fileID, fileID: up.fileID }),
            });
          },
          fail: reject,
        });
      });
    },
  },
});
