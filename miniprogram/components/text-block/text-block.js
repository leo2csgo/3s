/**
 * Text Block - 文本块组件
 * 支持点击后变为 textarea 进行编辑
 */
Component({
  properties: {
    block: {
      type: Object,
      value: null
    },
    editMode: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isEditing: false,
    styleClass: ''
  },

  observers: {
    'block.content.style': function(style) {
      let styleClass = '';
      switch (style) {
        case 'tip':
          styleClass = 'style-tip';
          break;
        case 'warning':
          styleClass = 'style-warning';
          break;
        default:
          styleClass = 'style-normal';
      }
      this.setData({ styleClass });
    }
  },

  methods: {
    // 点击文本进入编辑模式
    onTap() {
      if (this.properties.editMode) {
        this.setData({ isEditing: true });
      }
    },

    // 输入事件
    onInput(e) {
      this.triggerEvent('change', {
        text: e.detail.value,
        completed: false
      });
    },

    // 失焦退出编辑模式
    onBlur(e) {
      this.setData({ isEditing: false });
      this.triggerEvent('change', {
        text: e.detail.value,
        completed: true
      });
    },

    // 确认输入
    onConfirm(e) {
      this.setData({ isEditing: false });
      this.triggerEvent('change', {
        text: e.detail.value,
        completed: true
      });
    },

    // 删除按钮点击
    onDeleteTap() {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条备注吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('delete', {
              blockId: this.properties.block.id
            });
          }
        }
      });
    }
  }
});

