# 数据导入指南

## 问题说明

如果您在导入数据时遇到以下错误：
```
导入数据库失败, Error: Poll error, 导入数据任务异常
错误信息：导入数据格式不正确，请检查是否为JSON Lines格式
```

这是因为微信云数据库要求使用 **JSON Lines** 格式，而不是标准的 JSON 数组格式。

## 格式对比

### ❌ 错误格式（JSON 数组）- sample_activities.json
```json
[
  {
    "name": "上海迪士尼乐园",
    "city": "上海",
    "tags": ["亲子遛娃"]
  },
  {
    "name": "上海科技馆",
    "city": "上海",
    "tags": ["亲子遛娃"]
  }
]
```

### ✅ 正确格式（JSON Lines）- sample_activities_jsonl.json
```json
{"name":"上海迪士尼乐园","city":"上海","tags":["亲子遛娃"]}
{"name":"上海科技馆","city":"上海","tags":["亲子遛娃"]}
```

**关键区别**：
- JSON Lines：每行一个完整的 JSON 对象，没有外层数组
- JSON 数组：所有对象包裹在 `[]` 中，对象之间用逗号分隔

## 解决方案

### 方案一：使用提供的 JSON Lines 文件（推荐）

1. 在云开发控制台，选择 `activities` 集合
2. 点击"导入"
3. 选择 **`sample_activities_jsonl.json`** 文件
4. 确认导入

### 方案二：手动转换格式

如果您有自己的数据文件，可以使用以下方法转换：

#### 使用命令行（Mac/Linux）
```bash
# 将 JSON 数组转换为 JSON Lines
cat sample_activities.json | jq -c '.[]' > sample_activities_jsonl.json
```

#### 使用在线工具
- 访问 https://jsonlines.org/
- 粘贴您的 JSON 数组
- 转换为 JSON Lines 格式

#### 使用 Node.js 脚本
```javascript
const fs = require('fs');

// 读取 JSON 数组文件
const data = JSON.parse(fs.readFileSync('sample_activities.json', 'utf8'));

// 转换为 JSON Lines
const jsonLines = data.map(item => JSON.stringify(item)).join('\n');

// 保存
fs.writeFileSync('sample_activities_jsonl.json', jsonLines);
```

### 方案三：手动添加数据

如果数据量不大，可以手动添加：

1. 在云开发控制台，选择 `activities` 集合
2. 点击"添加记录"
3. 逐条添加数据

## 验证导入成功

导入后，检查：
1. 集合中应该有 24 条记录
2. 每条记录包含以下字段：
   - name（字符串）
   - city（字符串）
   - district（字符串）
   - tags（数组）
   - category（字符串）
   - duration（数字）
   - cost（数字）
   - address（字符串）
   - description（字符串）

## 常见问题

### Q: 为什么微信云数据库要用 JSON Lines 格式？
A: JSON Lines 格式更适合流式处理大量数据，每行独立，便于逐行解析和导入。

### Q: 我可以用 Excel 导入吗？
A: 微信云数据库不直接支持 Excel，需要先转换为 JSON Lines 格式。

### Q: 导入后数据显示不正确？
A: 检查字段类型是否正确，特别是：
- tags 必须是数组类型
- duration 和 cost 必须是数字类型

### Q: 如何批量导入大量数据？
A: 
1. 准备好 JSON Lines 格式文件
2. 使用云开发控制台的导入功能
3. 如果数据量特别大（>1000条），建议分批导入

## 项目文件说明

- **sample_activities.json** - 标准 JSON 数组格式（仅供参考，不能直接导入）
- **sample_activities_jsonl.json** - JSON Lines 格式（用于导入数据库）

## 下一步

导入成功后，继续按照 `QUICK_START.md` 的步骤：
1. 上传云函数
2. 测试小程序功能

