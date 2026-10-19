# 启星程校服官网 V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 V3 隔离副本中完成一个可本地运行、以真实产品和分季尺码为核心的启星程校服静态多页面 V4，并通过桌面与手机浏览器验收。

**Architecture:** 使用一个首页、三个季节产品详情页、共享 CSS 和原生 JavaScript；网站运行时没有构建依赖。原始素材保留在忽略目录，通过可重复的 Sharp 媒体准备脚本生成响应式 WebP/PNG/JPEG 副本；Node 静态检查和 Playwright 浏览器脚本提供验收证据。

**Tech Stack:** HTML5、CSS、原生 ES modules、Node.js `node:test`、Sharp（仅媒体准备）、Playwright + 本机 Chromium（仅验收）、Node.js 静态服务器（仅本地预览）

**Spec:** `docs/superpowers/specs/2026-10-16-qixingcheng-v4-design.md`

## Global Constraints

- 工作分支为 `codex/v4-campus-yearbook`；V3 基线标签为 `v3-baseline-a7fbb79`。
- 不推送远程分支，不修改远程 `main`，不触发 GitHub Pages，不发布线上网站。
- 不迁移 React，不使用 Framer Motion，不为动画增加运行时依赖。
- Logo、校服胸前图案和风采文体门店信息必须保持不同身份。
- 只能写入规格确认的业务事实；不得虚构学校、价格、库存、交期、案例、证书或绝对性能承诺。
- “防泼水”不得改写为“防水”；不得出现“行业领先”“绝不起球”等未证实表述。
- 不提供购物车、付款或会显示虚假提交成功的表单。
- 手机正文至少 16px；交互目标至少 44×44 CSS px，关键手机按钮目标 48px 高。
- 产品完整图不得裁掉衣领、袖口和裤脚；完整海报和尺码原图按原比例查看。
- 页面根元素不得横向溢出；只有尺码表容器允许横向滚动。
- 非首屏图片按需加载；首屏图声明尺寸并设置高优先级。
- 所有灯箱和菜单支持键盘、触摸、Escape、清晰焦点和 `prefers-reduced-motion`。
- 用户可见页面不得出现开发备注、技术术语或“待补充”占位模块。

## Review Focus

1. **季节数据串用：** 夏、秋、冬详情页必须只显示自己的尺码表；三个页面的自动测试分别核对唯一列头、14 行数据和季节标识。
2. **图片身份与款式错配：** 产品页不得使用 AI 人物图说明面料或工艺；媒体清单和页面测试核对每个图片角色、来源编号与使用页面。
3. **移动端溢出：** 375px 和 667×375 下页面根宽度必须等于视口，尺码表自身可滚动且不会推动页面。
4. **弹层焦点泄漏：** 菜单、二维码和灯箱在 Escape/关闭后必须返回触发点，Tab 不得进入背景；浏览器测试覆盖打开、切换、关闭和恢复焦点。
5. **联系入口误导：** 每个页面必须有准确 `tel:18664724586` 和可见二维码说明，不得出现提交成功、购物车或付款；静态文案测试和浏览器点击测试同时覆盖。

---

## File Structure

### Runtime pages and code

- `index.html`：首页与首页画册灯箱。
- `products/summer.html`：夏装产品、图库和夏装尺码表。
- `products/autumn.html`：秋装产品、图库和秋装尺码表。
- `products/winter.html`：冲锋衣产品、图库和冬装尺码表。
- `assets/css/site.css`：全站令牌、排版、响应式、表格、对话框和 reduced-motion。
- `assets/js/site.js`：移动导航、二维码对话框、通用灯箱、焦点恢复和安全状态切换。
- `assets/js/product-gallery.js`：产品主图、缩略图、灯箱数据和前后切换。

### Source preparation and generated media

- `scripts/prepare-media.mjs`：读取忽略目录中的原图，按清单生成不放大的响应式副本和清单。
- `assets/media/media-manifest.json`：记录输出文件、来源编号、原始尺寸、输出尺寸、所属产品和网页用途。
- `assets/media/brand/`：Logo 提取副本。
- `assets/media/campus/`：首屏、画册和海报副本。
- `assets/media/products/{summer,autumn,winter}/`：产品整体和细节副本。
- `assets/media/size/`：三张尺码原图副本。
- `assets/media/contact/`：微信二维码原图副本。

### Tests and delivery notes

- `tests/media-check.mjs`：媒体清单、输出尺寸、禁止放大和角色映射。
- `tests/shared-shell-check.mjs`：四页共用导航、联系、语义和禁止文案。
- `tests/homepage-check.mjs`：首页结构、CTA、季节入口、图片和内容数量。
- `tests/summer-check.mjs`：夏装图和夏装尺码数据。
- `tests/autumn-check.mjs`：秋装图和秋装尺码数据。
- `tests/winter-check.mjs`：冲锋衣卖点、冬装图和冬装尺码数据。
- `tests/browser-check.mjs`：真实浏览器响应式、交互、焦点、资源和控制台检查。
- `docs/media-inventory.md`：素材分类、清晰度、产品对应和推荐用途。
- `docs/content-confirmation.md`：已使用事实、未确认信息和未发布说明。
- `WEBSITE_README.md`：更新为 V4 本地运行和验收说明。

---

### Task 1: Create the repeatable media pipeline and verified media library

**Files:**
- Create: `package.json`
- Create: `scripts/prepare-media.mjs`
- Create: `assets/media/media-manifest.json`
- Create: `tests/media-check.mjs`
- Create: `docs/media-inventory.md`
- Create: `assets/media/brand/*`
- Create: `assets/media/campus/*`
- Create: `assets/media/products/summer/*`
- Create: `assets/media/products/autumn/*`
- Create: `assets/media/products/winter/*`
- Create: `assets/media/size/*`
- Create: `assets/media/contact/*`

**Interfaces:**
- Consumes: `source-materials/unpacked/*_(176..229)_5.(png|jpg)` and staged files under `source-materials/attachments/`.
- Produces: `prepareMedia(options: { sourceRoot: string; attachmentRoot: string; outputRoot: string }) -> Promise<MediaManifest>`.
- Produces: manifest entries `{ id, sourceLabel, sourceWidth, sourceHeight, role, season, outputs[] }` where every output includes `path`, `width`, `height`, and `format`.
- Later tasks consume stable manifest IDs such as `brand-logo-horizontal`, `campus-hero`, `winter-shell-front`, `autumn-jacket-front`, `summer-set-shorts`, `size-summer-original`, and `contact-wechat-qr`.

- [ ] **Step 1: Stage the four user attachments in the ignored source area**

Copy the three size JPGs and one QR JPG into `source-materials/attachments/` with stable names `size-autumn.jpg`, `size-summer.jpg`, `size-winter.jpg`, and `wechat-qr.jpg`. Verify the originals remain unchanged.

- [ ] **Step 2: Write the failing media contract test**

`tests/media-check.mjs` must assert:

```js
assert.equal(manifest.version, 1);
assert.equal(manifest.items.length >= 30, true);
assert.deepEqual(requiredIds.filter(id => !ids.has(id)), []);
assert.equal(outputs.every(o => o.width <= o.sourceWidth && o.height <= o.sourceHeight), true);
assert.equal(missingFiles.length, 0);
```

It must require separate roles for brand Logo, garment chest detail, size originals, QR, AI campus images, complete product images, and craft details.

- [ ] **Step 3: Run the test and verify it fails**

Run: `node --test tests/media-check.mjs`
Expected: FAIL because `assets/media/media-manifest.json` and optimized outputs do not exist.

- [ ] **Step 4: Implement `prepareMedia(options)`**

Use Sharp with `fit: "inside"`, `withoutEnlargement: true`, preserved alpha for product cutouts, and sRGB output. Encode:

- product complete images at widths 480/960/up to 1600 without upscaling;
- product details at widths 480/960/up to 1440 without upscaling;
- campus/hero images at 768/1280/original width;
- posters at 640/1024 or original width;
- Logo as lossless transparent PNG;
- size and QR originals as byte-preserved copies plus web preview only when lossless or visually verified.

Map RAR suffixes exactly:

- winter #176–190, with main front #179/#181, back #176, open #178, fabric #183/#184, lining #185, zipper #186, inner/cuff #187, fleece #189, chest detail #190;
- autumn #191–205 plus main/front #193 and #208, back #191/#192, collar #194, pocket #195, zipper #197, cuff #199, hem #203;
- summer #206–229, with short-sleeve polo #210, long-sleeve polo #216 (confirmed by the user on 2026-10-19), shorts #220, trousers #214, short set #211, trouser set #221, sleeve/collar/chest details #222–229.

Source #216 was originally held out pending confirmation; it is now assigned to the public summer product gallery as a long-sleeve Polo.

Add `package.json` scripts for media preparation, static tests and browser checks. Declare Sharp and Playwright as development-only tooling; the public website must still open from a plain static server without Node packages. For this isolated run, use the Codex workspace dependency runtime already installed on the host rather than fetching packages from the network.

- [ ] **Step 5: Generate the media outputs and inventory**

Run: `node scripts/prepare-media.mjs --source-root source-materials/unpacked --attachment-root source-materials/attachments --output-root assets/media`
Expected: manifest and responsive media files are created with no upscaled output.

Write `docs/media-inventory.md` from the verified manifest, including the SVG embedded-raster finding and the low-resolution limits of `image-13`, `image-15`, `image-22`, and `image-24`.

- [ ] **Step 6: Run the media contract test**

Run: `node --test tests/media-check.mjs`
Expected: PASS with every required role present, no missing output, and no output larger than its source.

- [ ] **Step 7: Visually inspect representative outputs**

Inspect full product, transparent edge, fine stitching, Logo, size text, and QR at original detail. Reject any output with cropped garment parts, softened QR modules, color shift, alpha fringe, or invented content.

- [ ] **Step 8: Commit**

```bash
git add scripts/prepare-media.mjs assets/media tests/media-check.mjs docs/media-inventory.md
git commit -m "feat: prepare verified responsive uniform media"
```

---

### Task 2: Build the shared semantic shell and accessible interactions

**Files:**
- Create: `assets/css/site.css`
- Create: `assets/js/site.js`
- Create: `tests/shared-shell-check.mjs`
- Modify: `index.html`
- Create: `products/summer.html`
- Create: `products/autumn.html`
- Create: `products/winter.html`

**Interfaces:**
- Consumes: manifest media paths from Task 1.
- Produces: `initMobileNavigation()`, `initDialogs()`, `openMediaDialog(trigger, items, index)`, `closeActiveDialog()`, and `initWechatDialog()` in `assets/js/site.js`.
- Produces common DOM hooks: `[data-menu-button]`, `[data-mobile-menu]`, `[data-dialog-open]`, `[data-dialog-close]`, `[data-lightbox]`, and `[data-wechat-dialog]`.
- Product pages and homepage use the same header, contact footer, QR dialog, lightbox shell, and mobile fixed contact bar.

- [ ] **Step 1: Write the failing shared-shell test**

For each of four HTML files, assert:

```js
assert.match(html, /<html lang="zh-CN">/);
assert.match(html, /<a[^>]+href="tel:18664724586"/);
assert.match(html, /data-wechat-dialog/);
assert.match(html, /跳到主要内容/);
assert.doesNotMatch(html, /购物车|付款|提交成功|行业领先|绝不起球|完全防水/);
```

Also assert one `<main>`, one `<h1>`, shared CSS/JS paths, real Logo alt text, and no external font/script request.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/shared-shell-check.mjs`
Expected: FAIL because the V3 shell lacks the required real contact structure and three product pages.

- [ ] **Step 3: Implement the shared CSS foundation**

Define the exact semantic color tokens from the spec, blackface font stack, 4/8 spacing scale, max-width containers, 16px minimum mobile body text, visible focus, touch targets, safe-area bottom padding, stable image placeholders, table-scroll containers, dialog layers, and `prefers-reduced-motion` overrides.

- [ ] **Step 4: Implement the shared HTML shell on all four pages**

Add skip link, Logo navigation, desktop nav, mobile menu, main region, contact footer, real phone link, visible QR contact block, QR dialog, generic media dialog, and fixed mobile contact bar. Product pages use `../` paths; homepage uses root paths.

- [ ] **Step 5: Implement shared interaction functions**

Use native buttons and `<dialog>`. Preserve the opening trigger, close on explicit button and Escape, restore focus, update `aria-expanded`, prevent background scroll only while a modal dialog is open, and never depend on animation-end events for state correctness.

- [ ] **Step 6: Run the shared-shell test**

Run: `node --test tests/shared-shell-check.mjs`
Expected: PASS for all four pages.

- [ ] **Step 7: Commit**

```bash
git add index.html products assets/css/site.css assets/js/site.js tests/shared-shell-check.mjs
git commit -m "feat: add shared V4 site shell and contact paths"
```

---

### Task 3: Implement the editorial homepage

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`
- Modify: `assets/js/site.js`
- Create: `tests/homepage-check.mjs`

**Interfaces:**
- Consumes: Task 1 manifest IDs and Task 2 shared shell/dialog hooks.
- Produces anchors `#uniforms`, `#craft`, `#custom`, `#about`, and `#contact`.
- Produces three season links to `products/summer.html`, `products/autumn.html`, and `products/winter.html`.
- Produces homepage gallery data in DOM `data-lightbox-item` attributes; no separate data store is required.

- [ ] **Step 1: Write the failing homepage contract test**

Assert exact primary copy and section counts:

```js
assert.match(html, /启少年星光，赴远大征程/);
assert.match(html, />查看校服</);
assert.match(html, />学校批量定制</);
assert.equal(count(html, /data-season-card=/g), 3);
assert.equal(count(html, /data-home-lookbook=/g), 3);
assert.match(html, /30\s*年校服生产经验/);
```

Assert all eight required homepage sections, three real product links, one concept-image disclosure, no school list, and no form element.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/homepage-check.mjs`
Expected: FAIL against the shared shell because homepage content is not complete.

- [ ] **Step 3: Build the responsive hero and season index**

Use the specified brand line, two CTA links, responsive hero `picture`, mobile-specific composition, and exactly three season entries. Keep text outside the image face/emblem region.

- [ ] **Step 4: Build the winter hero-product and craft sections**

Use one complete shell image, at most four corresponding detail images, and the exact cautious material statements. Alternate real photo and text rows; do not use AI campus images for product proof.

- [ ] **Step 5: Build the compact lookbook, custom-service, experience, and contact sections**

Show exactly three selected campus images on the page and expose all six only through the gallery dialog. Label the process as suggested communication steps and include the scope disclaimer. Display the store/contact facts and QR without implying corporate ownership.

- [ ] **Step 6: Run homepage and shared tests**

Run: `node --test tests/shared-shell-check.mjs tests/homepage-check.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/css/site.css assets/js/site.js tests/homepage-check.mjs
git commit -m "feat: create V4 campus yearbook homepage"
```

---

### Task 4: Implement the shared product gallery and summer detail page

**Files:**
- Create: `assets/js/product-gallery.js`
- Modify: `assets/css/site.css`
- Modify: `products/summer.html`
- Create: `tests/summer-check.mjs`

**Interfaces:**
- Consumes: Task 2 dialog helpers and Task 1 summer media.
- Produces: `initProductGallery(root: HTMLElement)`, `selectGalleryItem(root, index)`, and lightbox item extraction from `[data-gallery-thumb]`.
- Produces DOM hooks `[data-product-gallery]`, `[data-gallery-main]`, `[data-gallery-thumb]`, and `[data-size-table="summer"]`.

- [ ] **Step 1: Write the failing summer-page test**

Assert the summer page has separate complete-product images for Polo, shorts, trousers, short set and trouser set; no AI image in the product gallery; exactly 14 size rows; 11 columns; original size image link; and no T400/230T/南韩棉 text.

Pin representative source values:

```js
assertRow('120', ['50','80','50','70','39','34','83','48','38-46','110-120']);
assertRow('155', ['64','99','64','92','49.5','44.5','102','62','90-98','150-155']);
assertRow('210', ['82','132','86','119','66','61','135','84','220-240','200-210']);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/summer-check.mjs`
Expected: FAIL because the summer page is only a shared shell.

- [ ] **Step 3: Implement the reusable product gallery**

Switch main-image `src`, `srcset`, dimensions, alt text and active thumbnail state together. A main-image click opens the complete gallery in the shared lightbox; keyboard activation must be native button behavior.

- [ ] **Step 4: Implement the summer product content**

Render product overview, complete and single-item images, real construction details, scope-safe copy, phone/WeChat CTA, and the summer-only size table. Keep the table inside one labeled scroll region; keep original size image as a normal fallback link and a lightbox trigger.

- [ ] **Step 5: Run summer, shared-shell and media tests**

Run: `node --test tests/media-check.mjs tests/shared-shell-check.mjs tests/summer-check.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add products/summer.html assets/css/site.css assets/js/product-gallery.js tests/summer-check.mjs
git commit -m "feat: add summer uniform detail and size guide"
```

---

### Task 5: Implement the autumn detail page

**Files:**
- Modify: `products/autumn.html`
- Modify: `assets/css/site.css`
- Create: `tests/autumn-check.mjs`

**Interfaces:**
- Consumes: shared product gallery and Task 1 autumn media.
- Produces DOM hook `[data-size-table="autumn"]` with 14 body rows and only the autumn headers.

- [ ] **Step 1: Write the failing autumn-page test**

Assert the page includes the 南韩棉 statement, front/back/collar/pocket/zipper/cuff/hem real images, 14 rows and 9 columns, original size image link, and no T400/230T/waterproof copy.

Pin representative rows:

```js
assertRow('120#', ['55','90','37.2','46.5','72','84','38-46','110-120']);
assertRow('170#', ['75','124','50.5','61.5','102','114','115-140','165-170']);
assertRow('210#', ['90','156','62.5','73.5','120','138','220-240','201-210']);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/autumn-check.mjs`
Expected: FAIL because autumn content is not complete.

- [ ] **Step 3: Implement the autumn content and table**

Use the existing gallery interface, accurate real-image captions, the exact season-specific material statement, phone/WeChat CTAs, autumn-only table and original-image lightbox link.

- [ ] **Step 4: Run autumn and regression tests**

Run: `node --test tests/shared-shell-check.mjs tests/summer-check.mjs tests/autumn-check.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add products/autumn.html assets/css/site.css tests/autumn-check.mjs
git commit -m "feat: add autumn uniform detail and size guide"
```

---

### Task 6: Implement the winter shell detail page

**Files:**
- Modify: `products/winter.html`
- Modify: `assets/css/site.css`
- Create: `tests/winter-check.mjs`

**Interfaces:**
- Consumes: shared product gallery and Task 1 winter media.
- Produces DOM hook `[data-size-table="winter"]` with 14 body rows and only the winter headers.

- [ ] **Step 1: Write the failing winter-page test**

Assert the page includes T400 破卡、弹力、抗撕裂、防泼水、230T 高密度涤塔夫、哑光、顺滑、SBS 浔兴拉链 and 内里全包边; assert it does not contain `完全防水` or standalone performance absolutes. Assert complete shell/front/back/lining/zipper images, 14 rows, 12 columns and the original note.

Pin representative rows:

```js
assertRow('120', ['55','90','36.5','25','72','39','34','84','24','38-46','110-120']);
assertRow('170', ['75','124','42.5','35','102','54','49','114','34','115-140','166-170']);
assertRow('210', ['90','156','48.5','43','120','66','61','138','42','221-240','201-210']);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/winter-check.mjs`
Expected: FAIL because winter content is not complete.

- [ ] **Step 3: Implement the winter content and table**

Use the exact product/craft image mapping, separate user-provided facts from image captions, state “防泼水” only, include the mixed-column clarification, phone/WeChat CTAs, original size image and measurement-note text.

- [ ] **Step 4: Run all static tests**

Run: `node --test tests/media-check.mjs tests/shared-shell-check.mjs tests/homepage-check.mjs tests/summer-check.mjs tests/autumn-check.mjs tests/winter-check.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add products/winter.html assets/css/site.css tests/winter-check.mjs
git commit -m "feat: add winter shell detail and size guide"
```

---

### Task 7: Add real-browser responsive and interaction verification

**Files:**
- Create: `tests/browser-check.mjs`
- Modify: `assets/css/site.css`
- Modify: `assets/js/site.js`
- Modify: `assets/js/product-gallery.js`
- Modify as required: `index.html`, `products/*.html`

**Interfaces:**
- Consumes: `SITE_URL`, defaulting to `http://127.0.0.1:4173`.
- Produces: `runViewport(browser, { width, height, name, reducedMotion }) -> Promise<ViewportResult>`.
- Produces: JSON console summary and screenshots under ignored `test-results/`.

- [ ] **Step 1: Write the browser test with expected failures recorded**

For `375×900`, `667×375`, `768×900`, and `1440×900`, check:

```js
assert.equal(metrics.rootScrollWidth, metrics.rootClientWidth);
assert.equal(failedRequests.length, 0);
assert.deepEqual(consoleErrors, []);
assert.equal(await page.locator('a[href="tel:18664724586"]').count() > 0, true);
```

Also exercise mobile menu, all three season links, QR dialog, homepage gallery, product gallery, size-original lightbox, Escape close, focus restoration, fixed-bar overlap, table-local overflow, image natural dimensions, and reduced-motion computed styles.

- [ ] **Step 2: Start the local server and run the browser test**

Run server from repository root: `node scripts/serve.mjs --port 4173`
Run: `node tests/browser-check.mjs`
Expected initially: FAIL on any real responsive, focus, image, contrast-adjacent, or interaction problem that static tests could not detect.

- [ ] **Step 3: Fix only evidence-backed browser failures**

Adjust layout, target size, safe-area padding, focus, image dimensions, dialog behavior or page-specific paths. Do not add unrelated animation or decorative components.

- [ ] **Step 4: Re-run static and browser suites**

Run all Node static tests, then `node tests/browser-check.mjs`.
Expected: PASS for all viewports, no console errors, no 404, no page overflow.

- [ ] **Step 5: Manually inspect 375, 768 and 1440 screenshots**

Check faces and chest details are unobscured, complete garments are visible, QR and size text remain sharp, page rhythm is not overly card-based, and mobile content is deliberately reordered rather than merely scaled.

- [ ] **Step 6: Commit**

```bash
git add tests/browser-check.mjs index.html products assets/css/site.css assets/js
git commit -m "test: verify V4 responsive interaction behavior"
```

---

### Task 8: Finish documentation, final QA and preview handoff

**Files:**
- Create: `docs/content-confirmation.md`
- Modify: `WEBSITE_README.md`
- Modify as required: `index.html`, `products/*.html`, `assets/css/site.css`, `assets/js/*.js`, `tests/*.mjs`
- Generate ignored: `test-results/v4-375.png`
- Generate ignored: `test-results/v4-768.png`
- Generate ignored: `test-results/v4-1440.png`

**Interfaces:**
- Consumes: all test results and the approved design spec.
- Produces: local preview URL, reproducible commands, final confirmation list and three real screenshots.

- [ ] **Step 1: Write the failing documentation checks**

Extend the shared/content test to require `WEBSITE_README.md` to state V4, local server command, test commands, preview-only status, and no deployment claim. Require `docs/content-confirmation.md` to list the naming conflict, company relationship, schools, MOQ/lead time/price/policies/certificates as unconfirmed.

- [ ] **Step 2: Run the documentation test and verify it fails**

Run: `node --test tests/shared-shell-check.mjs`
Expected: FAIL until delivery documentation is updated.

- [ ] **Step 3: Write delivery documentation**

Document the exact local preview command, pages, image pipeline, tests, known content boundaries, attachment sources and the fact that no publish/push occurred. Keep development notes out of user-facing HTML.

- [ ] **Step 4: Run source-format and full test checks**

Run:

```bash
node --check assets/js/site.js
node --check assets/js/product-gallery.js
node --check scripts/prepare-media.mjs
node --check tests/browser-check.mjs
node --test tests/media-check.mjs tests/shared-shell-check.mjs tests/homepage-check.mjs tests/summer-check.mjs tests/autumn-check.mjs tests/winter-check.mjs
node tests/browser-check.mjs
```

Expected: every command exits 0; browser report has no failed request, console error, root overflow or blocked interaction.

- [ ] **Step 5: Generate final screenshots**

Capture the fully loaded homepage at 375×900, 768×900 and 1440×900 after scrolling through lazy-loaded content. Save under `test-results/` and visually inspect each at readable detail.

- [ ] **Step 6: Run the Web Design Guidelines final review**

Review actual source and browser states for semantics, heading order, focus, alt text, contrast, touch targets, image sizing, lazy loading, CLS, responsive overflow, safe areas, reduced motion, real SKU/photo correspondence and cautious material claims. Fix confirmed issues and re-run the affected tests.

- [ ] **Step 7: Run verification-before-completion and inspect Git state**

Re-run every success command fresh, then:

```bash
git status --short
git diff --check v3-baseline-a7fbb79..HEAD
git log --oneline --decorate v3-baseline-a7fbb79..HEAD
```

Expected: no whitespace errors; only intentional V4 changes; source-materials, audit and test screenshots remain ignored.

- [ ] **Step 8: Commit final documentation and QA fixes**

```bash
git add WEBSITE_README.md docs/content-confirmation.md index.html products assets tests scripts
git commit -m "docs: complete V4 preview handoff"
```

- [ ] **Step 9: Deliver preview without publishing**

Provide clickable local files/screenshots, preview command and URL, modification summary, unconfirmed-information list, exact test results, current branch and V3 restoration tag. Explicitly state that no deployment, remote push or `main` modification occurred.
