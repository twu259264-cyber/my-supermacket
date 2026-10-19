import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(repoRoot, 'assets', 'media', 'media-manifest.json');

const requiredIds = [
  'brand-logo-horizontal',
  'campus-hero',
  'campus-lookbook-01',
  'winter-shell-front',
  'winter-shell-back',
  'winter-shell-open',
  'winter-fabric',
  'winter-lining',
  'winter-zipper',
  'winter-bound-edge',
  'winter-fleece',
  'winter-chest-detail',
  'autumn-jacket-front',
  'autumn-jacket-back',
  'autumn-collar',
  'autumn-pocket',
  'autumn-zipper',
  'autumn-cuff',
  'autumn-hem',
  'summer-polo',
  'summer-polo-long-sleeve',
  'summer-shorts',
  'summer-trousers',
  'summer-set-shorts',
  'summer-set-trousers',
  'summer-collar-detail',
  'summer-sleeve-detail',
  'summer-chest-detail',
  'size-summer-original',
  'size-autumn-original',
  'size-winter-original',
  'contact-wechat-qr',
];

test('media manifest exposes every required web role without upscaling', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const ids = new Set(manifest.items.map((item) => item.id));

  assert.equal(manifest.version, 1);
  assert.equal(manifest.items.length >= 30, true);
  assert.deepEqual(requiredIds.filter((id) => !ids.has(id)), []);

  const roles = new Set(manifest.items.map((item) => item.role));
  for (const role of [
    'brand-logo',
    'garment-chest-detail',
    'size-original',
    'contact-qr',
    'campus-concept',
    'product-complete',
    'craft-detail',
  ]) {
    assert.equal(roles.has(role), true, `missing media role: ${role}`);
  }

  const outputs = manifest.items.flatMap((item) =>
    item.outputs.map((output) => ({
      ...output,
      sourceWidth: item.sourceWidth,
      sourceHeight: item.sourceHeight,
    })),
  );
  assert.equal(
    outputs.every(
      (output) =>
        output.width <= output.sourceWidth && output.height <= output.sourceHeight,
    ),
    true,
  );

  const missingFiles = [];
  for (const output of outputs) {
    try {
      await access(path.join(repoRoot, output.path));
    } catch {
      missingFiles.push(output.path);
    }
  }
  assert.equal(missingFiles.length, 0, `missing outputs: ${missingFiles.join(', ')}`);
});

test('confirmed source 216 is published as the summer long-sleeve Polo', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const item = manifest.items.find((candidate) => candidate.sourceLabel.includes('_216_'));

  assert.ok(item, 'source image 216 must remain traceable in the manifest');
  assert.equal(item.id, 'summer-polo-long-sleeve');
  assert.equal(item.role, 'product-complete');
  assert.equal(item.public, true);
  assert.equal(item.season, 'summer');
  assert.ok(item.outputs.every((output) => output.path.startsWith('assets/media/products/summer/')));
});

test('winter craft labels stay attached to visually corresponding source photos', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const sourceFor = (id) => manifest.items.find((item) => item.id === id)?.sourceLabel;

  assert.match(sourceFor('winter-zipper'), /_178_5\.png$/);
  assert.match(sourceFor('winter-bound-edge'), /_185_5\.png$/);
  assert.match(sourceFor('winter-fleece-pocket'), /_186_5\.png$/);
  assert.match(sourceFor('winter-fleece-hem'), /_187_5\.png$/);
});

test('legacy SVG wrappers are recorded as embedded rasters before responsive conversion', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const svgItems = manifest.items.filter((item) => item.sourceLabel.endsWith('.svg'));

  assert.equal(svgItems.length, 24);
  assert.ok(svgItems.every((item) => item.sourceFormat === 'svg'));
  assert.ok(svgItems.every((item) => ['webp', 'png', 'jpeg'].includes(item.embeddedFormat)));
});
