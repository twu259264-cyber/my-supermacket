import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const html = await readFile(path.resolve(import.meta.dirname, '..', 'products', 'autumn.html'), 'utf8');

function rowsFrom(table) {
  return [...table.matchAll(/<tr\s+data-size-row="([^"]+)">([\s\S]*?)<\/tr>/g)].map((match) => ({
    size: match[1],
    cells: [...match[2].matchAll(/<t[hd][^>]*>([^<]*)<\/t[hd]>/g)].map((cell) => cell[1].trim()),
  }));
}

test('autumn page uses corresponding real jacket and craft photos', () => {
  const gallery = html.match(/<section[^>]+data-product-gallery[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const label of ['正面完整图', '背面完整图', '领口', '口袋', '拉链', '袖口', '下摆']) {
    assert.match(gallery, new RegExp(`data-gallery-label="${label}"`));
  }
  assert.match(html, /南韩棉/);
  assert.match(html, /assets\/media\/size\/size-autumn-original\.jpg/);
});

test('autumn size table preserves 14 rows and 9 season-specific columns', () => {
  const table = html.match(/<table[^>]+data-size-table="autumn"[\s\S]*?<\/table>/)?.[0] ?? '';
  const rows = rowsFrom(table);
  const headers = [...table.matchAll(/<th[^>]*scope="col"[^>]*>([^<]*)<\/th>/g)].map((match) => match[1].trim());
  assert.deepEqual(headers, ['码数', '衣长', '胸围', '肩宽', '袖长', '裤长', '臀围', '体重（斤）', '适应身高']);
  assert.equal(rows.length, 14);
  assert.deepEqual(rows.find((row) => row.size === '120#')?.cells, ['120#','55','90','37.2','46.5','72','84','38-46','110-120']);
  assert.deepEqual(rows.find((row) => row.size === '170#')?.cells, ['170#','75','124','50.5','61.5','102','114','115-140','165-170']);
  assert.deepEqual(rows.find((row) => row.size === '210#')?.cells, ['210#','90','156','62.5','73.5','120','138','220-240','201-210']);
});

test('autumn copy does not inherit winter material claims', () => {
  assert.doesNotMatch(html, /T400|230T|防泼水/);
  assert.match(html, />咨询此款</);
});
