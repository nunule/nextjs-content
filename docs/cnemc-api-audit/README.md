# 中国环境监测总站空气质量平台接口盘点

调查日期：2026-10-09，时区 Asia/Shanghai。目标站点：https://air.cnemc.cn:18007/ 。

## 结论

从城市空气质量、点位空气质量、24小时变化趋势三个页面及其前端脚本，共识别 **12 个去重后的空气质量/行政区划数据接口**。12 个接口均取得有效 JSON 样本（城市详情按 GET 实测，其余采用前端方法）。这是可见页面使用的接口清单，不是后台全部接口的穷举，也不是官方对外 API 文档。

历史能力以短窗口为主：城市小时历史和点位小时历史本次各返回 24 条，城市日报历史返回 14 天；点位 IAQI 历史本次只有 23 条。全国点位指定小时接口虽有 `date` 参数，但本次对超过窗口的多个日期均返回空数组，**没有验证到能下载数月或数年的历史库**。长期保存应从现在开始持续归档；多年历史需另行取得历史数据源。

已保存前端页面、脚本、原始响应与响应头，供复核；没有启动定时采集，也没有批量拉取全国全部历史。全国实时样本共 338 个城市、1601 个点位，仅代表本次响应数量。

## 接口总表

所有路径都拼接上述站点根地址。GET 参数放 query；POST 除第12项外，前端也把查询条件放 query，并发送空表单；第12项使用 `application/x-www-form-urlencoded` 表单提交 `date`。

| # | 前端方法与路径 | 参数示例 | 可以获取什么 | 本次验证 |
|---|---|---|---|---|
| 1 | GET `/CityData/GetProvince` | 无 | 省级字典：Id、名称、行政代码、拼音缩写 | 34条字典，不等于34个地区都有监测数据 |
| 2 | GET `/CityData/GetCitiesByPid` | `pid=1` | 某省下城市 Id、CityCode、CityName、ProvinceId | 北京1条；pid 是第1项的 Id，不是 ProvinceCode |
| 3 | GET `/CityData/GetAllCityRealTimeAQIModels` | 无 | 全国城市最新小时 AQI、质量等级、首要污染物、坐标、健康指引、污染物等级 | 338条；**不含六项污染物浓度** |
| 4 | GET `/CityData/GetAllCityDayAQIModels` | 无 | 全国城市最新日报 AQI 概览、等级、首要污染物等 | 338条，日期2026-10-08；不含浓度 |
| 5 | POST `/CityData/GetAQIDataPublishLiveInfo` | `cityCode=110000` | 单城市最新小时 AQI 和 CO、NO2、O3、PM10、PM2_5、SO2 浓度 | 北京单对象；本次 GET 同样成功，POST 未单独实测 |
| 6 | GET `/CityData/GetAQIDataPublishLive` | `cityName=北京市` | 城市内各点位当前 AQI、污染物浓度、部分平均值、站点名称/代码/坐标 | 北京23个点位 |
| 7 | POST `/HourChangesPublish/GetAllAQIPublishLive` | 无 | 全国点位当前完整快照：AQI、六项浓度、部分平均值、等级、位置、城市归属 | 1601条；适合定时全国归档 |
| 8 | POST `/HourChangesPublish/GetCityRealTimeAqiHistoryByCondition` | `citycode=110000` | 单城市最近24小时 AQI、六项浓度、首要污染物、质量等级、健康指引 | 北京24条 |
| 9 | POST `/HourChangesPublish/GetCityDayAqiHistoryByCondition` | `citycode=110000` | 单城市最近14天 AQI 日报及日统计浓度字段 | 北京14条；2026-09-25至2026-10-08 |
| 10 | POST `/HourChangesPublish/GetAqiHistoryByCondition` | `stationCode=1001A` | 单点位最近24小时 AQI、浓度、部分平均值、等级、位置 | 万寿西宫24条 |
| 11 | POST `/HourChangesPublish/GetIAqiHistoryByCondition` | `stationCode=1001A` | 单点位污染物分指数：ICO、INO2、IO3、IO3_8h、IPM10、IPM2_5、ISO2 | 本次23条；**分指数不是浓度** |
| 12 | POST `/HourChangesPublish/GetAQIHistoryByConditionHis` | 表单 `date=2026-10-09 18:00:00` | 指定小时的全国点位浓度、AQI、等级和位置 | 最新小时和前23小时均1601条；更早抽样为空 |

机器可读清单：[endpoints.json](endpoints.json)。每项包含样本、响应头和前端调用位置。

## 历史窗口实测

本次接口返回的最新观测时间为 **2026-10-09 18:00（北京时间）**。抓取发生在约18:59—19:02，属于下一小时发布前；采集时间和观测时间必须分开存储。

| 查询 | 最早观测时间 | 最晚观测时间 | 数量 |
|---|---|---|---|
| 北京城市小时历史 | 2026-10-08 19:00 | 2026-10-09 18:00 | 24 |
| 北京城市日报历史 | 2026-09-25 | 2026-10-08 | 14 |
| 1001A 点位小时历史 | 2026-10-08 19:00 | 2026-10-09 18:00 | 24 |
| 1001A 点位 IAQI 历史 | 2026-10-08 20:00 | 2026-10-09 18:00 | 23 |

全国点位指定小时接口的 `date` 抽查结果：

| date（北京时间） | 相对最新观测时间 | 返回条数 |
|---|---|---|
| 2026-10-09 18:00:00 | 最新小时 | 1601 |
| 2026-10-08 19:00:00 | 23小时前 | 1601 |
| 2026-10-08 18:00:00 | 24小时前 | 0 |
| 2026-10-07 18:00:00 | 48小时前 | 0 |
| 2026-09-09 18:00:00 | 约一个月前 | 0 |
| 2025-10-09 18:00:00 | 一年前 | 0 |

前端时间轴本身也只生成最近24个小时。结合实测，近期滚动窗口是可行用途；空数组不证明后台没有存档，更不能据此承诺固定的长期保留政策。未尝试猜测未公开路由或虚构 start/end 参数。城市/点位历史接口的前端只传代码，没有日期起止参数。

注意：`TDMap3.js` 有一个初始日期字面值 `2024-01-05 14:00`，随后会被时间轴覆盖，**它不代表支持2024年的历史数据**。

## 返回字段及存储注意事项

完整实测字段、类型、缺失标记频次、样本和时间范围见 [response-summary.json](response-summary.json)。

- 身份字段：`ProvinceId`、`CityCode`、`Area`、`StationCode`、`PositionName`、`Latitude`、`Longitude`。代码建议存字符串，保留坐标原文和数值版本。城市点位接口本次 `ProvinceId`、`CityCode` 为0，而全国点位接口有实际归属，不要用0覆盖维表。
- 时间字段：城市实时接口用无时区 ISO 字符串，例如 `2026-10-09T18:00:00`；多个历史接口用 .NET 格式 `/Date(1791540000000)/`，它是 Unix 毫秒，对应北京时间18:00。统一存 UTC 时间戳，并保留原文和北京时间显示；`TimePointStr` 有时只含日/小时，不可单独作为主键。
- 主要指标：`AQI`、`Quality`、`PrimaryPollutant`、`CO`、`NO2`、`O3`、`PM10`、`PM2_5`、`SO2`。浓度多数以字符串返回。页面单位为 CO：mg/m³，其他五项：μg/m³；AQI 和 IAQI 无浓度单位。
- 扩展统计字段：`CO_24h`、`NO2_24h`、`SO2_24h`、`PM10_24h`、`PM2_5_24h`、`O3_8h`、`O3_24h`、`O3_8h_24h`。日报接口字段为 `SO2_24h`、`CO_24h`、`NO2_24h`、`O3_8h_24h`、`PM10_24h`、`PM2_5_24h`。这些是对应统计时段的标量，**不是内嵌24条历史记录**。特别是臭氧字段，不要仅凭后缀推断全部计算规则；先原样保存，再核实官方统计口径。
- 分指数：`ICO`、`INO2`、`IO3`、`IO3_8h`、`IPM10`、`IPM2_5`、`ISO2`；浓度接口的 `COLevel` 等是等级，也不是分指数。第7项的全国快照不能代替第11项的分指数历史。
- 其他字段：`Measure`、拼写为 `Unheathful` 的健康影响文本、`AqiLevel`、`OrderId`、`IsPublish` 等。全国点位快照还出现 `NO`、`NO_24h`、`NOx`、`NOx_24h` 字段，不代表一定有有效值，不应把它们当成完整监测产品。
- 缺失值包括 `NA`、空字符串、`null`、`/` 等，首要污染物还可能是 `—`。保留原值及缺失原因，不转成0。不能仅凭 `IsPublish=false` 丢弃记录，本次公开响应中存在该值。
- 城市日报、IAQI 的响应顺序不保证按时间排列；必须解析时间后排序。IAQI本次不足24条，不能假定接口每次返回完整序列。
- 实时报、日报、IAQI、不同平均时段要分开。不要用点位简单平均值代替官方城市值，也不要把小时 AQI 平均值当作日报 AQI。

## 访问方式与失败样本

成功样本未使用登录、Cookie 或 API Key。本次 POST 成功请求使用空表单/日期表单，并附带网页 Referer 和 `X-Requested-With: XMLHttpRequest`；是否必须有这两个头未单独隔离验证。

直接把 POST 路由当 GET 访问会失败：全国点位实时、城市小时历史返回404，城市日报历史返回500 HTML。一次仅 `-X POST` 未附表单的请求返回空响应，改为下列网页相同的表单方式后成功；不能据此断言具体原因。

```bash
# 全国点位最新快照
curl --fail-with-body --max-time 30 \
  -H 'X-Requested-With: XMLHttpRequest' \
  -e 'https://air.cnemc.cn:18007/' \
  --data '' \
  'https://air.cnemc.cn:18007/HourChangesPublish/GetAllAQIPublishLive'

# 单城市近期日报
curl --fail-with-body --max-time 30 \
  -H 'X-Requested-With: XMLHttpRequest' \
  -e 'https://air.cnemc.cn:18007/' \
  --data '' \
  'https://air.cnemc.cn:18007/HourChangesPublish/GetCityDayAqiHistoryByCondition?citycode=110000'

# 全国点位某小时快照：日期需要替换成当时仍可查询的最近小时
curl --fail-with-body --max-time 30 \
  -H 'X-Requested-With: XMLHttpRequest' \
  -e 'https://air.cnemc.cn:18007/' \
  --data-urlencode 'date=2026-10-09 18:00:00' \
  'https://air.cnemc.cn:18007/HourChangesPublish/GetAQIHistoryByConditionHis'
```

生产采集需同时检查 HTTP 状态、Content-Type、JSON 类型、字段和 TimePoint；不能仅以 curl 退出成功或 HTTP 200 判定拿到了有效空气质量记录。接口是网站内部调用，稳定性、配额、再分发条件未在本次调查中确定。

## 建议的保存方案（尚未实施）

1. **原始层**：每次响应保留 JSON、请求路径/参数、HTTP状态、观测时间范围、抓取时间、内容哈希。按日期分目录压缩归档，保留修订版本，不覆盖旧响应。
2. **字典层**：省份、城市、监测点分别建表，监测点保留历史名称、坐标、归属和有效期。利用全国点位接口建立当前站点维表。
3. **观测层**：城市小时、城市日报、点位小时、点位 IAQI 分表。唯一键至少包含来源、实体代码、观测时间和统计周期；原始层保留修订，查询层可提供最新版本。
4. **首次补齐**：全国点位按最近24小时逐小时调用第12项；各城市用第8项补近期小时、第9项补近期日报；需要官方 IAQI 时，再按站点用第11项补齐。实际采集前再次确认窗口和负载，采用低并发、有界重试。
5. **持续采集**：站方发布说明写明每小时更新、整点后20分钟发布。建议整点后约25—35分钟拉取第7项全国点位快照，并按实际 TimePoint 检查是否更新；城市浓度用第5项或第8项归档；日报用第9项，每天检查是否出现新观测日期。
6. **断档处理**：按实体检查小时连续性，及时在滚动窗口内补拉；记录缺测而不是填0。超过窗口的断档和多年历史需额外数据源或向发布单位申请，不能承诺由本平台补齐。

如果目标是“尽可能完整保存”，至少要保留 AQI、六项浓度、IAQI、平均时段、站点/城市字典、时间、质量等级、首要污染物及缺失标记；原始响应比仅导出几个数值更能应对将来的字段解释变化。

## 证据与范围

官方原始页面及脚本：

- [城市空气质量](https://air.cnemc.cn:18007/CityPublish/Index)、[TDMap.js](https://air.cnemc.cn:18007/Content/Scripts/Map/TDMap.js)
- [点位空气质量](https://air.cnemc.cn:18007/StationPublish/Index)、[TDMap2.js](https://air.cnemc.cn:18007/Content/Scripts/Map/TDMap2.js)
- [24小时变化趋势](https://air.cnemc.cn:18007/HourChangesPublish/Index)、[TDMap3.js](https://air.cnemc.cn:18007/Content/Scripts/Map/TDMap3.js)
- [发布说明](https://air.cnemc.cn:18007/About/Index)

站方说明的数据来源是国家城市环境空气质量监测点位自动监测数据；实时发布数据用于公众健康指引，不直接用于达标评价。本次发布说明引用 GB 3095-2026 与 HJ 633-2026，并说明部分站点的 SO2、CO 不再监测时使用 `/`。长期历史合并需保存口径版本，避免把不同口径当成完全可比。

页面 HTML 路由 `/CityPublish/Index`、`/StationPublish/Index`、`/HourChangesPublish/Index`、`/About/Index` 不计入12个数据接口。前端另外引用 `/Content/Scripts/Map/China.json` 和天地图行政区划服务，用于地图显示，不是空气质量数据源。本次没有调用第三方地图服务。

`evidence/` 保存本次来源页面、三个业务脚本、成功 JSON 和失败响应。失败响应扩展名改为 `.error.html`，避免误作数据。`evidence-manifest.json` 记录各文件 SHA-256 和大小；`response-summary.json` 从保存的样本计算统计，不依赖在线网站后续变化。
