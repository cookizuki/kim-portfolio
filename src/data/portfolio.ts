export const profile = {
  name: 'Kim Maturan',
  email: 'kimmaturan1111@gmail.com',
  github: 'https://github.com/cookizuki',
  linkedin: 'https://www.linkedin.com/in/kim-maturan-6b5331386/',
  photography: 'https://cookiclickz.my.canva.site/kim-maturan',
  bio: 'I’m Kim Maturan, a third-year Computer Science student at the University of Cabuyao and an aspiring software developer. Alongside building software, I’m a founder, graphic designer, and video editor with an interest in photography.',
  // Public URL; set to null to hide the resume links.
  resume: '/documents/kim-maturan-resume.pdf' as string | null,
};
export interface ProjectImage { src: string | null; alt: string; caption: string; width?: number; height?: number; }
export interface Project {
  name: string; description: string; stack: string; headline?: string; composition?: string;
  images: ProjectImage[]; liveUrl: string | null; codeUrl: string | null; contribution: string | null;
}
export const projects: Project[] = [
  { name: 'WalangBrownout', headline: 'A clearer view of every item.', composition: 'inventory', description: 'An inventory system bringing receiving, stock visibility, and day-to-day workflows together.', stack: 'React / TypeScript', images: [
  {
    "src": "/images/projects/walangbrownout-inventory.png",
    "caption": "Inventory management",
    "alt": "WalangBrownout inventory table showing products, stock levels, reorder points, and color-coded status indicators.",
    "width": 1387,
    "height": 789
  },
  {
    "src": "/images/projects/walangbrownout-login.png",
    "caption": "Login page",
    "alt": "WalangBrownout login form with email and password fields beside a grid of electronic components.",
    "width": 1397,
    "height": 784
  }
], liveUrl: null, codeUrl: 'https://github.com/cookizuki/WalangBrownout', contribution: null },
  { name: 'KNR NFC Cards', headline: 'A connection. Beyond the card.', composition: 'profile', description: 'Digital profiles and NFC cards that make sharing your online presence simple.', stack: 'Next.js / Supabase', images: [
{
    "src": "/images/projects/knr-editor.png",
    "caption": "Profile editor",
    "alt": "KNR profile editor with photo upload and profile fields beside a live mobile profile preview.",
    "width": 1381,
    "height": 786
  },
{
    "src": "/images/projects/knr-mobile.png",
    "caption": "Public digital profile",
    "alt": "KNR public digital profile for Kim Maturan on a mobile browser, with Save Contact, Call, Email, and social links.",
    "width": 1125,
    "height": 2314
},
{
    "src": "/images/projects/knr-landingpage.png",
    "caption": "Landing page",
    "alt": "KNR NFC business card landing page with a black card mockup and links to the collection and digital profile.",
    "width": 1379,
    "height": 786
  }
], liveUrl: 'https://knr-cards.vercel.app', codeUrl: null, contribution: null },
  { name: 'PinaCall', headline: 'From application to the next step.', composition: 'review', description: 'A school portal with an application and enrollment workflow.', stack: 'Laravel / Vue', images: [
{
    "src": "/images/projects/pinacall-review.png",
    "caption": "Application review",
    "alt": "PinaCall registrar dashboard with application totals, filters, and a table of applicants with evaluation actions.",
    "width": 1382,
    "height": 789
  },
{
    "src": "/images/projects/pinacall-login.png",
    "caption": "Login page",
    "alt": "PinaCall university portal with an email and password sign-in form beside academic service information.",
    "width": 1377,
    "height": 788
  }
], liveUrl: 'https://pina-call.vercel.app', codeUrl: null, contribution: null },
];
export const experience = [
  { role: 'Founder', organization: 'KNR Collectives', type: 'Entrepreneurship', dates: '', description: '' },
  { role: 'Co-Lead & Executive Assistant', organization: 'AWS SBG · University of Cabuyao', type: 'Student leadership', dates: '', description: '' },
  { role: 'Graphic Designer & Video Editor', organization: '', type: 'Creative work', dates: '', description: '' },
];
export const certifications = [
  { title: 'AWS AI Practitioner Challenge', date: '2026-06-23', dateLabel: 'June 23, 2026', issuer: '', verificationUrl: 'https://www.udacity.com/certificate/e/51a17c90-2998-11f1-aa43-2fbe0600f13b' as string | null },
];
export const toolkit = [
  { title: 'Tech stack', subtitle: 'LANGUAGES / FRAMEWORKS / DATA', rows: [
    { category: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Tailwind CSS', 'Bootstrap'] },
    { category: 'Backend & apps', items: ['PHP', 'Laravel', 'Next.js', 'Inertia.js', 'Java', 'Python'] },
    { category: 'Data & services', items: ['MySQL', 'Supabase'] },
  ] },
  { title: 'My toolkit', subtitle: 'FROM FIRST IDEA TO DEPLOYMENT', rows: [
    { category: 'Development', items: ['VS Code', 'Eclipse', 'Git', 'GitHub', 'Docker', 'Vite', 'npm', 'phpMyAdmin', 'MySQL Workbench'] },
    { category: 'Deployment', items: ['Vercel', 'Railway', 'Render'] },
    { category: 'Creative & production', items: ['Figma', 'Adobe Lightroom', 'Adobe Premiere Pro', 'vMix', 'Photography', 'Video editing'] },
  ] },
];
// Photography keeps original colors, framing, and natural image dimensions.
export const creative: { title: string; image: string; alt: string; width: number; height: number }[] = [
  { title: 'Flower', image: '/images/photography/flower.jpg', alt: 'A vivid purple flower with long curved stamens against green leaves, framed by a white border.', width: 1440, height: 1748 },
  { title: 'Kite', image: '/images/photography/kite.jpg', alt: 'A small multicolored kite with trailing ribbons against a deep blue sky, in an instant-photo-style white frame.', width: 720, height: 900 },
  { title: 'Withered', image: '/images/photography/withered.jpg', alt: 'Withered leaves on thin stems in front of a building with a green-trimmed column, windows, and red railings, seen between blurred foreground bars.', width: 1080, height: 1313 },
];
