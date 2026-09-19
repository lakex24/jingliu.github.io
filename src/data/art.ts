// Art variant, chosen at build time: ART=svg (default, generated line art),
// ART=crop (regions cut from the 11C mockup board), ART=gen (Gemini-generated
// assets in the mockup's style). Both raster variants live in src/assets/art/<variant>/.
export type ArtVariant = 'svg' | 'crop' | 'gen';
const v = process.env.ART ?? 'svg';
if (!['svg', 'crop', 'gen'].includes(v)) throw new Error(`Unknown ART variant: ${v}`);
export const ART = v as ArtVariant;

type Img = ImageMetadata;
const files = import.meta.glob<{ default: Img }>('../assets/art/*/*.{png,jpg}', { eager: true });
const pick = (name: string): Img | undefined => files[`../assets/art/${ART}/${name}`]?.default;

export const art = ART === 'svg' ? null : {
  stem: pick('stem.png'), fern: pick('fern.png'), fox: pick('fox.png'),
  tiles: { startups: pick('startups.jpg'), career: pick('career.jpg'), blogs: pick('blogs.jpg'), goodies: pick('goodies.jpg') },
};
