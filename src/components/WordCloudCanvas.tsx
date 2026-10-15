import React, { useEffect, useRef, useState, useCallback } from 'react';
import WordCloud from 'wordcloud';
import { getWordColor, pickNonAdjacentColor, PlacedWordInfo } from '../palette';

interface WordCloudCanvasProps {
  words: Record<string, number>;
  rotateWords?: boolean;
  onWordClick?: (word: string, count: number, color?: string) => void;
  className?: string;
}

export const WordCloudCanvas: React.FC<WordCloudCanvasProps> = ({
  words,
  rotateWords = false,
  onWordClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assignedColorsRef = useRef<Map<string, string>>(new Map());

  const [hoveredWord, setHoveredWord] = useState<{
    word: string;
    count: number;
    x: number;
    y: number;
    color: string;
  } | null>(null);

  const wordEntries = Object.entries(words);
  const totalSubmissions = wordEntries.reduce((sum, [, count]) => sum + count, 0);

  const renderCloud = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Dimensioni effettive del contenitore
    const width = Math.max(320, container.clientWidth || container.offsetWidth || 800);
    const height = Math.max(280, container.clientHeight || container.offsetHeight || 500);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const physicalWidth = Math.floor(width * dpr);
    const physicalHeight = Math.floor(height * dpr);

    canvas.width = physicalWidth;
    canvas.height = physicalHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, physicalWidth, physicalHeight);
    }

    if (wordEntries.length === 0) {
      assignedColorsRef.current.clear();
      return;
    }

    // Ordina in modo decrescente per peso
    const sortedList: Array<[string, number]> = [...wordEntries].sort((a, b) => b[1] - a[1]);
    const counts = sortedList.map((item) => item[1]);
    const maxCount = Math.max(...counts, 1);
    const minCount = Math.min(...counts, 1);

    const minDimension = Math.min(width, height);
    const minFontSizePx = Math.max(14, Math.floor(minDimension / 26));
    const maxFontSizePx = Math.min(
      Math.floor(width / 8),
      Math.floor(height / 4),
      sortedList.length <= 5 ? 75 : 60
    );

    const minFontScaled = minFontSizePx * dpr;
    const maxFontScaled = maxFontSizePx * dpr;

    const centerX = Math.floor(physicalWidth / 2);
    const centerY = Math.floor(physicalHeight / 2);
    const gridSize = Math.max(6 * dpr, Math.round(8 * dpr * (width / 1200)));

    // Tracciamento locale delle parole posizionate per il controllo anti-vicinanza colori
    const placedWords: PlacedWordInfo[] = [];
    const colorMap = new Map<string, string>();

    try {
      if (typeof WordCloud.stop === 'function') {
        WordCloud.stop();
      }

      WordCloud(canvas, {
        list: sortedList,
        origin: [centerX, centerY],
        gridSize,
        weightFactor: (size: number) => {
          if (maxCount === minCount) {
            return (minFontScaled + maxFontScaled) / 2;
          }
          const ratio = (size - minCount) / (maxCount - minCount);
          const weight = Math.pow(ratio, 0.7);
          return minFontScaled + weight * (maxFontScaled - minFontScaled);
        },
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        fontWeight: '700',
        /**
         * CONTROLLO PROSSIMITÀ COLORI:
         * Riceve le coordinate polari (distance, theta) da WordCloud2 in fase di piazzamento.
         * Calcola la posizione (curX, curY) e seleziona un colore dalla palette a 10 colori
         * che sia rigorosamente DIVERSO da quello di qualsiasi parola adiacente o vicina.
         */
        color: (
          word: string,
          _weight: string | number,
          fontSize: number,
          distance: number,
          theta: number
        ) => {
          const curX = distance * Math.cos(theta) * gridSize;
          const curY = distance * Math.sin(theta) * gridSize;

          const chosenColor = pickNonAdjacentColor(
            word,
            curX,
            curY,
            fontSize,
            placedWords
          );

          placedWords.push({
            word,
            x: curX,
            y: curY,
            fontSize,
            color: chosenColor,
          });

          colorMap.set(word, chosenColor);
          return chosenColor;
        },
        rotateRatio: rotateWords ? 0.2 : 0,
        rotationSteps: 2,
        minRotation: -Math.PI / 2,
        maxRotation: Math.PI / 2,
        backgroundColor: 'transparent',
        ellipticity: 0.65,
        shrinkToFit: true,
        drawOutOfBound: false,
        shuffle: false,
        wait: 5,
        hover: (item, _dimension, event) => {
          if (!item || !event) {
            setHoveredWord(null);
            return;
          }
          const word = item[0] as string;
          const count = item[1] as number;
          const color = colorMap.get(word) || assignedColorsRef.current.get(word) || getWordColor(word);
          const mouseEv = event as MouseEvent;
          setHoveredWord({
            word,
            count,
            x: mouseEv.clientX,
            y: mouseEv.clientY,
            color,
          });
        },
        click: (item) => {
          if (item && onWordClick) {
            const word = item[0] as string;
            const count = item[1] as number;
            const color = colorMap.get(word) || assignedColorsRef.current.get(word) || getWordColor(word);
            onWordClick(word, count, color);
          }
        },
      });

      assignedColorsRef.current = colorMap;
    } catch (err) {
      console.error('WordCloud execution error:', err);
    }
  }, [JSON.stringify(words), rotateWords, onWordClick]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderCloud();
    }, 30);

    const container = containerRef.current;
    if (!container) return () => clearTimeout(timer);

    let animationFrameId: number;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        renderCloud();
      });
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [renderCloud]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[350px] flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {wordEntries.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">In attesa delle prime parole...</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            I partecipanti possono inviare le loro risposte per popolare il Word Cloud in tempo reale!
          </p>
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        className="block max-w-full max-h-full cursor-pointer transition-opacity duration-300"
      />

      {/* Tooltip fluttuante su hover parola */}
      {hoveredWord && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredWord.x + 14}px`,
            top: `${hoveredWord.y + 14}px`,
            pointerEvents: 'none',
            zIndex: 100,
          }}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: hoveredWord.color }}
          />
          <div>
            <p className="font-black text-white text-sm tracking-wide">
              {hoveredWord.word}
            </p>
            <p className="text-slate-400">
              <span className="font-bold text-slate-100">{hoveredWord.count}</span>{' '}
              {hoveredWord.count === 1 ? 'risposta' : 'risposte'}
              {totalSubmissions > 0 && (
                <span className="ml-1.5 text-cyan-400 font-bold">
                  ({Math.round((hoveredWord.count / totalSubmissions) * 100)}%)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
