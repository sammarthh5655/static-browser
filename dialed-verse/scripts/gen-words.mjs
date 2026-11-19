// Regenerates the five-letter guess dictionary from the MIT-licensed `word-list` package (devDependency).
import { readFileSync, writeFileSync } from 'node:fs';
const words = readFileSync(new URL('../node_modules/word-list/words.txt', import.meta.url), 'utf8').split('\n').filter((w) => /^[a-z]{5}$/.test(w));
writeFileSync(new URL('../src/games/_data/valid5.txt', import.meta.url), words.join(''));
console.log(`${words.length} five-letter words`);
