/**
 * Day Divider Block - 日期分隔符组件
 */
Component({
  properties: {
    block: { type: Object, value: null },
    editMode: { type: Boolean, value: false },
  },

  data: {
    defaultDate: "",
  },

  lifetimes: {
    attached() {
      if (!this.data.defaultDate) {
        const d = new Date();
        const m = `${d.getMonth() + 1}`.padStart(2, "0");
        const day = `${d.getDate()}`.padStart(2, "0");
        this.setData({ defaultDate: `${d.getFullYear()}-${m}-${day}` });
      }
    },
  },

  methods: {
    onDatePick(e) {
      const date = (e.detail && e.detail.value) || this.data.defaultDate;
      const payload = { blockId: this.properties.block.id, content: { date } };
      this.triggerEvent("edit", payload);
      this.triggerEvent("update", payload);
    },
  },
});
