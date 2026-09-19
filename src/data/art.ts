// Art variant, chosen at build time with ART=…:
//   mix  (default) — crop stem/fern/fox in the hero, Gemini photos for the tiles,
//                    Gemini fox cross-fades in when the fox is hovered
//   crop           — everything cut from the 11C mockup board
//   gen            — everything Gemini-generated in the board's style
//   svg            — generated SVG line art (no raster)
// Raster assets live in src/assets/art/<crop|gen>/.
export type ArtVariant = 'mix' | 'crop' | 'gen' | 'svg';
const v = process.env.ART ?? 'mix';
if (!['mix', 'crop', 'gen', 'svg'].includes(v)) throw new Error(`Unknown ART variant: ${v}`);
export const ART = v as ArtVariant;

type Img = ImageMetadata;
const files = import.meta.glob<{ default: Img }>('../assets/art/*/*.{png,jpg}', { eager: true });
const from = (set: 'crop' | 'gen', name: string): Img | undefined => files[`../assets/art/${set}/${name}`]?.default;

const botanicals = ART === 'mix' ? 'crop' : ART;
const photos = ART === 'mix' ? 'gen' : ART;

export const art = ART === 'svg' ? null : {
  stem: from(botanicals, 'stem.png'),
  fern: from(botanicals, 'fern.png'),
  fox: from(botanicals, 'fox.png'),
  /** Shown on hover over the fox (mix variant only). */
  foxHover: ART === 'mix' ? from('gen', 'fox.png') : undefined,
  tiles: {
    startups: from(photos, 'startups.jpg'), career: from(photos, 'career.jpg'),
    blogs: from(photos, 'blogs.jpg'), goodies: from(photos, 'goodies.jpg'),
  },
};

// Photos for the four section links (home tiles and the phone-size home nav),
// keyed by route. Raster variants use the board-style nature shots; the svg
// variant falls back to Jing's own 2014 photo-diary shots.
import diaryStartups from '../assets/tiles/startups.jpg';
import diaryCareer from '../assets/tiles/career.jpg';
import diaryBlogs from '../assets/tiles/blogs.jpg';
import diaryGoodies from '../assets/tiles/goodies.jpg';

export const tilePhotos: Record<string, { img: Img; alt: string }> = art?.tiles.startups
  ? {
      '/startups/': { img: art.tiles.startups!, alt: 'A seedling breaking through dark soil in morning light' },
      '/career/': { img: art.tiles.career!, alt: 'A footpath winding through a sunlit pine forest' },
      '/blogs/': { img: art.tiles.blogs!, alt: 'A luna moth resting among leaves and white blossoms' },
      '/goodies/': { img: art.tiles.goodies!, alt: 'Small mushrooms in moss beside an open book' },
    }
  : {
      '/startups/': { img: diaryStartups, alt: 'Sunlight breaking through clouds over Lake Zurich' },
      '/career/': { img: diaryCareer, alt: 'Bone-like stone columns of Casa Batlló, Barcelona' },
      '/blogs/': { img: diaryBlogs, alt: 'Birds nesting in the carved walls of the Alhambra' },
      '/goodies/': { img: diaryGoodies, alt: 'A plate of fried fish in a plant-filled courtyard café' },
    };
