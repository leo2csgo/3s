/**
 * POI Block - 地点块组件
 */
Component({
  properties: {
    block: {
      type: Object,
      value: null,
    },
    editMode: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    formattedDuration: "",
    durationColumns: [
      Array.from({ length: 13 }, (_, i) => `${i}小时`),
      Array.from({ length: 12 }, (_, i) => `${i * 5}分钟`),
    ],
    durationSelected: [0, 0],
  },

  observers: {
    "block.content.duration": function (duration) {
      if (duration === undefined || duration === null) return;
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      // 显示格式
      if (hours > 0 && mins > 0) {
        this.setData({ formattedDuration: `${hours}小时${mins}分钟` });
      } else if (hours > 0) {
        this.setData({ formattedDuration: `${hours}小时` });
      } else {
        this.setData({ formattedDuration: `${mins}分钟` });
      }
      // 选择器同步
      const minIndex = Math.max(0, Math.round(mins / 5));
      const hourIndex = Math.max(0, Math.min(12, hours));
      this.setData({ durationSelected: [hourIndex, minIndex] });
    },
  },

  methods: {
    // 导航按钮点击（仅抛事件，避免重复跳转）
    onNavTap() {
      const { block } = this.properties;
      const content = block.content || {};
      this.triggerEvent("navigate", {
        name: content.name,
        address: content.address,
        location: content.location,
      });
    },

    // 删除按钮点击
    onDeleteTap() {
      wx.showModal({
        title: "确认删除",
        content: `确定要删除「${this.properties.block.content.name}」吗？`,
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent("delete", {
              blockId: this.properties.block.id,
            });
          }
        },
      });
    },

    // 描述输入
    onDescInput(e) {
      this.triggerEvent("edit", {
        field: "description",
        value: e.detail.value,
      });
    },

    // 描述输入完成
    onDescBlur(e) {
      this.triggerEvent("edit", {
        field: "description",
        value: e.detail.value,
        completed: true,
      });
    },

    // 通用输入完成（name/startTime/duration/cost/note 等）
    onInputBlur(e) {
      const field =
        e.currentTarget &&
        e.currentTarget.dataset &&
        e.currentTarget.dataset.field;
      if (!field) return;
      this.triggerEvent("edit", {
        field,
        value: e.detail.value,
        completed: true,
      });
    },

    // 选择时间（唤起 time picker）
    onTimePick(e) {
      const v = (e.detail && e.detail.value) || ""; // HH:MM
      this.triggerEvent("edit", {
        field: "startTime",
        value: v,
        completed: true,
      });
    },

    // 选择时长（多列：小时/分钟）
    onDurationPick(e) {
      const sel = (e.detail && e.detail.value) || [0, 0];
      const hours = Number(sel[0] || 0);
      const mins = Number((sel[1] || 0) * 5);
      const total = hours * 60 + mins;
      this.setData({ durationSelected: sel });
      this.triggerEvent("edit", {
        field: "duration",
        value: total,
        completed: true,
      });
    },
  },
});
