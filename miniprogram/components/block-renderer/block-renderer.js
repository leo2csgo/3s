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
      this.triggerEvent("update", {
        blockId: this.properties.block.id,
        ...e.detail,
      });
    },
  },
});
