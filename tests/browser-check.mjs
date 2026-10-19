import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../scripts/serve.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundledModules = path.resolve(path.dirname(process.execPath), '..', 'node_modules');
const require = createRequire(path.join(bundledModules, 'package.json'));
const { chromium } = require('playwright');
const chromeExecutable = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputRoot = path.join(projectRoot, 'test-results');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const report = { generatedAt: new Date().toISOString(), checks: [], screenshots: [] };

await mkdir(screenshotRoot, { recursive: true });
const { server, url: baseUrl } = await startStaticServer({ root: projectRoot, port: 0 });
const browser = await chromium.launch({ executablePath: chromeExecutable, headless: true });

function attachDiagnostics(page, bucket) {
  page.on('console', (message) => {
    if (message.type() === 'error') bucket.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => bucket.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => bucket.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`));
  page.on('response', (response) => {
    if (response.status() >= 400) bucket.push(`response: ${response.status()} ${response.url()}`);
  });
}

async function loadAllImages(page) {
  await page.evaluate(async () => {
    const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(240, window.innerHeight * 0.75)) {
      window.scrollTo(0, y);
      await delay(35);
    }
    window.scrollTo(0, 0);
    await delay(80);
    document.documentElement.style.scrollBehavior = previousBehavior;
  });
  await page.waitForFunction(() => [...document.images]
    .filter((image) => image.getClientRects().length > 0 && getComputedStyle(image).visibility !== 'hidden')
    .every((image) => image.complete));
  await page.waitForFunction(() => window.scrollY === 0);
}

async function assertHealthyDocument(page, diagnostics) {
  const health = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    brokenImages: [...document.images]
      .filter((image) => image.getClientRects().length > 0 && getComputedStyle(image).visibility !== 'hidden' && image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
    dimensionMismatches: [...document.images].flatMap((image) => {
      const declaredWidth = Number(image.getAttribute('width'));
      const declaredHeight = Number(image.getAttribute('height'));
      if (!declaredWidth || !declaredHeight || !image.naturalWidth || !image.naturalHeight) return [];
      const declaredRatio = declaredWidth / declaredHeight;
      const naturalRatio = image.naturalWidth / image.naturalHeight;
      return Math.abs(declaredRatio - naturalRatio) / naturalRatio > 0.01
        ? [{ src: image.currentSrc || image.src, declared: `${declaredWidth}x${declaredHeight}`, natural: `${image.naturalWidth}x${image.naturalHeight}` }]
        : [];
    }),
    h1Count: document.querySelectorAll('h1').length,
    mainCount: document.querySelectorAll('main').length,
    telephoneLinks: [...document.querySelectorAll('a[href^="tel:"]')].map((link) => link.getAttribute('href')),
  }));
  assert.ok(health.documentWidth <= health.viewportWidth + 1, `页面横向溢出：${health.documentWidth} > ${health.viewportWidth}`);
  assert.deepEqual(health.brokenImages, [], `存在加载失败图片：${health.brokenImages.join(', ')}`);
  assert.deepEqual(health.dimensionMismatches, [], `图片声明尺寸与原图比例不符：${JSON.stringify(health.dimensionMismatches)}`);
  assert.equal(health.h1Count, 1, '页面应只有一个 h1');
  assert.equal(health.mainCount, 1, '页面应只有一个 main');
  assert.ok(health.telephoneLinks.length > 0 && health.telephoneLinks.every((href) => href === 'tel:18664724586'), '电话链接必须使用真实号码');
  assert.deepEqual(diagnostics, [], diagnostics.join('\n'));
  return health;
}

async function assertVisibleRaster(page, selector, label) {
  const sample = await page.locator(selector).evaluate((image) => {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0;
    let minimum = 255;
    let maximum = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 32) continue;
      opaque += 1;
      const luminance = (pixels[index] * 0.2126) + (pixels[index + 1] * 0.7152) + (pixels[index + 2] * 0.0722);
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
    }
    return { opaque, total: canvas.width * canvas.height, luminanceRange: maximum - minimum };
  });
  assert.ok(sample.opaque >= sample.total * 0.75, `${label}不应是透明占位图`);
  assert.ok(sample.luminanceRange >= 24, `${label}应包含可见画面层次`);
}

async function assertImageKeepsNaturalRatio(locator, label) {
  const ratio = await locator.evaluate((image) => {
    const bounds = image.getBoundingClientRect();
    return {
      natural: image.naturalWidth / image.naturalHeight,
      rendered: bounds.width / bounds.height,
      width: bounds.width,
      height: bounds.height,
    };
  });
  assert.ok(ratio.width > 0 && ratio.height > 0, `${label}应有可见尺寸`);
  assert.ok(
    Math.abs(ratio.rendered - ratio.natural) / ratio.natural <= 0.01,
    `${label}不应拉伸：原图比例 ${ratio.natural.toFixed(3)}，渲染比例 ${ratio.rendered.toFixed(3)}`,
  );
}

async function verifyContactAndFocus(page, width) {
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return { tag: active?.tagName, outlineStyle: style?.outlineStyle, outlineWidth: style?.outlineWidth };
  });
  assert.notEqual(focus.tag, 'BODY', '键盘 Tab 应移动到可聚焦元素');
  assert.notEqual(focus.outlineStyle, 'none', '键盘焦点应有可见轮廓');

  const opener = page.locator('[data-dialog-open="wechat-dialog"]').first();
  await opener.click();
  const dialog = page.locator('#wechat-dialog');
  await assertDialogOpen(dialog, '微信二维码弹窗应打开');
  await page.waitForFunction(() => {
    const image = document.querySelector('#wechat-dialog img');
    return image?.complete && image.naturalWidth > 0;
  });
  assert.ok(await dialog.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0), '二维码应成功加载');
  await assertImageKeepsNaturalRatio(dialog.locator('img'), '微信二维码弹窗图片');
  const closeButton = dialog.locator('[data-dialog-close]');
  const closeBox = await closeButton.boundingBox();
  assert.ok(closeBox && closeBox.width >= 44 && closeBox.height >= 44, '二维码关闭按钮点击范围应至少为 44×44');
  await closeButton.click();
  await assertDialogClosed(dialog, '关闭按钮应关闭微信二维码弹窗');
  assert.equal(await opener.evaluate((element) => document.activeElement === element), true, '关闭二维码后应恢复到触发按钮');

  await opener.click();
  await page.keyboard.press('Escape');
  await assertDialogClosed(dialog, 'Escape 应关闭微信二维码弹窗');
  assert.equal(await opener.evaluate((element) => document.activeElement === element), true, 'Escape 关闭二维码后应恢复到触发按钮');

  const mobileBar = page.locator('.mobile-contact-bar');
  if (width <= 640) {
    assert.ok(await mobileBar.isVisible(), '手机固定联系栏应显示');
    const metrics = await page.evaluate(() => {
      const bar = document.querySelector('.mobile-contact-bar');
      const rectangle = bar.getBoundingClientRect();
      return { barHeight: rectangle.height, barBottom: rectangle.bottom, viewportHeight: innerHeight, bodyPaddingBottom: Number.parseFloat(getComputedStyle(document.body).paddingBottom) };
    });
    assert.ok(Math.abs(metrics.barBottom - metrics.viewportHeight) <= 1, '手机联系栏应贴合安全区底部');
    assert.ok(metrics.bodyPaddingBottom >= metrics.barHeight, '正文底部留白应不小于固定联系栏高度');
  } else {
    assert.equal(await mobileBar.isVisible(), false, '较宽屏幕不应显示手机固定联系栏');
    const contactQr = page.locator('.qr-card img');
    await contactQr.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const image = document.querySelector('.qr-card img');
      return image?.complete && image.naturalWidth > 0;
    });
    await assertImageKeepsNaturalRatio(contactQr, '联系区微信二维码');
  }
}

async function assertDialogOpen(dialog, message) {
  assert.equal(await dialog.evaluate((element) => element.open), true, message);
}

async function assertDialogClosed(dialog, message) {
  assert.equal(await dialog.evaluate((element) => element.open), false, message);
}

async function verifyNavigation(page, width) {
  const menuButton = page.locator('[data-menu-button]');
  if (width <= 980) {
    assert.ok(await menuButton.isVisible(), '窄屏应显示折叠菜单按钮');
    await menuButton.click();
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'true');
    assert.ok(await page.locator('[data-mobile-menu]').isVisible(), '折叠菜单内容应打开');
    await page.keyboard.press('Escape');
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'false');
    assert.equal(await menuButton.evaluate((element) => document.activeElement === element), true, 'Escape 关闭菜单后应恢复到菜单按钮');
  } else {
    assert.equal(await menuButton.isVisible(), false, '桌面端不应显示折叠菜单按钮');
    assert.ok(await page.locator('.desktop-nav').isVisible(), '桌面导航应显示');
  }
}

async function verifyHome(viewport, screenshotName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const diagnostics = [];
  attachDiagnostics(page, diagnostics);
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await verifyNavigation(page, viewport.width);
  await verifyContactAndFocus(page, viewport.width);

  const item = page.locator('[data-home-lookbook="1"]');
  await item.scrollIntoViewIfNeeded();
  await item.click();
  const lightbox = page.locator('[data-lightbox]');
  await assertDialogOpen(lightbox, '校园画册灯箱应打开');
  assert.ok(await lightbox.locator('[data-lightbox-image]').evaluate((image) => image.complete && image.naturalWidth > 0), '画册大图应成功加载');
  await page.keyboard.press('ArrowRight');
  assert.match(await lightbox.locator('[data-lightbox-count]').textContent(), /0?2 \/ 0?6/, '键盘应切换画册图片');
  await page.keyboard.press('Escape');
  await assertDialogClosed(lightbox, 'Escape 应关闭画册灯箱');
  assert.equal(await item.evaluate((element) => document.activeElement === element), true, '关闭画册后应恢复到原图片入口');

  await loadAllImages(page);
  await assertVisibleRaster(page, '.hero-picture img', '首页首屏图');
  await assertVisibleRaster(page, '[data-home-lookbook="1"] img', '校园画册图');
  const health = await assertHealthyDocument(page, diagnostics);
  if (screenshotName) {
    const destination = path.join(screenshotRoot, screenshotName);
    await page.screenshot({ path: destination, fullPage: true });
    report.screenshots.push(path.relative(projectRoot, destination).replaceAll('\\', '/'));
  }
  report.checks.push({ page: 'index.html', viewport, health, status: 'passed' });
  await context.close();
}

async function verifyProduct(pageName, season, expectedSecondLabel, viewport, screenshotName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const diagnostics = [];
  attachDiagnostics(page, diagnostics);
  await page.goto(`${baseUrl}/products/${pageName}.html`, { waitUntil: 'networkidle' });
  await verifyNavigation(page, viewport.width);
  const productLayout = await page.locator('.product-overview-grid').evaluate((grid) => {
    const gallery = grid.querySelector('.product-gallery').getBoundingClientRect();
    const info = grid.querySelector('.product-info').getBoundingClientRect();
    return { gallery: { x: gallery.x, y: gallery.y, bottom: gallery.bottom }, info: { x: info.x, y: info.y } };
  });
  if (viewport.width <= 980) {
    assert.ok(productLayout.info.y >= productLayout.gallery.bottom - 1, '手机和平板应将产品信息排列在图库下方');
  } else {
    assert.ok(productLayout.info.x > productLayout.gallery.x && Math.abs(productLayout.info.y - productLayout.gallery.y) <= 2, '桌面端图库与信息应并排对齐');
  }
  const thumbnails = page.locator('[data-gallery-thumb]');
  assert.ok((await thumbnails.count()) >= 5, `${pageName} 应有完整产品与细节缩略图`);
  await thumbnails.nth(1).click();
  await page.waitForFunction((expectedLabel) => {
    const image = document.querySelector('[data-gallery-main]');
    const label = document.querySelector('[data-gallery-current-label]')?.textContent?.trim();
    return label === expectedLabel && image?.complete && image.naturalWidth > 0;
  }, expectedSecondLabel);
  assert.equal((await page.locator('[data-gallery-current-label]').textContent())?.trim(), expectedSecondLabel, '缩略图应更新主图与标签');
  assert.ok(await page.locator('[data-gallery-main]').evaluate((image) => image.complete && image.naturalWidth > 0), '产品主图应成功加载');
  await page.locator('[data-gallery-main-button]').click();
  const lightbox = page.locator('[data-lightbox]');
  await assertDialogOpen(lightbox, '产品主图灯箱应打开');
  await page.keyboard.press('Escape');
  await assertDialogClosed(lightbox, 'Escape 应关闭产品灯箱');
  assert.equal(await page.locator('[data-gallery-main-button]').evaluate((element) => document.activeElement === element), true, '关闭产品灯箱后应恢复到主图按钮');

  const tableMetrics = await page.locator('.table-scroll').evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
  if (viewport.width <= 980) assert.ok(tableMetrics.scrollWidth > tableMetrics.clientWidth, `${season}尺码表应仅在表格区域横向滚动`);
  const originalSizeLink = page.getByRole('link', { name: '查看原始尺码图' });
  await originalSizeLink.click();
  await assertDialogOpen(lightbox, '原始尺码图灯箱应打开');
  assert.match(await lightbox.locator('[data-lightbox-image]').getAttribute('src'), new RegExp(`size-${season}-original\\.jpg$`));
  await page.keyboard.press('Escape');
  assert.equal(await originalSizeLink.evaluate((element) => document.activeElement === element), true, '关闭尺码图后应恢复到原图入口');

  await verifyContactAndFocus(page, viewport.width);
  await loadAllImages(page);
  const health = await assertHealthyDocument(page, diagnostics);
  if (screenshotName) {
    const destination = path.join(screenshotRoot, screenshotName);
    await page.screenshot({ path: destination, fullPage: true });
    report.screenshots.push(path.relative(projectRoot, destination).replaceAll('\\', '/'));
  }
  report.checks.push({ page: `products/${pageName}.html`, viewport, productLayout, tableMetrics, health, status: 'passed' });
  await context.close();
}

try {
  await verifyHome({ width: 375, height: 900 }, 'v4-375.png');
  await verifyHome({ width: 667, height: 375 });
  await verifyHome({ width: 768, height: 900 }, 'v4-768.png');
  await verifyHome({ width: 1440, height: 900 }, 'v4-1440.png');
  await verifyProduct('summer', 'summer', '长袖 Polo', { width: 375, height: 900 }, 'summer-375.png');
  await verifyProduct('autumn', 'autumn', '背面完整图', { width: 375, height: 900 });
  await verifyProduct('winter', 'winter', '外壳正面', { width: 375, height: 900 }, 'winter-375.png');
  await verifyProduct('summer', 'summer', '长袖 Polo', { width: 1440, height: 900 }, 'summer-1440.png');
  await verifyProduct('autumn', 'autumn', '背面完整图', { width: 1440, height: 900 });
  await verifyProduct('winter', 'winter', '外壳正面', { width: 1440, height: 900 }, 'winter-1440.png');

  const reducedContext = await browser.newContext({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  assert.equal(await reducedPage.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto', '减少动态效果偏好应关闭平滑滚动');
  report.checks.push({ page: 'index.html', viewport: { width: 375, height: 900 }, reducedMotion: true, status: 'passed' });
  await reducedContext.close();

  await writeFile(path.join(outputRoot, 'browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Browser checks passed: ${report.checks.length}`);
  console.log(`Screenshots: ${report.screenshots.join(', ')}`);
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
