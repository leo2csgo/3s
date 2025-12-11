const DAY_COLORS = [
  "#a18cd1",
  "#fcbad3",
  "#ffd3b6",
  "#a1c4fd",
  "#84fab0",
  "#f6d365",
  "#c79081",
  "#43e97b",
];

Page({
  data: {
    markers: [],
    polyline: [],
    includePoints: [],
    days: [],
    selectedDay: "all",
    activeMarker: null,
  },

  onLoad(options) {
    let blocks = [];
    if (options && options.blocks) {
      try {
        blocks = JSON.parse(decodeURIComponent(options.blocks));
      } catch (e) {
        console.error("parse blocks failed", e);
      }
    }
    this.blocks = blocks;
    this.computeDaysAndRender();
  },

  onDayChipTap(e) {
    const day = e.currentTarget.dataset.day;
    this.applyDay(day === "all" ? "all" : Number(day));
  },

  onMarkerTap(e) {
    const id = e.detail.markerId;
    const m = (this.data.markers || []).find((x) => x.id === id);
    if (m) this.setData({ activeMarker: { ...m, name: m.name || m.title } });
  },

  clearActive() {
    this.setData({ activeMarker: null });
  },

  openLocation() {
    const m = this.data.activeMarker;
    if (!m) return;
    wx.openLocation({
      latitude: m.latitude,
      longitude: m.longitude,
      name: m.name || "",
      address: m.address || "",
      scale: 16,
    });
  },

  computeDaysAndRender() {
    const blocks = this.blocks || [];
    const dayPoints = {};
    const dayMarkers = {};
    let currentDay = 1;
    (blocks || []).forEach((b) => {
      if (b.type === "day-divider") {
        currentDay = Number(b.content?.dayIndex) || currentDay + 1;
        return;
      }
      if (b.type === "poi" && b.content && b.content.location) {
        const { lat, lng } = b.content.location || {};
        if (typeof lat === "number" && typeof lng === "number") {
          if (!dayPoints[currentDay]) dayPoints[currentDay] = [];
          if (!dayMarkers[currentDay]) dayMarkers[currentDay] = [];
          dayPoints[currentDay].push({ latitude: lat, longitude: lng });
          dayMarkers[currentDay].push({
            id: 0,
            latitude: lat,
            longitude: lng,
            name: b.content.name || "",
            address: b.content.address || "",
          });
        }
      }
    });
    this.dayPoints = dayPoints;
    this.dayMarkers = dayMarkers;
    const days = Object.keys(dayPoints)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((idx) => ({
        index: idx,
        count: (dayPoints[idx] || []).length,
        color: DAY_COLORS[(idx - 1) % DAY_COLORS.length],
      }));
    this.setData({ days });
    this.applyDay("all");
  },

  applyDay(day) {
    const days = this.data.days || [];
    const dayIdxs = day === "all" ? days.map((d) => d.index) : [Number(day)];
    let markers = [];
    let id = 0;
    dayIdxs.forEach((di) => {
      (this.dayMarkers[di] || []).forEach((m) => {
        markers.push({ ...m, id: id++ });
      });
    });
    const polylines = dayIdxs
      .map((di) => ({
        points: this.dayPoints[di] || [],
        color: DAY_COLORS[(di - 1) % DAY_COLORS.length],
        width: 4,
        arrowLine: true,
      }))
      .filter((pl) => pl.points.length > 1);
    const includePoints = dayIdxs.flatMap((di) => this.dayPoints[di] || []);
    this.setData({
      selectedDay: day,
      markers,
      polyline: polylines,
      includePoints,
      activeMarker: null,
    });
  },
});
