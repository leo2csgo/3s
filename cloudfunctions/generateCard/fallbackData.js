// 本地兜底模板数据（简化版）
// 当腾讯 LBS API 失败时使用

const FALLBACK_DATA = {
  "上海": {
    "亲子遛娃": [
      { name: "上海迪士尼乐园", address: "浦东新区川沙新镇黄赵路310号", category: "主题乐园", duration: 8, cost: 500 },
      { name: "上海海昌海洋公园", address: "浦东新区银飞路166号", category: "海洋馆", duration: 6, cost: 300 },
      { name: "上海自然博物馆", address: "静安区北京西路510号", category: "博物馆", duration: 4, cost: 30 },
      { name: "上海科技馆", address: "浦东新区世纪大道2000号", category: "科技馆", duration: 5, cost: 60 },
      { name: "上海野生动物园", address: "浦东新区南六公路178号", category: "动物园", duration: 6, cost: 130 },
      { name: "世纪公园", address: "浦东新区锦绣路1001号", category: "公园", duration: 3, cost: 10 },
      { name: "上海欢乐谷", address: "松江区林湖路888号", category: "主题乐园", duration: 7, cost: 280 },
      { name: "上海海洋水族馆", address: "浦东新区陆家嘴环路1388号", category: "水族馆", duration: 3, cost: 160 }
    ],
    "情侣约会": [
      { name: "外滩", address: "黄浦区中山东一路", category: "地标景点", duration: 2, cost: 0 },
      { name: "东方明珠", address: "浦东新区陆家嘴世纪大道1号", category: "观景台", duration: 3, cost: 180 },
      { name: "田子坊", address: "黄浦区泰康路210弄", category: "文艺街区", duration: 2, cost: 100 },
      { name: "新天地", address: "黄浦区太仓路181弄", category: "时尚街区", duration: 3, cost: 200 },
      { name: "思南公馆", address: "黄浦区思南路", category: "历史建筑", duration: 2, cost: 50 },
      { name: "武康路", address: "徐汇区武康路", category: "历史街区", duration: 2, cost: 50 },
      { name: "上海中心大厦", address: "浦东新区陆家嘴银城中路501号", category: "观景台", duration: 2, cost: 180 },
      { name: "豫园", address: "黄浦区安仁街137号", category: "古典园林", duration: 3, cost: 40 }
    ],
    "朋友小聚": [
      { name: "南京路步行街", address: "黄浦区南京东路", category: "商业街", duration: 3, cost: 150 },
      { name: "田子坊", address: "黄浦区泰康路210弄", category: "文艺街区", duration: 2, cost: 100 },
      { name: "M50创意园", address: "普陀区莫干山路50号", category: "艺术园区", duration: 2, cost: 30 },
      { name: "新天地", address: "黄浦区太仓路181弄", category: "时尚街区", duration: 3, cost: 200 },
      { name: "上海博物馆", address: "黄浦区人民大道201号", category: "博物馆", duration: 3, cost: 0 },
      { name: "上海当代艺术博物馆", address: "黄浦区花园港路200号", category: "博物馆", duration: 3, cost: 0 },
      { name: "朱家角古镇", address: "青浦区朱家角镇", category: "古镇", duration: 4, cost: 80 },
      { name: "上海杜莎夫人蜡像馆", address: "黄浦区南京西路2-68号新世界城10楼", category: "展馆", duration: 2, cost: 150 }
    ],
    "美食探店": [
      { name: "鼎泰丰(新天地店)", address: "黄浦区马当路245号", category: "餐厅", duration: 2, cost: 150 },
      { name: "豫园", address: "黄浦区安仁街137号", category: "美食街", duration: 3, cost: 100 },
      { name: "新天地", address: "黄浦区太仓路181弄", category: "美食街区", duration: 3, cost: 200 },
      { name: "田子坊", address: "黄浦区泰康路210弄", category: "美食街区", duration: 2, cost: 100 },
      { name: "南京路步行街", address: "黄浦区南京东路", category: "商业街", duration: 3, cost: 150 },
      { name: "城隍庙", address: "黄浦区方浜中路249号", category: "美食街", duration: 2, cost: 80 },
      { name: "外滩源", address: "黄浦区中山东一路", category: "美食街区", duration: 2, cost: 200 },
      { name: "思南公馆", address: "黄浦区思南路", category: "美食街区", duration: 2, cost: 150 }
    ]
  },
  "北京": {
    "亲子遛娃": [
      { name: "北京环球影城", address: "通州区京哈高速与东六环路交汇处", category: "主题乐园", duration: 8, cost: 600 },
      { name: "北京动物园", address: "西城区西直门外大街137号", category: "动物园", duration: 5, cost: 20 },
      { name: "中国科技馆", address: "朝阳区北辰东路5号", category: "科技馆", duration: 4, cost: 30 },
      { name: "北京海洋馆", address: "海淀区高梁桥斜街乙18号", category: "海洋馆", duration: 3, cost: 160 },
      { name: "故宫博物院", address: "东城区景山前街4号", category: "博物馆", duration: 5, cost: 60 },
      { name: "颐和园", address: "海淀区新建宫门路19号", category: "公园", duration: 4, cost: 30 },
      { name: "天坛公园", address: "东城区天坛东里甲1号", category: "公园", duration: 3, cost: 15 },
      { name: "北京欢乐谷", address: "朝阳区东四环小武基北路", category: "主题乐园", duration: 7, cost: 280 }
    ],
    "情侣约会": [
      { name: "故宫博物院", address: "东城区景山前街4号", category: "历史建筑", duration: 5, cost: 60 },
      { name: "颐和园", address: "海淀区新建宫门路19号", category: "园林", duration: 4, cost: 30 },
      { name: "什刹海", address: "西城区羊房胡同", category: "景区", duration: 3, cost: 0 },
      { name: "南锣鼓巷", address: "东城区南锣鼓巷", category: "历史街区", duration: 2, cost: 50 },
      { name: "798艺术区", address: "朝阳区酒仙桥路4号", category: "艺术园区", duration: 3, cost: 0 },
      { name: "三里屯", address: "朝阳区三里屯路", category: "商业街区", duration: 3, cost: 200 },
      { name: "鸟巢水立方", address: "朝阳区国家体育场南路1号", category: "地标建筑", duration: 2, cost: 50 },
      { name: "景山公园", address: "西城区景山西街44号", category: "公园", duration: 2, cost: 2 }
    ],
    "朋友小聚": [
      { name: "798艺术区", address: "朝阳区酒仙桥路4号", category: "艺术园区", duration: 3, cost: 50 },
      { name: "三里屯", address: "朝阳区三里屯路", category: "商业街区", duration: 3, cost: 200 },
      { name: "南锣鼓巷", address: "东城区南锣鼓巷", category: "历史街区", duration: 2, cost: 80 },
      { name: "什刹海", address: "西城区羊房胡同", category: "景区", duration: 3, cost: 100 },
      { name: "王府井", address: "东城区王府井大街", category: "商业街", duration: 3, cost: 150 },
      { name: "国家博物馆", address: "东城区东长安街16号", category: "博物馆", duration: 3, cost: 0 },
      { name: "后海酒吧街", address: "西城区什刹海", category: "酒吧街", duration: 3, cost: 200 },
      { name: "五道营胡同", address: "东城区安定门内大街", category: "文艺街区", duration: 2, cost: 80 }
    ],
    "美食探店": [
      { name: "全聚德(前门店)", address: "东城区前门大街30号", category: "餐厅", duration: 2, cost: 200 },
      { name: "簋街", address: "东城区东直门内大街", category: "美食街", duration: 3, cost: 150 },
      { name: "王府井小吃街", address: "东城区王府井大街", category: "美食街", duration: 2, cost: 100 },
      { name: "护国寺小吃", address: "西城区护国寺大街", category: "小吃店", duration: 2, cost: 50 },
      { name: "南锣鼓巷", address: "东城区南锣鼓巷", category: "美食街区", duration: 2, cost: 100 },
      { name: "三里屯", address: "朝阳区三里屯路", category: "美食街区", duration: 3, cost: 200 },
      { name: "什刹海", address: "西城区羊房胡同", category: "美食街区", duration: 3, cost: 150 },
      { name: "牛街", address: "西城区牛街", category: "美食街", duration: 2, cost: 80 }
    ]
  }
};

module.exports = FALLBACK_DATA;

