import { readdir, writeFile } from 'node:fs/promises';
import { extname, join, parse, posix } from 'node:path';

const imageDir = join(process.cwd(), 'assets', 'players');
const supported = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const files = await readdir(imageDir, { withFileTypes: true });

const players = files
  .filter((entry) => entry.isFile() && supported.has(extname(entry.name).toLowerCase()))
  .map((entry) => {
    const filename = entry.name;
    const basename = parse(filename).name;
    const separator = basename.indexOf('_');
    if (separator < 1 || separator === basename.length - 1) return null;
    const name = basename.slice(0, separator).trim();
    const roman = basename.slice(separator + 1).trim();
    const id = roman.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { id: id || encodeURIComponent(name), name, roman, photo: posix.join('assets/players', filename) };
  })
  .filter(Boolean)
  .sort((a, b) => a.roman.localeCompare(b.roman, 'en'));

await writeFile('players.json', `${JSON.stringify(players, null, 2)}\n`, 'utf8');
console.log(`Generated players.json with ${players.length} player(s).`);
