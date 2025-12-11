// utils/BlockFactory.js
// 标准积木生产线，统一各处创建的 Block 结构

const BLOCK_TYPES = {
  DAY_DIVIDER: 'day-divider',
  POI: 'poi',
  TEXT: 'text',
  TRANSPORT: 'transport',
  IMAGE: 'image',
};

const genId = (prefix = 'blk') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const coerceNumber = (v, def = 0) => (typeof v === 'number' && !isNaN(v) ? v : def);

const BlockFactory = {
  // 分割线（天）
  createDayDivider: ({ dayIndex, label, date, theme, order }) => ({
    id: genId('day'),
    type: BLOCK_TYPES.DAY_DIVIDER,
    order: typeof order === 'number' ? order : 100,
    content: {
      dayIndex: coerceNumber(dayIndex, 1),
      label: label || `Day ${coerceNumber(dayIndex, 1)}`,
      date: date || '',
      theme: theme || '',
    },
  }),

  // 地点（POI）
  createPoi: ({ name, address, location, startTime, time, duration, cost, description, tags, order }) => ({
    id: genId('poi'),
    type: BLOCK_TYPES.POI,
    order: typeof order === 'number' ? order : 100,
    content: {
      name: name || '',
      address: address || '',
      location: location || null, // { lat, lng }
      startTime: startTime || time || '',
      duration: coerceNumber(duration, 60),
      cost: coerceNumber(cost, 0),
      description: description || '',
      tags: Array.isArray(tags) ? tags : [],
    },
  }),

  // 文本备注
  createText: ({ text, style, order }) => ({
    id: genId('text'),
    type: BLOCK_TYPES.TEXT,
    order: typeof order === 'number' ? order : 100,
    content: {
      text: text || '',
      style: style || 'normal', // normal/tip/warning...
    },
  }),

  // 交通
  createTransport: ({ mode, duration, distance, cost, note, order }) => ({
    id: genId('trans'),
    type: BLOCK_TYPES.TRANSPORT,
    order: typeof order === 'number' ? order : 100,
    content: {
      mode: mode || 'walk', // walk/drive/bus/subway/bike
      duration: coerceNumber(duration, 0),
      distance: distance || '',
      cost: coerceNumber(cost, 0),
      note: note || '',
    },
  }),

  // 图片（占位）
  createImage: ({ url, caption, order }) => ({
    id: genId('img'),
    type: BLOCK_TYPES.IMAGE,
    order: typeof order === 'number' ? order : 100,
    content: {
      url: url || '',
      caption: caption || '',
    },
  }),
};

module.exports = { BlockFactory, BLOCK_TYPES };

