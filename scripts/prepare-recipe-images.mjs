import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Original dish photographs are bundled locally so recipe cards never fall
// back to cartoon SVG illustrations when a remote host is unavailable.
const photos = [
  { file: 'public/images/recipes/chicken-pasta-white-sauce.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Chicken_Pasta_in_White_Sauce.jpg', label: 'Chicken Pasta in White Sauce (TourismSchool, CC BY-SA 4.0)' },
  { file: 'public/images/recipes/mashed-potato-eggs.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Mashed_potatoes%2C_eggs%2C_beans.jpg', label: 'Mashed potatoes, eggs, beans (MOs810, CC BY-SA 3.0)' },
  { file: 'public/images/recipes/baked-eggs-vegetables.webp', url: 'https://www.cairo24.com/Upload/libfiles/164/5/122.jpg', label: 'Egyptian baked eggs with vegetables' },
  { file: 'public/images/recipes/feteer-meshaltet.webp', url: 'https://www.cairo24.com/Upload/libfiles/130/7/624.jpg', label: 'Egyptian feteer meshaltet' },
  { file: 'public/images/recipes/molokhia-egyptian.jpg', url: 'https://e.his-j.com/images/area7/egy/w944/meal/egy_molokheiyasoup_01.jpg', label: 'Egyptian molokhia' },
  { file: 'public/images/recipes/basbousa-egyptian.jpg', url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Basboosa.jpg', label: 'Egyptian basbousa (Stu Spivack, CC BY-SA 2.0)' },
  { file: 'public/images/recipes/taameya-egyptian.webp', url: 'https://afrotools.com/assets/img/kitchen/taameya-eg.webp', label: 'Egyptian taameya' },
  { file: 'public/images/recipes/mahshi-mixed-egyptian.webp', url: 'https://afrotools.com/assets/img/kitchen/mahshi-eg.webp', label: 'Egyptian mixed mahshi' },
  { file: 'public/images/recipes/bessara-egyptian.jpg', url: 'https://www.vetogate.com/Upload/libfiles/453/7/811.jpg', label: 'Egyptian bessara' },
  { file: 'public/images/recipes/om-ali-egyptian.jpg', url: 'https://scoopempire.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-31-at-4.06.18-PM.jpeg', label: 'Egyptian Om Ali' },
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
    // Download the original photograph when it is not already cached.
  }
  const response = await fetch(photo.url, {
    headers: { 'User-Agent': 'TadbeeraRecipePhotoBuild/1.0' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Could not download ${photo.label}: HTTP ${response.status}`);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const expectedType = photo.file.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  if (!contentType.startsWith(expectedType)) {
    throw new Error(`Unexpected content type for ${photo.label}: ${contentType}; expected ${expectedType}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10_000) throw new Error(`Downloaded image is unexpectedly small for ${photo.label}: ${bytes.length} bytes`);
  await writeFile(destination, bytes);
  console.log(`Bundled original photograph ${photo.label}: ${bytes.length} bytes -> ${photo.file}`);
}
