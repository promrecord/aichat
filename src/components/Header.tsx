import { Volume2, VolumeX, Sparkles, Crown } from 'lucide-react';
import { HistoricalCharacter } from '../types';

interface HeaderProps {
  selectedCharacter: HistoricalCharacter;
  autoVoiceEnabled: boolean;
  onToggleAutoVoice: () => void;
  onOpenCostumeStudio: () => void;
  hasCustomCostume: boolean;
  customAvatarUrl?: string;
}

export default function Header({
  selectedCharacter,
  autoVoiceEnabled,
  onToggleAutoVoice,
  onOpenCostumeStudio,
  hasCustomCostume,
  customAvatarUrl,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-800 bg-stone-950/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-700 text-stone-950 shadow-md shadow-amber-950/40">
            <Crown className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-100 font-serif">
                역사 인물 AI 챗
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                <Sparkles className="h-3.5 w-3.5" /> 나노바나나 페이스
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400">
              세종대왕 · 광개토대왕 · 아인슈타인 위인 대화 &amp; 보이스
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Voice Auto-Play Toggle */}
          <button
            type="button"
            id="btn-toggle-voice"
            onClick={onToggleAutoVoice}
            title={autoVoiceEnabled ? '음성 출력 켜짐 (클릭하여 끄기)' : '음성 출력 꺼짐 (클릭하여 켜기)'}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              autoVoiceEnabled
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                : 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800'
            }`}
          >
            {autoVoiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />
                <span className="hidden md:inline">음성 ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-stone-400" />
                <span className="hidden md:inline">음성 OFF</span>
              </>
            )}
          </button>

          {/* Open Costume Studio */}
          <button
            type="button"
            id="btn-open-costume-studio"
            onClick={onOpenCostumeStudio}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 font-bold px-3.5 py-2 text-sm sm:text-base shadow-sm shadow-amber-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {hasCustomCostume && customAvatarUrl ? (
              <img
                src={customAvatarUrl}
                alt="Custom Avatar"
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full object-cover ring-1 ring-stone-950"
              />
            ) : (
              <Sparkles className="h-4 w-4 text-stone-950" />
            )}
            <span>연예인 의상 제작</span>
          </button>
        </div>
      </div>
    </header>
  );
}
