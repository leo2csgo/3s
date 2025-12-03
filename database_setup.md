# 云数据库设置指南

## 1. 创建集合

在微信开发者工具的云开发控制台中，创建一个名为 `activities` 的集合。

## 2. 集合权限设置

建议设置为：

- 所有用户可读
- 仅创建者可写

## 3. 导入示例数据

**重要：必须使用 JSON Lines 格式！**

使用云开发控制台的"导入"功能，导入 **`sample_activities_jsonl.json`** 文件（不是 sample_activities.json）。

微信云数据库要求 JSON Lines 格式（每行一个 JSON 对象），不支持标准 JSON 数组格式。

或者手动添加以下字段的数据：

### 字段说明

- `name` (string): 活动/景点名称
- `city` (string): 所属城市
- `district` (string): 所属区县
- `tags` (array): 标签数组，可选值：["亲子遛娃", "情侣约会", "朋友小聚", "美食探店"]
- `category` (string): 分类，如"主题乐园"、"博物馆"、"餐厅"等
- `duration` (number): 建议游玩时长（小时）
- `cost` (number): 预估人均费用（元）
- `address` (string): 详细地址
- `description` (string): 一句话亮点描述
- `photo_url` (string, 可选): 照片 URL

## 4. 示例数据

参考 `sample_activities.json` 文件中的 20 条上海活动数据。

## 5. 验证

在云开发控制台的数据库页面，确认：

- 集合 `activities` 已创建
- 至少有 20 条数据
- 数据包含不同的 tags 和 duration
