import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const photos = [
  { file: 'public/images/recipes/chicken-pasta-white-sauce.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Chicken_Pasta_in_White_Sauce.jpg', label: 'Chicken Pasta in White Sauce (TourismSchool, CC BY-SA 4.0)' },
  { file: 'public/images/recipes/mashed-potato-eggs.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Mashed_potatoes%2C_eggs%2C_beans.jpg', label: 'Mashed potatoes, eggs, beans (MOs810, CC BY-SA 3.0)' },
];

for (const photo of photos) {
  const destination = resolve(photo.file);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await stat(destination);
    if (existing.size >= 10_000) {
      console.log(`Using cached ${photo.label}: ${existing.size} bytes`);
      continue;
    }
  } catch {
    // Download the image when it is not already bundled in the workspace.
  }
  const response = await fetch(photo.url, { headers: { 'User-Agent': 'TadbeeraRecipePhotoBuild/1.0' }, redirect: 'follow' });
  if (!response.ok) throw new Error(`Could not download ${photo.label}: HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/jpeg')) throw new Error(`Unexpected content type for ${photo.label}: ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10_000) throw new Error(`Downloaded image is unexpectedly small for ${photo.label}: ${bytes.length} bytes`);
  await writeFile(destination, bytes);
  console.log(`Bundled ${photo.label}: ${bytes.length} bytes -> ${photo.file}`);
}
