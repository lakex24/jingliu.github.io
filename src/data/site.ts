// Site-wide strings. Items marked PLACEHOLDER came from the 11C mockup board
// and must be confirmed or replaced by Jing before launch.
export const site = {
  name: 'Jing Liu',
  wordmark: 'JING LIU',
  url: 'https://jingliu.mind-pixels.com',
  description: 'Jing Liu — startups, career, writing and small joys.',
  welcome: 'Welcome to Jing’s personal space', // home masthead line (replaces the wordmark)
  footerLine: 'Jing Liu', 
  nav: [
    { href: '/startups/', label: 'Startups', tagline: 'Bolder tomorrows' }, // tagline PLACEHOLDER
    { href: '/career/', label: 'Career', tagline: 'A wider path' }, // tagline PLACEHOLDER
    { href: '/blogs/', label: 'Blogs', tagline: 'Thoughts in the wild' }, // tagline PLACEHOLDER
    { href: '/goodies/', label: 'Goodies', tagline: 'Little joys, freely shared' }, // tagline PLACEHOLDER
  ],
  social: {
    linkedin: 'https://www.linkedin.com/in/jingliu2024/',
    scholar: 'https://scholar.google.com/citations?user=fv8F6CEAAAAJ&hl=en',
  },
} as const;
