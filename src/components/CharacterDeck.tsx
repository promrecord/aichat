import { Sparkles, Scroll, Award } from 'lucide-react';
import { HistoricalCharacter } from '../types';

interface CharacterDeckProps {
  characters: HistoricalCharacter[];
  selectedCharacterId: string;
  onSelectCharacter: (id: string) => void;
  customPortraits: Record<string, string>;
  onOpenCostumeStudioFor: (characterId: string) => void;
}

export default function CharacterDeck({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  customPortraits,
  onOpenCostumeStudioFor,
}: CharacterDeckProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Scroll className="h-4.5 w-4.5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-stone-200">
            대화할 위인 선택
          </h2>
        </div>
        <span className="text-xs sm:text-sm text-stone-400">
          총 {characters.length}인의 역사적 인물
        </span>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-stone-800">
        {characters.map((char) => {
          const isSelected = char.id === selectedCharacterId;
          const customAvatar = customPortraits[char.id];
          const displayAvatar = customAvatar || char.defaultAvatar;

          return (
            <div
              key={char.id}
              id={`card-character-${char.id}`}
              onClick={() => onSelectCharacter(char.id)}
              className={`group relative flex-shrink-0 w-64 sm:w-72 cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                isSelected
                  ? 'border-amber-500/80 bg-stone-900/90 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/40'
                  : 'border-stone-800 bg-stone-950/60 hover:border-stone-700 hover:bg-stone-900/50'
              }`}
            >
              {/* Custom costume tag */}
              {customAvatar && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[11px] font-semibold text-amber-300 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  <span>연예인 페이스 적용됨</span>
                </div>
              )}

              <div className="flex items-start gap-3.5">
                {/* Character portrait avatar */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-stone-700 bg-stone-800 shadow-inner">
                  <img
                    src={displayAvatar}
                    alt={char.koreanName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 to-transparent" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="truncate font-serif text-base sm:text-lg font-bold text-stone-100">
                      {char.koreanName}
                    </h3>
                  </div>
                  <p className="truncate text-xs sm:text-sm font-semibold text-amber-400/95">
                    {char.title}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {char.era} ({char.lifespan})
                  </p>
                </div>
              </div>

              {/* Character costume summary & Studio launch */}
              <div className="mt-3 border-t border-stone-800/80 pt-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-xs text-stone-300 truncate pr-2">
                  <Award className="h-3.5 w-3.5 text-amber-500/80 flex-shrink-0" />
                  <span className="truncate">{char.costumeName}</span>
                </div>
                <button
                  type="button"
                  id={`btn-costume-for-${char.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCostumeStudioFor(char.id);
                  }}
                  title={`${char.koreanName} 의상으로 연예인 사진 합성`}
                  className="flex-shrink-0 rounded-lg bg-stone-800 hover:bg-amber-500/20 hover:text-amber-300 text-stone-300 px-2 py-1 text-xs font-semibold border border-stone-700/80 transition-colors"
                >
                  {customAvatar ? '의상 변경' : '의상 입히기'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
