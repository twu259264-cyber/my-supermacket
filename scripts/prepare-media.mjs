import { createRequire, Module } from 'node:module';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

Module._initPaths();
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const rarMap = new Map([
  [176, ['winter-shell-back', 'product-complete', 'winter', true, '冲锋衣背面完整图']],
  [177, ['winter-shell-side', 'product-complete', 'winter', true, '冲锋衣侧面完整图']],
  [178, ['winter-shell-open', 'product-complete', 'winter', true, '冲锋衣展开图']],
  [179, ['winter-shell-front-alt', 'product-complete', 'winter', true, '冲锋衣正面完整图（备选）']],
  [180, ['winter-shell-layered', 'product-complete', 'winter', true, '冲锋衣分层穿搭图']],
  [181, ['winter-shell-front', 'product-complete', 'winter', true, '冲锋衣正面完整图']],
  [182, ['winter-shell-hood', 'craft-detail', 'winter', true, '冲锋衣帽口细节']],
  [183, ['winter-fabric', 'craft-detail', 'winter', true, 'T400 破卡面料细节']],
  [184, ['winter-fabric-water-repellent', 'craft-detail', 'winter', true, '面料防泼水展示']],
  [185, ['winter-lining', 'craft-detail', 'winter', true, '230T 高密度涤塔夫里布']],
  [186, ['winter-fleece-pocket', 'craft-detail', 'winter', true, '抓绒内胆口袋细节']],
  [187, ['winter-fleece-hem', 'craft-detail', 'winter', true, '抓绒内胆下摆与拉链末端']],
  [188, ['winter-fleece-front-alt', 'product-complete', 'winter', true, '抓绒内胆正面完整图（备选）']],
  [189, ['winter-fleece', 'product-complete', 'winter', true, '可搭配抓绒内胆']],
  [190, ['winter-chest-detail', 'garment-chest-detail', 'winter', true, '冲锋衣胸前校徽细节']],
  [191, ['autumn-jacket-back', 'product-complete', 'autumn', true, '秋装外套背面完整图']],
  [192, ['autumn-jacket-back-alt', 'product-complete', 'autumn', true, '秋装外套背面完整图（备选）']],
  [193, ['autumn-jacket-front', 'product-complete', 'autumn', true, '秋装外套正面完整图']],
  [194, ['autumn-collar', 'craft-detail', 'autumn', true, '秋装外套领口细节']],
  [195, ['autumn-pocket', 'craft-detail', 'autumn', true, '秋装外套口袋细节']],
  [196, ['autumn-shoulder', 'craft-detail', 'autumn', true, '秋装外套肩部拼接']],
  [197, ['autumn-zipper', 'craft-detail', 'autumn', true, '秋装外套拉链细节']],
  [198, ['autumn-chest-detail', 'garment-chest-detail', 'autumn', true, '秋装外套胸前校徽细节']],
  [199, ['autumn-cuff', 'craft-detail', 'autumn', true, '秋装外套袖口细节']],
  [200, ['autumn-side', 'craft-detail', 'autumn', true, '秋装外套侧身拼接']],
  [201, ['autumn-fabric', 'craft-detail', 'autumn', true, '秋装外套面料细节']],
  [202, ['autumn-inside', 'craft-detail', 'autumn', true, '秋装外套内侧细节']],
  [203, ['autumn-hem', 'craft-detail', 'autumn', true, '秋装外套下摆细节']],
  [204, ['autumn-seam', 'craft-detail', 'autumn', true, '秋装外套走线细节']],
  [205, ['autumn-label', 'craft-detail', 'autumn', true, '秋装外套标识细节']],
  [206, ['summer-polo-back', 'product-complete', 'summer', true, '夏装 Polo 背面完整图']],
  [207, ['summer-polo-side', 'product-complete', 'summer', true, '夏装 Polo 侧面完整图']],
  [208, ['autumn-jacket-front-alt', 'product-complete', 'autumn', true, '秋装外套正面完整图（补充）']],
  [209, ['summer-polo-front-alt', 'product-complete', 'summer', true, '夏装 Polo 正面完整图（备选）']],
  [210, ['summer-polo', 'product-complete', 'summer', true, '夏装 Polo 正面完整图']],
  [211, ['summer-set-shorts', 'product-complete', 'summer', true, '夏装 Polo 与短裤整套图']],
  [212, ['summer-shirt-detail', 'craft-detail', 'summer', true, '夏装上衣细节']],
  [213, ['summer-trousers-back', 'product-complete', 'summer', true, '夏装长裤背面完整图']],
  [214, ['summer-trousers', 'product-complete', 'summer', true, '夏装长裤正面完整图']],
  [215, ['summer-trousers-side', 'product-complete', 'summer', true, '夏装长裤侧面完整图']],
  [216, ['summer-polo-long-sleeve', 'product-complete', 'summer', true, '夏装长袖 Polo 正面完整图']],
  [217, ['summer-waist-detail', 'craft-detail', 'summer', true, '夏装下装腰头细节']],
  [218, ['summer-shorts-back', 'product-complete', 'summer', true, '夏装短裤背面完整图']],
  [219, ['summer-shorts-side', 'product-complete', 'summer', true, '夏装短裤侧面完整图']],
  [220, ['summer-shorts', 'product-complete', 'summer', true, '夏装短裤正面完整图']],
  [221, ['summer-set-trousers', 'product-complete', 'summer', true, '夏装 Polo 与长裤整套图']],
  [222, ['summer-sleeve-detail', 'craft-detail', 'summer', true, '夏装袖口细节']],
  [223, ['summer-collar-detail', 'craft-detail', 'summer', true, '夏装翻领细节']],
  [224, ['summer-placket-detail', 'craft-detail', 'summer', true, '夏装门襟细节']],
  [225, ['summer-chest-detail', 'garment-chest-detail', 'summer', true, '夏装胸前校徽细节']],
  [226, ['summer-seam-detail', 'craft-detail', 'summer', true, '夏装走线细节']],
  [227, ['summer-trouser-stripe', 'craft-detail', 'summer', true, '夏装长裤侧条细节']],
  [228, ['summer-shorts-pocket', 'craft-detail', 'summer', true, '夏装短裤口袋细节']],
  [229, ['summer-fabric-detail', 'craft-detail', 'summer', true, '夏装面料细节']],
]);

const legacyMap = new Map([
  [1, ['brand-mark-square', 'brand-logo', 'brand', false, '旧版方形品牌图']],
  [2, ['campus-hero', 'campus-concept', 'campus', true, '校园人物首屏概念图']],
  [3, ['brand-logo-horizontal', 'brand-logo', 'brand', true, '启星程品牌 Logo']],
  [4, ['campus-lookbook-01', 'campus-concept', 'campus', true, '校园阶梯概念图']],
  [5, ['campus-lookbook-02', 'campus-concept', 'campus', true, '冬季校园海报']],
  [6, ['campus-lookbook-03', 'campus-concept', 'campus', true, '雨后校园海报']],
  [7, ['campus-lookbook-04', 'campus-concept', 'campus', true, '校园新风尚海报']],
  [8, ['campus-lookbook-05', 'campus-concept', 'campus', true, '篮球场校园海报']],
  [9, ['campus-lookbook-06', 'campus-concept', 'campus', true, '图书馆校园海报']],
  [10, ['campus-lookbook-07', 'campus-concept', 'campus', true, '横版品牌校园海报']],
  [11, ['legacy-track-jacket', 'legacy-product', 'legacy', false, 'V3 运动夹克产品图']],
  [12, ['legacy-track-pants', 'legacy-product', 'legacy', false, 'V3 运动长裤产品图']],
  [13, ['legacy-track-zip', 'legacy-detail', 'legacy', false, 'V3 拉链细节低分辨率图']],
  [14, ['legacy-shell-detail', 'legacy-detail', 'legacy', false, 'V3 外套拼色细节图']],
  [15, ['legacy-chest-detail', 'legacy-detail', 'legacy', false, 'V3 胸前图案低分辨率图']],
  [16, ['legacy-pants-detail', 'legacy-detail', 'legacy', false, 'V3 长裤侧条细节图']],
  [17, ['campus-editorial-01', 'campus-concept', 'campus', true, '晨光校园概念图']],
  [18, ['campus-editorial-02', 'campus-concept', 'campus', true, '课间校园概念图']],
  [19, ['campus-editorial-03', 'campus-concept', 'campus', true, '放学校园概念图']],
  [20, ['legacy-shell-front', 'legacy-product', 'legacy', false, 'V3 冲锋衣产品图']],
  [21, ['legacy-shell-back', 'legacy-detail', 'legacy', false, 'V3 冲锋衣背面图']],
  [22, ['legacy-shell-zip', 'legacy-detail', 'legacy', false, 'V3 冲锋衣拉链低分辨率图']],
  [23, ['legacy-polo-front', 'legacy-product', 'legacy', false, 'V3 Polo 产品图']],
  [24, ['legacy-polo-detail', 'legacy-detail', 'legacy', false, 'V3 Polo 低分辨率细节图']],
]);

const attachmentDefinitions = [
  ['size-summer.jpg', 'size-summer-original', 'size-original', 'summer', true, '夏装尺码表原图'],
  ['size-autumn.jpg', 'size-autumn-original', 'size-original', 'autumn', true, '秋装尺码表原图'],
  ['size-winter.jpg', 'size-winter-original', 'size-original', 'winter', true, '冬装尺码表原图'],
  ['wechat-qr.jpg', 'contact-wechat-qr', 'contact-qr', 'contact', true, '对外联系微信二维码'],
];

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || !value) throw new Error(`invalid argument near ${key ?? ''}`);
    values[key.slice(2)] = value;
  }
  return values;
}

function relativeWebPath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function widthsFor(item, sourceWidth) {
  const requested = item.role === 'campus-concept'
    ? [768, 1280, sourceWidth]
    : item.role === 'product-complete'
      ? [480, 960, Math.min(1600, sourceWidth)]
      : [480, 960, Math.min(1440, sourceWidth)];
  return [...new Set(requested.filter((width) => width > 0 && width <= sourceWidth))].sort((a, b) => a - b);
}

async function sharpInputFor(sourcePath) {
  if (path.extname(sourcePath).toLowerCase() !== '.svg') {
    return { input: sourcePath, sourceFormat: null, embeddedFormat: null };
  }

  const svg = await readFile(sourcePath, 'utf8');
  const embedded = svg.match(/href=["']data:image\/(png|jpe?g|webp);base64,([^"']+)["']/s);
  if (!embedded) return { input: sourcePath, sourceFormat: 'svg', embeddedFormat: null };
  return {
    input: Buffer.from(embedded[2].replace(/\s/g, ''), 'base64'),
    sourceFormat: 'svg',
    embeddedFormat: embedded[1].replace('jpg', 'jpeg'),
  };
}

async function writeResponsiveOutputs(sourcePath, item, outputRoot) {
  const source = await sharpInputFor(sourcePath);
  const metadata = await sharp(source.input).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`missing dimensions for ${sourcePath}`);

  const folder = item.role === 'brand-logo'
    ? 'brand'
    : item.role === 'campus-concept'
      ? 'campus'
      : item.role === 'size-original'
        ? 'size'
        : item.role === 'contact-qr'
          ? 'contact'
          : item.season === 'summer' || item.season === 'autumn' || item.season === 'winter'
            ? `products/${item.season}`
            : 'audit';
  const destination = path.join(outputRoot, folder);
  await mkdir(destination, { recursive: true });

  const outputs = [];
  if (item.role === 'size-original' || item.role === 'contact-qr') {
    const originalPath = path.join(destination, `${item.id}.jpg`);
    await copyFile(sourcePath, originalPath);
    outputs.push({
      path: relativeWebPath(originalPath),
      width: metadata.width,
      height: metadata.height,
      format: 'jpeg',
      kind: 'original',
    });
    return { metadata, outputs, sourceFormat: source.sourceFormat, embeddedFormat: source.embeddedFormat };
  }

  if (item.role === 'brand-logo') {
    const logoPath = path.join(destination, `${item.id}.png`);
    const info = await sharp(source.input).png({ compressionLevel: 9 }).toFile(logoPath);
    outputs.push({ path: relativeWebPath(logoPath), width: info.width, height: info.height, format: 'png' });
    return { metadata, outputs, sourceFormat: source.sourceFormat, embeddedFormat: source.embeddedFormat };
  }

  for (const width of widthsFor(item, metadata.width)) {
    const outputPath = path.join(destination, `${item.id}-${width}.webp`);
    const info = await sharp(source.input)
      .resize({ width, fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .webp({ quality: item.role === 'craft-detail' || item.role === 'garment-chest-detail' ? 88 : 84, effort: 5 })
      .toFile(outputPath);
    outputs.push({ path: relativeWebPath(outputPath), width: info.width, height: info.height, format: 'webp' });
  }
  return { metadata, outputs, sourceFormat: source.sourceFormat, embeddedFormat: source.embeddedFormat };
}

async function addItem(items, sourcePath, definition) {
  const [id, role, season, isPublic, description] = definition;
  const item = { id, sourceLabel: path.basename(sourcePath), role, season, public: isPublic, description };
  const { metadata, outputs, sourceFormat, embeddedFormat } = await writeResponsiveOutputs(sourcePath, item, currentOutputRoot);
  item.sourceWidth = metadata.width;
  item.sourceHeight = metadata.height;
  item.sourceFormat = sourceFormat ?? metadata.format;
  if (embeddedFormat) item.embeddedFormat = embeddedFormat;
  item.outputs = outputs;
  items.push(item);
}

let currentOutputRoot;

export async function prepareMedia({ sourceRoot, attachmentRoot, outputRoot }) {
  const sourceRootAbs = path.resolve(repoRoot, sourceRoot);
  const attachmentRootAbs = path.resolve(repoRoot, attachmentRoot);
  currentOutputRoot = path.resolve(repoRoot, outputRoot);
  await rm(currentOutputRoot, { recursive: true, force: true });
  await mkdir(currentOutputRoot, { recursive: true });

  const items = [];
  const sourceFiles = (await readdir(sourceRootAbs))
    .filter((name) => /_(\d+)_5\.(png|jpe?g)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  for (const fileName of sourceFiles) {
    const sourceNumber = Number(fileName.match(/_(\d+)_5\./i)[1]);
    const definition = rarMap.get(sourceNumber) ?? [
      `source-${sourceNumber}`,
      'source-audit',
      'unconfirmed',
      false,
      '未分配素材',
    ];
    await addItem(items, path.join(sourceRootAbs, fileName), definition);
  }

  const winterAliases = [
    [178, ['winter-zipper', 'craft-detail', 'winter', true, '冲锋衣门襟拉链可见整体图']],
    [185, ['winter-bound-edge', 'craft-detail', 'winter', true, '冲锋衣里布与包边区域']],
  ];
  for (const [sourceNumber, definition] of winterAliases) {
    const sourceName = sourceFiles.find((name) => name.includes(`_${sourceNumber}_5.`));
    if (!sourceName) throw new Error(`missing source image ${sourceNumber}`);
    await addItem(items, path.join(sourceRootAbs, sourceName), definition);
  }

  for (const [number, definition] of legacyMap) {
    await addItem(items, path.join(repoRoot, 'assets', `image-${String(number).padStart(2, '0')}.svg`), definition);
  }

  for (const [fileName, ...definition] of attachmentDefinitions) {
    await addItem(items, path.join(attachmentRootAbs, fileName), definition);
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    policy: {
      resize: 'fit-inside-without-enlargement',
      sourcePreservation: 'original source files remain outside assets/media',
      conceptDisclosure: 'campus-concept images are promotional concepts, not product evidence',
    },
    items: items.sort((a, b) => a.id.localeCompare(b.id, 'en')),
  };
  await writeFile(
    path.join(currentOutputRoot, 'media-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await prepareMedia({
    sourceRoot: args['source-root'] ?? 'source-materials/unpacked',
    attachmentRoot: args['attachment-root'] ?? 'source-materials/attachments',
    outputRoot: args['output-root'] ?? 'assets/media',
  });
  console.log(`prepared ${manifest.items.length} media records`);
}
