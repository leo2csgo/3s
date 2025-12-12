/**
 * Block Renderer - 分发器组件
 * 根据 block.type 决定渲染什么子视图
 */
Component({
  properties: {
    // Block 数据对象
    block: {
      type: Object,
      value: null,
    },
    // 是否处于编辑模式
    editMode: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    transModes: ["walk", "drive", "bus", "subway", "bike", "taxi"],
    transNames: ["步行", "驾车", "公交", "地铁", "骑行", "打车"],
    transIcons: ["🚶", "🚗", "🚌", "🚇", "🚴", "🚕"],
    transSelected: 0,
    transMeta: { icon: "🚶", name: "步行" },
    durationColumns: [
      Array.from({ length: 13 }, (_, i) => `${i}小时`),
      Array.from({ length: 12 }, (_, i) => `${i * 5}分钟`),
    ],
    durationSelected: [0, 0],
    transDurationText: "",
  },

  observers: {
    "block.content.mode": function (mode) {
      const modes = this.data.transModes || [];
      const names = this.data.transNames || [];
      const icons = this.data.transIcons || [];
      const idx = Math.max(0, modes.indexOf(mode || "walk"));
      this.setData({
        transSelected: idx,
        transMeta: {
          icon: icons[idx] || "🚗",
          name: names[idx] || mode || "交通",
        },
      });
    },
    "block.content.duration": function (mins) {
      const total = Number(mins) || 0;
      const h = Math.floor(total / 60);
      const m = total % 60;
      const mIdx = Math.max(0, Math.round(m / 5));
      const text = h ? `${h}小时${m}分钟` : `${m}分钟`;
      this.setData({
        durationSelected: [Math.min(12, h), Math.min(11, mIdx)],
        transDurationText: text,
      });
    },
  },

  methods: {
    // 导航事件转发
    onNavigate(e) {
      this.triggerEvent("navigate", {
        blockId: this.properties.block.id,
        ...e.detail,
      });
    },

    // 删除事件转发
    onDelete(e) {
      this.triggerEvent("delete", {
        blockId: this.properties.block.id,
        ...e.detail,
      });
    },

    // 编辑事件转发
    onEdit(e) {
      const payload = { blockId: this.properties.block.id, ...e.detail };
      this.triggerEvent("edit", payload);
      // 同步透传为通用 update 事件，便于 Page 做统一增量合并
      this.triggerEvent("update", payload);
    },

    // 文本变更事件转发
    onTextChange(e) {
      const payload = { blockId: this.properties.block.id, ...e.detail };
      this.triggerEvent("textchange", payload);
      // 同步透传为通用 update 事件
      this.triggerEvent("update", payload);
    },

    // 通用更新事件（如果子组件直接触发 update）
    onUpdate(e) {
      const payload = { blockId: this.properties.block.id, ...e.detail };
      this.triggerEvent("update", payload);
    },

    // 选择交通时长（小时/分钟）
    onTransDurationPick(e) {
      const val = (e.detail && e.detail.value) || [0, 0];
      const h = Number(val[0] || 0);
      const mStep = Number(val[1] || 0);
      const minutes = h * 60 + mStep * 5;
      const text = h ? `${h}小时${mStep * 5}分钟` : `${mStep * 5}分钟`;
      this.setData({ durationSelected: val, transDurationText: text });
      const payload = {
        blockId: this.properties.block.id,
        content: { duration: minutes },
      };
      this.triggerEvent("edit", payload);
      this.triggerEvent("update", payload);
    },

    // 选择交通方式（中文映射 + 图标联动）
    onTransModeChange(e) {
      const idx = (e.detail && e.detail.value) || 0;
      const modes = this.data.transModes || [];
      const names = this.data.transNames || [];
      const icons = this.data.transIcons || [];
      const mode = modes[idx] || "walk";
      const payload = { blockId: this.properties.block.id, content: { mode } };
      this.setData({
        transSelected: idx,
        transMeta: { icon: icons[idx] || "🚗", name: names[idx] || "交通" },
      });
      this.triggerEvent("edit", payload);
      this.triggerEvent("update", payload);
    },

    // [新增] 处理 Transport 内部输入框的变更
    onTransportInput(e) {
      const field =
        e.currentTarget &&
        e.currentTarget.dataset &&
        e.currentTarget.dataset.field;
      const value = (e.detail && e.detail.value) || "";
      const payload = {
        blockId: this.properties.block.id,
        content: { [field]: value },
      };
      this.triggerEvent("edit", payload);
      this.triggerEvent("update", payload);
    },

    // [新增] 删除 Transport Block
    onDeleteTransport() {
      this.triggerEvent("delete", { blockId: this.properties.block.id });
    },
  },
});
