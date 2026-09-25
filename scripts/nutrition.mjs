// Extracts per-100 g nutrient values for every food from USDA FoodData Central
// (SR Legacy, April 2018 release, public domain) into data/nutrition.json.
//
// Usage:
//   curl -LO https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
//   unzip FoodData_Central_sr_legacy_food_csv_2018-04.zip -d sr
//   node scripts/nutrition.mjs sr/FoodData_Central_sr_legacy_food_csv_2018-04

import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/nutrition.mjs <path-to-extracted-sr-legacy-csv-folder>');
  process.exit(1);
}

// food id -> FDC id. Picked to match the form a pet would actually be offered
// (raw produce, plain cooked grains, unsalted popcorn, hard-boiled egg ...).
const FDC = {
  apple: 171688, banana: 173944, blueberry: 171711, strawberry: 167762, raspberry: 167755,
  grape: 174683, raisin: 168165, watermelon: 167765, cantaloupe: 169092, orange: 169097,
  mango: 169910, pineapple: 169124, pear: 169118, cherry: 171719, peach: 169928,
  kiwi: 168153, avocado: 171705, coconut: 170169,
  carrot: 170393, broccoli: 170379, cucumber: 168409, tomato: 170457, 'bell-pepper': 170108,
  chili: 170106, celery: 169988, cabbage: 169975, cauliflower: 169986, zucchini: 169291,
  'sweet-potato': 168482, potato: 170026, pumpkin: 168448, peas: 170419, corn: 169998,
  'green-beans': 169961, onion: 170000, garlic: 169230, mushroom: 169251, rhubarb: 167758,
  romaine: 169247, iceberg: 169248, spinach: 168462, kale: 168421, dandelion: 169226,
  parsley: 170416, cilantro: 169997,
  oats: 173904, rice: 169704, bread: 172688, pasta: 169737, popcorn: 170246, millet: 169702,
  'sunflower-seeds': 170562, 'pumpkin-seeds': 170556, peanuts: 172430, almonds: 170567,
  walnuts: 170187, cashews: 170162,
  egg: 173424, chicken: 171477, tofu: 172475, cheese: 173414, yogurt: 171284,
  chocolate: 170273, coffee: 171890, alcohol: 168746, chips: 169677, candy: 167990,
};

const NUTRIENTS = {
  1051: 'water_g', 1008: 'energy_kcal', 1003: 'protein_g', 1004: 'fat_g', 1079: 'fiber_g',
  2000: 'sugar_g', 1087: 'calcium_mg', 1091: 'phosphorus_mg', 1093: 'sodium_mg',
  1106: 'vitaminA_ug_rae', 1162: 'vitaminC_mg', 1057: 'caffeine_mg', 1058: 'theobromine_mg',
  1018: 'alcohol_g',
};

function parseLine(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const wanted = new Map(Object.entries(FDC).map(([id, fdc]) => [String(fdc), id]));
const descriptions = {};
for (const line of readFileSync(join(dir, 'food.csv'), 'utf8').split('\n').slice(1)) {
  if (!line) continue;
  const [fdc, , desc] = parseLine(line);
  if (wanted.has(fdc)) descriptions[fdc] = desc;
}

const values = {};
const rl = createInterface({ input: createReadStream(join(dir, 'food_nutrient.csv')) });
for await (const line of rl) {
  const [, fdc, nutrient, amount] = parseLine(line);
  if (!wanted.has(fdc) || !NUTRIENTS[nutrient]) continue;
  (values[fdc] ??= {})[NUTRIENTS[nutrient]] = Number(amount);
}

const foods = {};
for (const [id, fdc] of Object.entries(FDC)) {
  const v = values[String(fdc)] ?? {};
  const per100g = {};
  for (const key of Object.values(NUTRIENTS)) if (key in v) per100g[key] = v[key];
  if (per100g.calcium_mg != null && per100g.phosphorus_mg) {
    per100g.ca_p_ratio = Math.round((per100g.calcium_mg / per100g.phosphorus_mg) * 100) / 100;
  }
  foods[id] = { fdcId: fdc, usdaDescription: descriptions[String(fdc)] ?? null, per100g };
}

const out = {
  source: {
    name: 'USDA FoodData Central, SR Legacy (April 2018)',
    url: 'https://fdc.nal.usda.gov/',
    license: 'Public domain (U.S. Government work)',
  },
  basis: 'per 100 g edible portion',
  foods,
};
writeFileSync(new URL('../data/nutrition.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${Object.keys(foods).length} foods`);
