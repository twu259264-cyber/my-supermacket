import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const pages = [
  ['index.html', 'assets/css/site.css', 'assets/js/site.js'],
  ['products/summer.html', '../assets/css/site.css', '../assets/js/site.js'],
  ['products/autumn.html', '../assets/css/site.css', '../assets/js/site.js'],
  ['products/winter.html', '../assets/css/site.css', '../assets/js/site.js'],
];

for (const [pagePath, cssPath, scriptPath] of pages) {
  test(`${pagePath} exposes the shared accessible contact shell`, async () => {
    const html = await readFile(path.join(repoRoot, pagePath), 'utf8');

    assert.match(html, /<html\s+lang="zh-CN"/);
    assert.match(html, /<a[^>]+href="tel:18664724586"/);
    assert.match(html, /data-wechat-dialog/);
    assert.match(html, /跳到主要内容/);
    assert.match(html, /alt="启星程校服"/);
    assert.match(html, new RegExp(`href="${cssPath.replaceAll('/', '\\/')}"`));
    assert.match(html, new RegExp(`src="${scriptPath.replaceAll('/', '\\/')}"`));
    assert.equal((html.match(/<main(?:\s|>)/g) ?? []).length, 1);
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.doesNotMatch(html, /购物车|付款|提交成功|行业领先|绝不起球|完全防水/);
    assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:\/\//);
  });
}

test('shared runtime files exist and use native dialogs', async () => {
  const [css, js] = await Promise.all([
    readFile(path.join(repoRoot, 'assets/css/site.css'), 'utf8'),
    readFile(path.join(repoRoot, 'assets/js/site.js'), 'utf8'),
  ]);

  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(js, /showModal\(/);
  assert.match(js, /aria-expanded/);
});

test('delivery documentation states the GitHub Pages release path and every unresolved business fact', async () => {
  const [readme, confirmation] = await Promise.all([
    readFile(path.join(repoRoot, 'WEBSITE_README.md'), 'utf8'),
    readFile(path.join(repoRoot, 'docs/content-confirmation.md'), 'utf8'),
  ]);

  assert.match(readme, /V4/);
  assert.match(readme, /node scripts\/serve\.mjs/);
  assert.match(readme, /node tests\/browser-check\.mjs/);
  assert.match(readme, /本地.*运行|本地.*复核/);
  assert.match(readme, /GitHub Pages/);
  assert.match(readme, /main/);

  for (const unresolved of ['钢印', '破钢印哑光', '启星程', '风采文体', '工厂', '合作学校', '起订量', '交期', '售价', '库存', '配送', '换码', '检测证书']) {
    assert.match(confirmation, new RegExp(unresolved));
  }
  assert.match(confirmation, /确认发布/);
  assert.match(confirmation, /GitHub Pages/);
});

test('GitHub Pages package includes every public product detail page', async () => {
  const workflow = await readFile(path.join(repoRoot, '.github', 'workflows', 'pages.yml'), 'utf8');

  assert.match(workflow, /cp -r products _site\/products/);
  assert.match(workflow, /- 'products\/\*\*'/);
});
