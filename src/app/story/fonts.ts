import {
  Cormorant_Garamond,
  Playfair_Display,
  Libre_Baskerville,
  EB_Garamond,
  Lora,
  Fraunces,
  DM_Serif_Display,
  Abril_Fatface,
  Source_Sans_3,
  Inter,
  Jost,
  Nunito,
  Raleway,
  Caveat,
  Dancing_Script,
  Special_Elite,
} from 'next/font/google'

// One loader per entry in src/lib/story/fonts.ts. `preload: false` so the
// page carries no preload links; a browser fetches a family only when text
// uses it, so visitors download the two she chose.
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-cormorant' })
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-playfair' })
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-libre-baskerville' })
const ebGaramond = EB_Garamond({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-eb-garamond' })
const lora = Lora({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-lora' })
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-fraunces' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-dm-serif' })
const abril = Abril_Fatface({ subsets: ['latin'], weight: ['400'], display: 'swap', preload: false, variable: '--font-abril' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-source-sans' })
const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-inter-story' })
const jost = Jost({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-jost-story' })
const nunito = Nunito({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-nunito' })
const raleway = Raleway({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-raleway' })
const caveat = Caveat({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-caveat' })
const dancing = Dancing_Script({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dancing' })
const specialElite = Special_Elite({ subsets: ['latin'], weight: ['400'], display: 'swap', preload: false, variable: '--font-special-elite' })

export const STORY_FONT_CLASSES = [
  cormorant, playfair, libreBaskerville, ebGaramond, lora, fraunces, dmSerif, abril,
  sourceSans, inter, jost, nunito, raleway, caveat, dancing, specialElite,
]
  .map((f) => f.variable)
  .join(' ')
