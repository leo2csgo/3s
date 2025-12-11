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
    stats: null,
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
    // 计算每日日程距离
    const dayStats = {};
    Object.keys(dayPoints).forEach((k) => {
      const pts = dayPoints[k] || [];
      let dist = 0;
      for (let i = 1; i < pts.length; i++)
        dist += this._distanceKm(pts[i - 1], pts[i]);
      dayStats[k] = { distanceKm: dist };
    });
    this.dayStats = dayStats;

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

    // markers with numeric labels
    let markers = [];
    let id = 0;
    let seq = 1;
    dayIdxs.forEach((di) => {
      (this.dayMarkers[di] || []).forEach((m) => {
        markers.push({
          ...m,
          id: id++,
          label: {
            content: String(seq++),
            color: "#fff",
            bgColor: "#333",
            padding: 3,
            borderRadius: 12,
          },
        });
      });
    });

    // polylines
    const polylines = dayIdxs
      .map((di) => ({
        points: this.dayPoints[di] || [],
        color: DAY_COLORS[(di - 1) % DAY_COLORS.length],
        width: 6,
        arrowLine: true,
        borderColor: "#ffffff",
        borderWidth: 1,
      }))
      .filter((pl) => pl.points.length > 1);

    // include points
    const includePoints = dayIdxs.flatMap((di) => this.dayPoints[di] || []);

    // stats
    const totalKm = dayIdxs.reduce(
      (s, di) => s + (this.dayStats?.[di]?.distanceKm || 0),
      0
    );
    const minutes = Math.round((totalKm / 4.0) * 60); // 粗估步行速度 4km/h
    const stats = {
      distanceKm: Number(totalKm.toFixed(2)),
      durationMin: minutes,
      durationText: this._formatDuration(minutes),
      text: `${Number(totalKm.toFixed(2))} km · 约 ${this._formatDuration(
        minutes
      )}`,
    };

    this.setData({
      selectedDay: day,
      markers,
      polyline: polylines,
      includePoints,
      activeMarker: null,
      stats,
    });
  },

  _distanceKm(a, b) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad((b.latitude || 0) - (a.latitude || 0));
    const dLng = toRad((b.longitude || 0) - (a.longitude || 0));
    const lat1 = toRad(a.latitude || 0);
    const lat2 = toRad(b.latitude || 0);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  },

  _formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}\u5c0f\u65f6${m}\u5206\u949f` : `${m}\u5206\u949f`;
  },
});
