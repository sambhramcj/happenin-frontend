/**
 * Curated Google Fonts for Certificate Generation
 * All fonts are free, commercial-safe, and embed cleanly in PDFs
 * 
 * IMPORTANT: Only these fonts are allowed for certificate names
 */

export type FontCategory = "formal" | "modern" | "display" | "script" | "minimal";

export interface CertificateFont {
  name: string;
  value: string; // Font family name for CSS/PDF
  category: FontCategory;
  googleFontsUrl: string; // URL to load font from Google Fonts
  weight?: number; // Default weight
  recommended?: boolean; // Highlight as recommended
}

/**
 * 100 Curated Google Fonts for Certificates
 * Organized by category for better UX
 */
export const CERTIFICATE_FONTS: CertificateFont[] = [
  // ============================================
  // 🎓 FORMAL / CERTIFICATE (CLASSIC & ELEGANT)
  // ============================================
  {
    name: "Playfair Display",
    value: "Playfair Display",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap",
    weight: 700,
    recommended: true,
  },
  {
    name: "Libre Baskerville",
    value: "Libre Baskerville",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
    weight: 700,
    recommended: true,
  },
  {
    name: "Crimson Text",
    value: "Crimson Text",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Spectral",
    value: "Spectral",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "EB Garamond",
    value: "EB Garamond",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Cormorant Garamond",
    value: "Cormorant Garamond",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Cinzel",
    value: "Cinzel",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Cardo",
    value: "Cardo",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Lora",
    value: "Lora",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Merriweather",
    value: "Merriweather",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap",
    weight: 700,
  },
  {
    name: "Vollkorn",
    value: "Vollkorn",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Vollkorn:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Gentium Plus",
    value: "Gentium Plus",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Gentium+Plus:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Prata",
    value: "Prata",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Prata&display=swap",
    weight: 400,
  },
  {
    name: "Old Standard TT",
    value: "Old Standard TT",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Old+Standard+TT:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Domine",
    value: "Domine",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Domine:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Noticia Text",
    value: "Noticia Text",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Noticia+Text:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Tinos",
    value: "Tinos",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Arvo",
    value: "Arvo",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Neuton",
    value: "Neuton",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Neuton:wght@400;700;800&display=swap",
    weight: 700,
  },
  {
    name: "Alegreya",
    value: "Alegreya",
    category: "formal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700;900&display=swap",
    weight: 700,
  },

  // ============================================
  // 🧠 MODERN / SANS-SERIF (SAFE & POPULAR)
  // ============================================
  {
    name: "Inter",
    value: "Inter",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
    weight: 700,
    recommended: true,
  },
  {
    name: "Poppins",
    value: "Poppins",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
    weight: 600,
    recommended: true,
  },
  {
    name: "Montserrat",
    value: "Montserrat",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap",
    weight: 700,
    recommended: true,
  },
  {
    name: "DM Sans",
    value: "DM Sans",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
    weight: 700,
  },
  {
    name: "Manrope",
    value: "Manrope",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Source Sans 3",
    value: "Source Sans 3",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Work Sans",
    value: "Work Sans",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Rubik",
    value: "Rubik",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Noto Sans",
    value: "Noto Sans",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Open Sans",
    value: "Open Sans",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Lato",
    value: "Lato",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap",
    weight: 700,
  },
  {
    name: "Nunito",
    value: "Nunito",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Mulish",
    value: "Mulish",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Raleway",
    value: "Raleway",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Urbanist",
    value: "Urbanist",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Outfit",
    value: "Outfit",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Karla",
    value: "Karla",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Karla:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Heebo",
    value: "Heebo",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "IBM Plex Sans",
    value: "IBM Plex Sans",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Figtree",
    value: "Figtree",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Cabin",
    value: "Cabin",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cabin:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Assistant",
    value: "Assistant",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Hind",
    value: "Hind",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Hind:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Oxygen",
    value: "Oxygen",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Oxygen:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Quicksand",
    value: "Quicksand",
    category: "modern",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap",
    weight: 700,
  },

  // ============================================
  // 🔥 DISPLAY / BOLD (HEAD-TURNING NAMES)
  // ============================================
  {
    name: "Bebas Neue",
    value: "Bebas Neue",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    weight: 400,
    recommended: true,
  },
  {
    name: "Anton",
    value: "Anton",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Anton&display=swap",
    weight: 400,
  },
  {
    name: "Oswald",
    value: "Oswald",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Archivo Black",
    value: "Archivo Black",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap",
    weight: 400,
  },
  {
    name: "League Spartan",
    value: "League Spartan",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Abril Fatface",
    value: "Abril Fatface",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap",
    weight: 400,
  },
  {
    name: "Alfa Slab One",
    value: "Alfa Slab One",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap",
    weight: 400,
  },
  {
    name: "Playfair Display SC",
    value: "Playfair Display SC",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display+SC:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Exo 2",
    value: "Exo 2",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700;900&display=swap",
    weight: 700,
  },
  {
    name: "Bungee",
    value: "Bungee",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bungee&display=swap",
    weight: 400,
  },
  {
    name: "Teko",
    value: "Teko",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Teko:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Staatliches",
    value: "Staatliches",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Staatliches&display=swap",
    weight: 400,
  },
  {
    name: "Passion One",
    value: "Passion One",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&display=swap",
    weight: 700,
  },
  {
    name: "Black Ops One",
    value: "Black Ops One",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap",
    weight: 400,
  },
  {
    name: "Russo One",
    value: "Russo One",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Russo+One&display=swap",
    weight: 400,
  },
  {
    name: "Changa One",
    value: "Changa One",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Changa+One&display=swap",
    weight: 400,
  },
  {
    name: "Secular One",
    value: "Secular One",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Secular+One&display=swap",
    weight: 400,
  },
  {
    name: "Yanone Kaffeesatz",
    value: "Yanone Kaffeesatz",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Yanone+Kaffeesatz:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Saira Condensed",
    value: "Saira Condensed",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "DM Serif Display",
    value: "DM Serif Display",
    category: "display",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
    weight: 400,
  },

  // ============================================
  // ✍️ SCRIPT / SIGNATURE (LIMITED USE)
  // ============================================
  {
    name: "Great Vibes",
    value: "Great Vibes",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap",
    weight: 400,
    recommended: true,
  },
  {
    name: "Allura",
    value: "Allura",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Allura&display=swap",
    weight: 400,
  },
  {
    name: "Alex Brush",
    value: "Alex Brush",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap",
    weight: 400,
  },
  {
    name: "Dancing Script",
    value: "Dancing Script",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Sacramento",
    value: "Sacramento",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Sacramento&display=swap",
    weight: 400,
  },
  {
    name: "Pacifico",
    value: "Pacifico",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
    weight: 400,
  },
  {
    name: "Satisfy",
    value: "Satisfy",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Satisfy&display=swap",
    weight: 400,
  },
  {
    name: "Parisienne",
    value: "Parisienne",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Parisienne&display=swap",
    weight: 400,
  },
  {
    name: "Courgette",
    value: "Courgette",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Courgette&display=swap",
    weight: 400,
  },
  {
    name: "Kaushan Script",
    value: "Kaushan Script",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap",
    weight: 400,
  },
  {
    name: "Yellowtail",
    value: "Yellowtail",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Yellowtail&display=swap",
    weight: 400,
  },
  {
    name: "Marck Script",
    value: "Marck Script",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Marck+Script&display=swap",
    weight: 400,
  },
  {
    name: "Tangerine",
    value: "Tangerine",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tangerine:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Herr Von Muellerhoff",
    value: "Herr Von Muellerhoff",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&display=swap",
    weight: 400,
  },
  {
    name: "Rochester",
    value: "Rochester",
    category: "script",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Rochester&display=swap",
    weight: 400,
  },

  // ============================================
  // 🧪 MINIMAL / TECH / CLEAN
  // ============================================
  {
    name: "JetBrains Mono",
    value: "JetBrains Mono",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Space Grotesk",
    value: "Space Grotesk",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "IBM Plex Mono",
    value: "IBM Plex Mono",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Red Hat Display",
    value: "Red Hat Display",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;700;900&display=swap",
    weight: 700,
  },
  {
    name: "Recursive",
    value: "Recursive",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Recursive:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "PT Sans",
    value: "PT Sans",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Ubuntu",
    value: "Ubuntu",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Fira Sans",
    value: "Fira Sans",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600;700&display=swap",
    weight: 600,
  },
  {
    name: "Overpass",
    value: "Overpass",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Overpass:wght@400;700;900&display=swap",
    weight: 700,
  },
  {
    name: "Public Sans",
    value: "Public Sans",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Archivo",
    value: "Archivo",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Lexend",
    value: "Lexend",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap",
    weight: 700,
  },
  {
    name: "Varela Round",
    value: "Varela Round",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Varela+Round&display=swap",
    weight: 400,
  },
  {
    name: "Expletus Sans",
    value: "Expletus Sans",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Expletus+Sans:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Barlow",
    value: "Barlow",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Titillium Web",
    value: "Titillium Web",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Asap",
    value: "Asap",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Asap:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "M PLUS 1",
    value: "M PLUS 1",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Noto Serif",
    value: "Noto Serif",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap",
    weight: 700,
  },
  {
    name: "Zilla Slab",
    value: "Zilla Slab",
    category: "minimal",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;700&display=swap",
    weight: 700,
  },
];

/**
 * Get fonts by category
 */
export function getFontsByCategory(category: FontCategory): CertificateFont[] {
  return CERTIFICATE_FONTS.filter((font) => font.category === category);
}

/**
 * Get recommended fonts (best defaults)
 */
export function getRecommendedFonts(): CertificateFont[] {
  return CERTIFICATE_FONTS.filter((font) => font.recommended);
}

/**
 * Get font by value (font family name)
 */
export function getFontByValue(value: string): CertificateFont | undefined {
  return CERTIFICATE_FONTS.find((font) => font.value === value);
}

/**
 * Category metadata for UI
 */
export const FONT_CATEGORIES: Record<FontCategory, { label: string; description: string; icon: string }> = {
  formal: {
    label: "Formal / Certificate",
    description: "Classic serif fonts perfect for traditional certificates",
    icon: "🎓",
  },
  modern: {
    label: "Modern / Sans",
    description: "Clean sans-serif fonts for contemporary events",
    icon: "🧠",
  },
  display: {
    label: "Display / Bold",
    description: "Head-turning fonts that command attention",
    icon: "🔥",
  },
  script: {
    label: "Script / Signature",
    description: "Elegant handwritten styles (use sparingly)",
    icon: "✍️",
  },
  minimal: {
    label: "Minimal / Tech",
    description: "Clean technical fonts for modern tech events",
    icon: "🧪",
  },
};

/**
 * Recommended defaults by event type
 */
export const RECOMMENDED_FONTS_BY_EVENT_TYPE: Record<string, string> = {
  formal: "Playfair Display",
  academic: "Libre Baskerville",
  tech: "Inter",
  hackathon: "Space Grotesk",
  cultural: "Montserrat",
  sports: "Bebas Neue",
  volunteer: "Libre Baskerville",
  workshop: "Poppins",
  conference: "Playfair Display",
  default: "Playfair Display",
};
