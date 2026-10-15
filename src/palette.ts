/**
 * Palette di 10 colori vivaci ad alto contrasto per Word Cloud
 * Ottimizzata per garantire massima visibilità, differenziazione
 * e contrasto sia su sfondi scuri che chiari.
 */
export interface PaletteColor {
  hex: string;
  name: string;
  bgRgba: string;
}

export const CONTRAST_PALETTE_10: PaletteColor[] = [
  { hex: '#FF3366', name: 'Corallo Neon', bgRgba: 'rgba(255, 51, 102, 0.2)' },
  { hex: '#00E599', name: 'Smeraldo Mint', bgRgba: 'rgba(0, 229, 153, 0.2)' },
  { hex: '#00D2FF', name: 'Ciano Elettrico', bgRgba: 'rgba(0, 210, 255, 0.2)' },
  { hex: '#FFD000', name: 'Giallo Oro', bgRgba: 'rgba(255, 208, 0, 0.2)' },
  { hex: '#A855F7', name: 'Viola Ametista', bgRgba: 'rgba(168, 85, 247, 0.2)' },
  { hex: '#FF7700', name: 'Arancio Fuoco', bgRgba: 'rgba(255, 119, 0, 0.2)' },
  { hex: '#06D6A0', name: 'Acquamarina', bgRgba: 'rgba(6, 214, 160, 0.2)' },
  { hex: '#F72585', name: 'Fucsia Neon', bgRgba: 'rgba(247, 37, 133, 0.2)' },
  { hex: '#4CC9F0', name: 'Azzurro Glaciale', bgRgba: 'rgba(76, 201, 240, 0.2)' },
  { hex: '#F8FAFC', name: 'Bianco Platino', bgRgba: 'rgba(248, 250, 252, 0.2)' },
];

export interface PlacedWordInfo {
  word: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export function getWordHash(word: string): number {
  if (!word) return 0;
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (hash << 5) - hash + word.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Associa una parola a uno dei 10 colori in base al suo hash (fallback rapido)
 */
export function getWordColor(word: string): string {
  if (!word) return CONTRAST_PALETTE_10[0].hex;
  const index = getWordHash(word) % CONTRAST_PALETTE_10.length;
  return CONTRAST_PALETTE_10[index].hex;
}

/**
 * Sceglie un colore dalla palette a 10 colori garantendo che NESSUNA parola
 * vicina o adiacente nello spazio 2D abbia lo stesso colore.
 */
export function pickNonAdjacentColor(
  word: string,
  curX: number,
  curY: number,
  curFontSize: number,
  placedWords: PlacedWordInfo[]
): string {
  if (placedWords.length === 0) {
    // Prima parola al centro: usa il colore base dell'hash
    return getWordColor(word);
  }

  // Calcola la distanza euclidea verso tutte le parole già posizionate sul canvas
  const distances = placedWords.map((p) => {
    const dx = curX - p.x;
    const dy = curY - p.y;
    const dist = Math.hypot(dx, dy);
    return {
      word: p.word,
      color: p.color,
      dist,
      fontSize: p.fontSize,
    };
  });

  // Ordina per distanza crescente (i vicini più prossimi per primi)
  distances.sort((a, b) => a.dist - b.dist);

  // Raccoglie i colori utilizzati dalle parole vicine
  const forbiddenColors = new Set<string>();

  // Raggio di prossimità calcolato sulla dimensione del testo
  const baseProximity = Math.max(curFontSize * 4, 120);

  distances.forEach((neighbor, idx) => {
    // Considera vicina qualsiasi parola entro il raggio di prossimità O i primi 3 vicini più vicini in assoluto
    const isNearby = neighbor.dist < Math.max(baseProximity, neighbor.fontSize * 3.5);
    if (isNearby || idx < 3) {
      forbiddenColors.add(neighbor.color);
    }
  });

  // Trova i colori della palette che NON sono usati da nessuna parola vicina
  const availableColors = CONTRAST_PALETTE_10.filter((c) => !forbiddenColors.has(c.hex));

  if (availableColors.length > 0) {
    // Scegli tra i colori disponibili in modo deterministico
    const hash = getWordHash(word);
    return availableColors[hash % availableColors.length].hex;
  }

  // Se tutti i 10 colori fossero presenti nei dintorni (nuvola densissima),
  // trova il colore la cui istanza più vicina è la più distante possibile (massima separazione spaziale)
  const colorMinDistance = new Map<string, number>();
  CONTRAST_PALETTE_10.forEach((c) => colorMinDistance.set(c.hex, Infinity));

  distances.forEach((item) => {
    const currentMin = colorMinDistance.get(item.color) ?? Infinity;
    if (item.dist < currentMin) {
      colorMinDistance.set(item.color, item.dist);
    }
  });

  let bestColor = CONTRAST_PALETTE_10[0].hex;
  let maxMinDistance = -1;

  colorMinDistance.forEach((minDist, colorHex) => {
    if (minDist > maxMinDistance) {
      maxMinDistance = minDist;
      bestColor = colorHex;
    }
  });

  return bestColor;
}
