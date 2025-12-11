Component({
  properties: {
    block: Object,
    editMode: Boolean,
  },
  data: {
    images: [],
    caption: "",
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
      this.setData({ images, caption: content.caption || "" });
    },
  },
  methods: {
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
    onAdd() {
      const remain = 9 - (this.data.images || []).length;
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
              this.setData({ images });
              this._emit(images, this.data.caption);
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
              this.setData({ images });
              this._emit(images, this.data.caption);
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
      this.setData({ images });
      this._emit(images, this.data.caption);
    },
    onCaptionBlur(e) {
      const caption = e.detail.value || "";
      this.setData({ caption });
      this._emit(this.data.images || [], caption);
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
