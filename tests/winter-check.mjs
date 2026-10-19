import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const html = await readFile(path.resolve(import.meta.dirname, '..', 'products', 'winter.html'), 'utf8');

function rowsFrom(table) {
  return [...table.matchAll(/<tr\s+data-size-row="([^"]+)">([\s\S]*?)<\/tr>/g)].map((match) => ({
    size: match[1],
    cells: [...match[2].matchAll(/<t[hd][^>]*>([^<]*)<\/t[hd]>/g)].map((cell) => cell[1].trim()),
  }));
}

test('winter gallery separates the complete outfit from corresponding construction details', () => {
  const gallery = html.match(/<section[^>]+data-product-gallery[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const label of ['完整穿搭图', '外壳正面', '外壳背面', '里布', '抓绒内胆', '拉链', '包边']) {
    assert.match(gallery, new RegExp(`data-gallery-label="${label}"`));
  }
  assert.match(html, /assets\/media\/size\/size-winter-original\.jpg/);
});

test('winter material and workmanship claims remain specific and bounded', () => {
  for (const copy of ['T400破卡', '弹力', '抗撕裂', '防泼水', '230T高密度涤塔夫', '哑光', '顺滑', 'SBS浔兴拉链', '内里全包边']) {
    assert.match(html, new RegExp(copy));
  }
  assert.doesNotMatch(html, /完全防水|绝不起球|行业领先/);
  assert.match(html, />咨询此款</);
});

test('winter size table preserves 14 rows and 12 season-specific columns', () => {
  const table = html.match(/<table[^>]+data-size-table="winter"[\s\S]*?<\/table>/)?.[0] ?? '';
  const rows = rowsFrom(table);
  const headers = [...table.matchAll(/<th[^>]*scope="col"[^>]*>([^<]*)<\/th>/g)].map((match) => match[1].trim());
  assert.deepEqual(headers, ['码数', '衣长', '胸围', '领围', '袖长', '长裤长', '短裤长', '裙长', '臀围', '腰围', '体重（斤）', '适应身高']);
  assert.equal(rows.length, 14);
  assert.deepEqual(rows.find((row) => row.size === '120')?.cells, ['120','55','90','36.5','25','72','39','34','84','24','38-46','110-120']);
  assert.deepEqual(rows.find((row) => row.size === '170')?.cells, ['170','75','124','42.5','35','102','54','49','114','34','115-140','166-170']);
  assert.deepEqual(rows.find((row) => row.size === '210')?.cells, ['210','90','156','48.5','43','120','66','61','138','42','221-240','201-210']);
});
