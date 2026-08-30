# 小说发布网站

这是一个基于 Next.js、Contentlayer、Tailwind CSS 和 ImageKit 的简易小说发布网站。页面内容由 ImageKit 远程提供，小说正文不进入代码仓库。

## 页面功能

- 首页从 ImageKit 展示小说列表。
- 点击小说标题，在当前页面展开章节目录。
- 点击章节标题进入正文阅读页。
- 正文页提供上一章、下一章、返回目录和下载本章。
- 关于页面介绍小说发布品牌。
- 图片按年份/月目录存放，可通过独立 URL 展示图片和文件名。

图片目录和 URL 规则请参考 [public/images/README.md](./public/images/README.md)。

## ImageKit 小说接入

复制 `.env.example` 为 `.env.local`，填写 ImageKit 服务端环境变量：

```env
IMAGEKIT_PRIVATE_KEY=你的私钥
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/你的账号
IMAGEKIT_NOVEL_PATH=/novels/
IMAGEKIT_SIGNED_FILES=true
IMAGEKIT_CACHE_SECONDS=60
```

将每部小说以一个 UTF-8 TXT 文件上传到 ImageKit 的 `/novels/` 目录。文件可以使用以下格式：

```text
---
title: 燕云有信
description: 历史穿越
status: 连载中
---

作品简介内容……

第一章 雨夜旧札

第一章正文……
```

网站会自动读取目录中的 TXT 文件、拆分章节并生成小说目录。新增小说只需要上传新的 TXT 文件，不需要修改代码或重新提交小说内容。

完整格式规则请参考 [NOVEL_CONTENT_RULES.md](./NOVEL_CONTENT_RULES.md)。

## 开发命令

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```

小说内容格式请参考 [NOVEL_CONTENT_RULES.md](./NOVEL_CONTENT_RULES.md)。
