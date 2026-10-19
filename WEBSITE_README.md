# 启星程校服官网 V4 — 运行与发布说明

这是启星程校服官网 V4，主题为“校园青春画册”。用户已于 2026-10-19 确认发布；远程 `main` 由 `.github/workflows/pages.yml` 自动部署到 GitHub Pages。本地仍可按下方命令运行同一版本进行复核。

## 页面

- `index.html`：品牌首页，包含校园首屏、夏秋冬系列、主推冲锋衣、品质工艺、校园画册、学校定制草案、品牌经历与联系信息。
- `products/summer.html`：夏装整套、单件、真实细节和夏装专用尺码表。
- `products/autumn.html`：秋装南韩棉外套、真实细节和秋装专用尺码表。
- `products/winter.html`：冬装冲锋衣外壳、里布、抓绒内胆、工艺细节和冬装专用尺码表。

运行时仅使用静态 HTML、CSS 和原生 JavaScript，不依赖 React、在线字体或第三方脚本。页面没有购物车、付款和虚假提交表单；购买入口统一为电话或微信咨询。

## 启动本地预览

在仓库根目录运行：

```powershell
node scripts/serve.mjs --port 4173
```

浏览器访问：

```text
http://127.0.0.1:4173/
```

按 `Ctrl+C` 停止预览。也可以在具备 npm 的普通 Node.js 环境运行 `npm run preview`。

## 验证命令

静态内容、尺码数据、素材映射与禁止文案：

```powershell
node --test tests/media-check.mjs tests/shared-shell-check.mjs tests/homepage-check.mjs tests/summer-check.mjs tests/autumn-check.mjs tests/winter-check.mjs
```

真实浏览器响应式与交互测试：

```powershell
node tests/browser-check.mjs
```

浏览器测试会自动启动临时静态服务，使用本机 Chrome 检查 375×900、667×375、768×900、1440×900，并验证菜单、二维码、画册灯箱、产品图库、尺码原图、键盘操作、减少动态效果、图片像素可见性、根页面溢出与尺码表局部滚动。报告和截图生成在忽略目录 `test-results/`。

## 素材处理

- 原始 RAR 解压素材与四张用户附件保存在被 Git 忽略的 `source-materials/`，不会被媒体脚本覆盖。
- `scripts/prepare-media.mjs` 生成 `assets/media/` 下的响应式副本和 `media-manifest.json`。
- V3 的 24 个 SVG 是位图容器，不是可无限放大的矢量图。脚本会先提取内嵌 PNG/WebP，再按真实像素生成网页副本，禁止放大。
- 三张尺码原图和微信二维码保持原始字节；网页尺码表按季节分别录入，原图仍可放大核对。
- 素材来源、尺寸、季节和推荐用途详见 `docs/media-inventory.md`。

## 版本隔离

- 线上发布分支：`main`
- V4 开发分支：`codex/v4-campus-yearbook`
- V3 恢复标签：`v3-baseline-a7fbb79`
- 尚待业务确认的内容：`docs/content-confirmation.md`

GitHub Pages 只发布静态网站文件；原始 RAR、用户附件源文件和本地测试结果不进入线上站点。
