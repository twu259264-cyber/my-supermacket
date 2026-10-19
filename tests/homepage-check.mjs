import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const html = await readFile(path.resolve(import.meta.dirname, '..', 'index.html'), 'utf8');

test('homepage tells the approved brand story and exposes both primary paths', () => {
  assert.match(html, /启少年星光，赴远大征程/);
  assert.match(html, />查看校服</);
  assert.match(html, />学校批量定制</);
  assert.match(html, /30\s*年校服生产经验/);
  assert.match(html, /校园概念视觉/);
  assert.doesNotMatch(html, /<form(?:\s|>)/);
});

test('homepage exposes exactly three seasonal products and a compact three-image lookbook', () => {
  assert.equal((html.match(/data-season-card=/g) ?? []).length, 3);
  assert.equal((html.match(/data-home-lookbook=/g) ?? []).length, 3);
  for (const href of ['products/summer.html', 'products/autumn.html', 'products/winter.html']) {
    assert.match(html, new RegExp(`href="${href.replaceAll('/', '\\/')}"`));
  }
});

test('homepage includes every approved narrative section without a school list', () => {
  for (const id of ['hero', 'uniforms', 'featured-winter', 'craft', 'lookbook', 'custom', 'about', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing homepage section #${id}`);
  }
  assert.doesNotMatch(html, /合作学校|服务学校|学校案例|客户数量/);
});

test('winter feature uses real product details and cautious material language', () => {
  for (const text of ['T400', '弹力', '抗撕裂', '防泼水', '230T', 'SBS 浔兴拉链', '内里全包边']) {
    assert.match(html, new RegExp(text));
  }
  assert.doesNotMatch(html, /完全防水|永久防水|百分百防水/);
});
