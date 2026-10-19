import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const html = await readFile(path.resolve(import.meta.dirname, '..', 'products', 'summer.html'), 'utf8');

function tableRows(markup) {
  return [...markup.matchAll(/<tr\s+data-size-row="([^"]+)">([\s\S]*?)<\/tr>/g)].map((match) => ({
    size: match[1],
    cells: [...match[2].matchAll(/<t[hd][^>]*>([^<]*)<\/t[hd]>/g)].map((cell) => cell[1].trim()),
  }));
}

test('summer gallery contains confirmed short- and long-sleeve products without campus concepts', () => {
  const gallery = html.match(/<section[^>]+data-product-gallery[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const label of ['短袖 Polo', '长袖 Polo', '短裤单件', '长裤单件', '短裤整套', '长裤整套']) {
    assert.match(gallery, new RegExp(`data-gallery-label="${label}"`));
  }
  assert.match(gallery, /assets\/media\/products\/summer\/summer-polo-long-sleeve-(480|960|1080)\.webp/);
  assert.doesNotMatch(gallery, /assets\/media\/campus\//);
  assert.match(html, /assets\/media\/size\/size-summer-original\.jpg/);
});

test('summer size table preserves 14 rows and 11 season-specific columns', () => {
  const table = html.match(/<table[^>]+data-size-table="summer"[\s\S]*?<\/table>/)?.[0] ?? '';
  const rows = tableRows(table);
  const headers = [...table.matchAll(/<th[^>]*scope="col"[^>]*>([^<]*)<\/th>/g)].map((match) => match[1].trim());

  assert.equal(headers.length, 11);
  assert.deepEqual(headers, ['码数', '衣长', '胸围', '袖长', '长裤长', '短裤长', '裙长', '臀围', '腰围', '体重（斤）', '适应身高']);
  assert.equal(rows.length, 14);
  assert.deepEqual(rows.find((row) => row.size === '120')?.cells, ['120','50','80','50','70','39','34','83','48','38-46','110-120']);
  assert.deepEqual(rows.find((row) => row.size === '155')?.cells, ['155','64','99','64','92','49.5','44.5','102','62','90-98','150-155']);
  assert.deepEqual(rows.find((row) => row.size === '210')?.cells, ['210','82','132','86','119','66','61','135','84','220-240','200-210']);
});

test('summer copy avoids material claims that belong to other seasons', () => {
  assert.doesNotMatch(html, /T400|230T|南韩棉/);
  assert.match(html, /面料成分请咨询确认/);
  assert.match(html, />咨询此款</);
});
