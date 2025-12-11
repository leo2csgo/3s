Component({
  properties: { block: Object, editMode: Boolean },
  data: { columns: 1 },
  observers: {
    block: function (b) {
      if (!b) return;
      const c = b.content || {};
      this.setData({ columns: Number(c.columns) || 1 });
    },
  },
  methods: {
    onToggle(e) {
      const idx = e.currentTarget.dataset.index;
      const items = (this.data.block.content.items || []).slice();
      items[idx].checked = !items[idx].checked;
      this._triggerUpdate(items, this.data.columns);
    },
    onInputBlur(e) {
      const idx = e.currentTarget.dataset.index;
      const val = e.detail.value;
      const items = (this.data.block.content.items || []).slice();
      items[idx].text = val;
      this._triggerUpdate(items, this.data.columns);
    },
    onAddItem() {
      const items = (this.data.block.content.items || []).slice();
      items.push({ text: "", checked: false });
      this._triggerUpdate(items, this.data.columns);
    },
    onDeleteItem(e) {
      const idx = e.currentTarget.dataset.index;
      const items = (this.data.block.content.items || []).slice();
      items.splice(idx, 1);
      this._triggerUpdate(items, this.data.columns);
    },
    onTemplate() {
      const templates = ["证件", "电子设备", "洗漱包"];
      wx.showActionSheet({
        itemList: templates,
        success: (res) => {
          const t = templates[res.tapIndex];
          const items = (this.data.block.content.items || []).slice();
          const add = this._templateItems(t);
          this._triggerUpdate(items.concat(add), this.data.columns);
        },
      });
    },
    onToggleColumns() {
      const next = this.data.columns === 1 ? 2 : 1;
      this.setData({ columns: next });
      const items = (this.data.block.content.items || []).slice();
      this._triggerUpdate(items, next);
    },
    _templateItems(name) {
      switch (name) {
        case "证件":
          return [
            { text: "身份证", checked: false },
            { text: "护照", checked: false },
            { text: "驾驶证", checked: false },
          ];
        case "电子设备":
          return [
            { text: "手机/充电器", checked: false },
            { text: "相机/电池", checked: false },
            { text: "移动电源", checked: false },
          ];
        case "洗漱包":
          return [
            { text: "牙刷牙膏", checked: false },
            { text: "洗面奶", checked: false },
            { text: "毛巾", checked: false },
          ];
        default:
          return [];
      }
    },
    _triggerUpdate(items, columns) {
      this.triggerEvent("update", {
        blockId: this.data.block.id,
        content: { items, columns },
      });
    },
  },
});
