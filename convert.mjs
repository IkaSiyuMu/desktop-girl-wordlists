import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(__dirname, '..', 'english-vocabulary', 'json_original', 'json-full');
const OUTPUT = __dirname;

const LIST_MAP = [
  { src: 'CET4_1.json', id: 'cet4' }, { src: 'CET4_2.json', id: 'cet4' }, { src: 'CET4_3.json', id: 'cet4' },
  { src: 'CET6_1.json', id: 'cet6' }, { src: 'CET6_2.json', id: 'cet6' }, { src: 'CET6_3.json', id: 'cet6' },
  { src: 'KaoYan_1.json', id: 'kaoyan' }, { src: 'KaoYan_2.json', id: 'kaoyan' }, { src: 'KaoYan_3.json', id: 'kaoyan' },
  { src: 'TOEFL_2.json', id: 'toefl' }, { src: 'TOEFL_3.json', id: 'toefl' },
  { src: 'IELTS_2.json', id: 'ielts' }, { src: 'IELTS_3.json', id: 'ielts' },
  { src: 'GMAT_2.json', id: 'gmat' }, { src: 'GMAT_3.json', id: 'gmat' },
  { src: 'SAT_2.json', id: 'sat' }, { src: 'SAT_3.json', id: 'sat' },
  { src: 'GRE_2.json', id: 'gre' }, { src: 'GRE_3.json', id: 'gre' },
];

function convertEntry(raw) {
  const word = raw?.headWord || '';
  const content = raw?.content?.word?.content || {};
  const trans = content.trans || [];
  const sentences = content.sentence?.sentences || [];

  // Build translation string
  const transStr = trans.map(t => {
    const pos = t.pos || '';
    const cn = t.tranCn || '';
    return pos ? `${pos}. ${cn}` : cn;
  }).join('；');

  // Pick first sentence as example
  let example = '';
  if (sentences.length > 0) {
    const s = sentences[0];
    example = `${s.sContent || ''} ${s.sCn || ''}`.trim();
  }

  return {
    word,
    phonetic_us: content.usphone ? `/${content.usphone}/` : '',
    phonetic_uk: content.ukphone ? `/${content.ukphone}/` : '',
    translation: transStr,
    example,
  };
}

// Group by list_id
const lists = {};
for (const item of LIST_MAP) {
  const filePath = join(SOURCE, item.src);
  if (!existsSync(filePath)) {
    console.log(`⚠️  Not found: ${item.src}`);
    continue;
  }
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const entries = raw.map(convertEntry).filter(e => e.word);
  console.log(`📖 ${item.src}: ${entries.length} words`);

  if (!lists[item.id]) lists[item.id] = [];
  lists[item.id] = lists[item.id].concat(entries);
}

// Write output files
for (const [id, words] of Object.entries(lists)) {
  const outPath = join(OUTPUT, `${id}.json`);
  writeFileSync(outPath, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`✅ ${id}.json: ${words.length} words written`);
}

// Update manifest
const manifest = Object.entries(lists).map(([id, words]) => ({
  id,
  name: { cet4: '四级词汇', cet6: '六级词汇', kaoyan: '考研词汇', ielts: '雅思词汇', toefl: '托福词汇', gmat: 'GMAT词汇', sat: 'SAT词汇', gre: 'GRE词汇' }[id] || id,
  description: `${words.length} 词`,
  size: words.length,
  url: `https://raw.githubusercontent.com/IkaSiyuMu/desktop-girl-wordlists/main/${id}.json`,
}));

writeFileSync(join(OUTPUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`\n📋 Manifest updated: ${manifest.length} word lists`);
