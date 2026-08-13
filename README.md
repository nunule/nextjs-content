# 小说发布网站

这是一个基于 Next.js、Contentlayer、Tailwind CSS 和 MDX 的简易小说发布网站。

## 页面功能

- 首页展示小说列表。
- 点击小说标题，在当前页面展开章节目录。
- 点击章节标题进入正文阅读页。
- 正文页提供上一章、下一章和返回目录。
- 关于页面介绍小说发布品牌。
- 图片按年份/月目录存放，可通过独立 URL 展示图片和文件名；页面不生成图片链接。

图片目录和 URL 规则请参考 [public/images/README.md](./public/images/README.md)。

## 开发命令

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```

小说内容格式请参考 [NOVEL_CONTENT_RULES.md](./NOVEL_CONTENT_RULES.md)。
