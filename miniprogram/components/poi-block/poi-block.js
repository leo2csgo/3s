/**
 * POI Block - 地点块组件
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
    formattedDuration: ''
  },

  observers: {
    'block.content.duration': function(duration) {
      if (duration) {
        // 将分钟转换为小时显示
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        if (hours > 0 && mins > 0) {
          this.setData({ formattedDuration: `${hours}小时${mins}分钟` });
        } else if (hours > 0) {
          this.setData({ formattedDuration: `${hours}小时` });
        } else {
          this.setData({ formattedDuration: `${mins}分钟` });
        }
      }
    }
  },

  methods: {
    // 导航按钮点击
    onNavTap() {
      const { block } = this.properties;
      const content = block.content || {};
      
      console.log('导航到:', content.name);
      
      // 触发导航事件
      this.triggerEvent('navigate', {
        name: content.name,
        address: content.address,
        location: content.location
      });

      // 直接调用微信地图 (也可以由父组件处理)
      if (content.location && content.location.lat && content.location.lng) {
        wx.openLocation({
          latitude: content.location.lat,
          longitude: content.location.lng,
          name: content.name,
          address: content.address || content.name,
          scale: 18
        });
      } else {
        // 没有精确坐标时，使用默认坐标并显示地点名
        wx.openLocation({
          latitude: 31.2304,
          longitude: 121.4737,
          name: content.name,
          address: content.address || content.name,
          scale: 18
        }).catch(() => {
          wx.showToast({
            title: '导航失败，请稍后重试',
            icon: 'none'
          });
        });
      }
    },

    // 删除按钮点击
    onDeleteTap() {
      wx.showModal({
        title: '确认删除',
        content: `确定要删除「${this.properties.block.content.name}」吗？`,
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('delete', {
              blockId: this.properties.block.id
            });
          }
        }
      });
    },

    // 描述输入
    onDescInput(e) {
      this.triggerEvent('edit', {
        field: 'description',
        value: e.detail.value
      });
    },

    // 描述输入完成
    onDescBlur(e) {
      this.triggerEvent('edit', {
        field: 'description',
        value: e.detail.value,
        completed: true
      });
    }
  }
});

