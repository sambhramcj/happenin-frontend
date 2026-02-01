/**
 * Web-safe fonts for certificate generation
 * Categorized and styled for easy filtering
 */

export interface FontOption {
  name: string;
  value: string;
  category: "serif" | "sans-serif" | "monospace" | "cursive" | "display";
  style: "formal" | "modern" | "elegant" | "technical" | "playful" | "bold";
  fallback: string;
}

export const CERTIFICATE_FONTS: FontOption[] = [
  // SERIF FONTS - Formal & Elegant
  {
    name: "Georgia",
    value: "Georgia",
    category: "serif",
    style: "formal",
    fallback: "Georgia, serif",
  },
  {
    name: "Times New Roman",
    value: "Times New Roman",
    category: "serif",
    style: "formal",
    fallback: "'Times New Roman', Times, serif",
  },
  {
    name: "Garamond",
    value: "Garamond",
    category: "serif",
    style: "elegant",
    fallback: "Garamond, 'Garamond Premier Pro', serif",
  },
  {
    name: "Palatino",
    value: "Palatino",
    category: "serif",
    style: "elegant",
    fallback: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  {
    name: "Baskerville",
    value: "Baskerville",
    category: "serif",
    style: "elegant",
    fallback: "Baskerville, 'Baskerville Old Face', 'Hoefler Text', Garamond, serif",
  },

  // SANS-SERIF FONTS - Modern & Clean
  {
    name: "Arial",
    value: "Arial",
    category: "sans-serif",
    style: "modern",
    fallback: "Arial, Helvetica, sans-serif",
  },
  {
    name: "Helvetica",
    value: "Helvetica",
    category: "sans-serif",
    style: "modern",
    fallback: "Helvetica, Arial, sans-serif",
  },
  {
    name: "Verdana",
    value: "Verdana",
    category: "sans-serif",
    style: "modern",
    fallback: "Verdana, Geneva, sans-serif",
  },
  {
    name: "Tahoma",
    value: "Tahoma",
    category: "sans-serif",
    style: "modern",
    fallback: "Tahoma, Geneva, sans-serif",
  },
  {
    name: "Trebuchet MS",
    value: "Trebuchet MS",
    category: "sans-serif",
    style: "modern",
    fallback: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
  },
  {
    name: "Geneva",
    value: "Geneva",
    category: "sans-serif",
    style: "modern",
    fallback: "Geneva, Tahoma, sans-serif",
  },
  {
    name: "Gill Sans",
    value: "Gill Sans",
    category: "sans-serif",
    style: "elegant",
    fallback: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  },

  // MONOSPACE FONTS - Technical
  {
    name: "Courier New",
    value: "Courier New",
    category: "monospace",
    style: "technical",
    fallback: "'Courier New', Courier, monospace",
  },
  {
    name: "Monaco",
    value: "Monaco",
    category: "monospace",
    style: "technical",
    fallback: "Monaco, 'Lucida Console', monospace",
  },
  {
    name: "Consolas",
    value: "Consolas",
    category: "monospace",
    style: "technical",
    fallback: "Consolas, 'Courier New', monospace",
  },

  // CURSIVE FONTS - Handwriting & Script
  {
    name: "Brush Script MT",
    value: "Brush Script MT",
    category: "cursive",
    style: "playful",
    fallback: "'Brush Script MT', cursive",
  },
  {
    name: "Lucida Handwriting",
    value: "Lucida Handwriting",
    category: "cursive",
    style: "elegant",
    fallback: "'Lucida Handwriting', 'Apple Chancery', cursive",
  },
  {
    name: "Comic Sans MS",
    value: "Comic Sans MS",
    category: "cursive",
    style: "playful",
    fallback: "'Comic Sans MS', 'Comic Sans', cursive",
  },

  // DISPLAY FONTS - Bold & Eye-catching
  {
    name: "Impact",
    value: "Impact",
    category: "display",
    style: "bold",
    fallback: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
  },
  {
    name: "Copperplate",
    value: "Copperplate",
    category: "display",
    style: "formal",
    fallback: "Copperplate, 'Copperplate Gothic Light', fantasy",
  },
  {
    name: "Papyrus",
    value: "Papyrus",
    category: "display",
    style: "playful",
    fallback: "Papyrus, fantasy",
  },
];

export function getFontsByCategory(category: FontOption["category"]): FontOption[] {
  return CERTIFICATE_FONTS.filter((font) => font.category === category);
}

export function getFontFallback(fontName: string): string {
  const font = CERTIFICATE_FONTS.find((f) => f.value === fontName);
  return font?.fallback || "Arial, sans-serif";
}

export const FONT_CATEGORIES = [
  { id: "serif", name: "Serif", description: "Classic & formal fonts" },
  { id: "sans-serif", name: "Sans-Serif", description: "Modern & clean fonts" },
  { id: "monospace", name: "Monospace", description: "Technical & code fonts" },
  { id: "cursive", name: "Cursive", description: "Handwriting & script fonts" },
  { id: "display", name: "Display", description: "Bold & eye-catching fonts" },
] as const;
