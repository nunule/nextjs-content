# ImageKit 小说内容规则

小说正文存放在 ImageKit，不再存放在 Git 仓库的 `content/novels` 目录中。每部小说使用一个 TXT 文件，上传到 ImageKit 的 `/novels/` 目录。

## 一、文件规则

```text
/novels/
├── wuchenglaixin.txt
├── another-novel.txt
└── third-novel.txt
```

文件名去掉 `.txt` 后会作为默认小说标识。文件名建议只使用小写英文字母、数字和短横线，例如 `wuchenglaixin.txt`。

文件请使用 UTF-8 编码。网站也兼容带 BOM 的 UTF-8、UTF-16 LE 和 UTF-16 BE 文件。

## 二、TXT 文件格式

推荐在文件开头使用 frontmatter：

```text
---
title: 燕云有信
description: 历史穿越
status: 连载中
slug: wuchenglaixin
---

边州治理、宋辽博弈与市井群像小说。故事开篇为宋太宗雍熙北伐失利后的雄州。

第一章 雨夜旧札

雨下了一夜，到天亮也没停。
```

字段规则：

| 字段 | 是否必填 | 规则 |
| --- | --- | --- |
| `title` | 否 | 小说正式名称；不填写时使用 TXT 文件名 |
| `description` | 否 | 小说类型或简短说明，会显示在小说简介中 |
| `status` | 否 | `连载中` 或 `已完结`；不填写时默认为 `连载中` |
| `slug` | 否 | 小说 URL 标识；不填写时使用 TXT 文件名 |

frontmatter 结束后，到第一章标题之前的内容会作为作品简介显示在首页的简介悬浮面板中。

## 三、章节标题规则

网站会识别以下常见章节标题：

```text
第一章 雨夜旧札
第1章：雨夜旧札
第 2 章 榷场死人
## 第三章 不肯作保的人
Chapter 4: 界河换人
```

章节标题必须单独占一行。章节编号支持阿拉伯数字、中文数字和英文 `Chapter` 格式。

章节显示顺序由章节编号决定。章节页面 URL 会自动生成，例如：

```text
/novels/wuchenglaixin/chapters/001_雨夜旧札
```

## 四、正文与下载

- 点击章节标题后，网站只显示当前章节正文。
- 正文保留自然段和换行，段落首行自动缩进 2 字符。
- 阅读页提供上一章、下一章和“下载本章”按钮。
- 下载文件为单独的 UTF-8 TXT 文件，不会下载整部小说。
- 没有识别到章节标题时，整份 TXT 会作为一章“正文”显示。

## 五、上传与安全

1. 在 ImageKit 建立 `/novels/` 目录。
2. 每部小说上传一个 `.txt` 文件。
3. 推荐将小说文件设置为私有文件。
4. 网站服务端使用 `IMAGEKIT_PRIVATE_KEY` 读取和签名访问，私钥不能放入浏览器代码。
5. 新增或更新小说时，只操作 ImageKit 文件，不需要修改代码。

如果网站没有显示新上传的内容，默认缓存时间为 60 秒；可通过 `IMAGEKIT_CACHE_SECONDS` 调整。
