import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  RotateCcw,
  BookOpen,
  Info,
} from 'lucide-react';
import { HistoricalCharacter, ChatMessage } from '../types';

interface ChatInterfaceProps {
  character: HistoricalCharacter;
  activeAvatarUrl: string;
  isCustomAvatar: boolean;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  isSpeaking: boolean;
  onStopVoice: () => void;
  onReplayVoice: (message: ChatMessage) => void;
  onOpenCostumeStudio: () => void;
  onClearHistory: () => void;
  autoVoiceEnabled: boolean;
}

export default function ChatInterface({
  character,
  activeAvatarUrl,
  isCustomAvatar,
  messages,
  onSendMessage,
  isLoading,
  isSpeaking,
  onStopVoice,
  onReplayVoice,
  onOpenCostumeStudio,
  onClearHistory,
  autoVoiceEnabled,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [showLore, setShowLore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for voice dictation input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText('');
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-stone-800 bg-stone-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Banner: Active Character Profile Bar */}
      <div className="flex items-center justify-between border-b border-stone-800/80 bg-stone-950/70 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3.5">
          {/* Avatar with speaking wave effect */}
          <div className="relative">
            <div
              className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden border-2 shadow-md ${
                isCustomAvatar ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-stone-700'
              }`}
            >
              <img
                src={activeAvatarUrl}
                alt={character.koreanName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-stone-950">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <Volume2 className="h-2.5 w-2.5 relative" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-100">
                {character.koreanName}
              </h2>
              {isCustomAvatar && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3 w-3" /> 연예인 페이스
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-300 flex items-center gap-1.5 mt-0.5">
              <span className="text-amber-400 font-semibold">{character.title}</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-300">{character.costumeName}</span>
            </p>
          </div>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Speaking Audio wave status */}
          {isSpeaking && (
            <div className="hidden sm:flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-amber-300">
              <div className="flex items-center gap-0.5 h-3.5">
                <span className="w-0.5 h-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-semibold">음성 재생 중</span>
              <button
                type="button"
                id="btn-stop-audio-now"
                onClick={onStopVoice}
                className="ml-1 hover:text-stone-100"
                title="음성 중지"
              >
                <VolumeX className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Character Lore button */}
          <button
            type="button"
            id="btn-toggle-lore"
            onClick={() => setShowLore(!showLore)}
            title="위인 상세 업적 및 역사 정보 보기"
            className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs sm:text-sm text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline font-medium">위인 정보</span>
          </button>

          {/* Costume studio shortcut */}
          <button
            type="button"
            id="btn-chat-costume-shortcut"
            onClick={onOpenCostumeStudio}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs sm:text-sm text-amber-300 font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">의상 제작</span>
          </button>

          {/* Reset chat */}
          <button
            type="button"
            id="btn-clear-chat"
            onClick={onClearHistory}
            title="대화 내역 초기화"
            className="rounded-xl border border-stone-800 bg-stone-900 p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lore Drawer / Collapsible Info */}
      {showLore && (
        <div className="border-b border-stone-800 bg-stone-950/90 p-5 text-sm sm:text-base space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between">
            <h4 className="font-serif font-bold text-amber-400 flex items-center gap-2 text-base sm:text-lg">
              <Info className="h-4 w-4" /> {character.koreanName} 소개 및 역사적 배경
            </h4>
            <span className="text-xs sm:text-sm text-stone-400 font-medium">{character.era} ({character.lifespan})</span>
          </div>
          <p className="text-stone-200 leading-relaxed">{character.bio}</p>
          <div className="rounded-xl bg-stone-900/60 p-3.5 border border-stone-800/80">
            <span className="font-bold text-stone-200 block mb-1.5 text-sm sm:text-base">주요 업적:</span>
            <ul className="list-disc list-inside space-y-1 text-stone-300 text-sm sm:text-base">
              {character.historicalAchievements.map((ach, idx) => (
                <li key={idx}>{ach}</li>
              ))}
            </ul>
          </div>
          <div className="text-amber-200/90 italic font-serif text-sm sm:text-base">
            "{character.quote}"
          </div>
        </div>
      )}

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-stone-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto py-8">
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-xl mb-4 relative">
              <img
                src={activeAvatarUrl}
                alt={character.koreanName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 to-transparent" />
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 mb-1.5">
              {character.koreanName}와(과)의 대화
            </h3>
            <p className="text-sm sm:text-base text-stone-300 mb-5 leading-relaxed font-serif">
              "{character.tagline}"
            </p>

            {/* Suggested conversation starters */}
            <div className="w-full space-y-2.5 mt-2">
              <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider block">
                추천 대화 주제를 눌러 바로 시작해 보세요
              </span>
              <div className="flex flex-col gap-2.5">
                {character.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    id={`btn-suggested-q-${idx}`}
                    onClick={() => onSendMessage(q)}
                    className="w-full text-left rounded-xl border border-stone-800/90 bg-stone-900/70 hover:bg-stone-800 hover:border-amber-500/50 p-3.5 sm:p-4 text-sm sm:text-base text-stone-200 hover:text-amber-300 transition-all shadow-sm leading-relaxed"
                  >
                    💬 "{q}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-stone-700 bg-stone-800 flex-shrink-0 shadow-sm mt-0.5">
                    <img
                      src={activeAvatarUrl}
                      alt={character.koreanName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {!isUser && (
                    <span className="text-xs sm:text-sm font-bold text-amber-400/95 mb-1 font-serif">
                      {character.koreanName}
                    </span>
                  )}

                  <div
                    className={`rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base leading-relaxed sm:leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-stone-950 font-semibold rounded-tr-none'
                        : 'bg-stone-850 text-stone-100 border border-stone-700/80 rounded-tl-none font-serif tracking-normal'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Assistant Message Audio Replay control */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-400">
                      <button
                        type="button"
                        id={`btn-replay-voice-${msg.id}`}
                        onClick={() => onReplayVoice(msg)}
                        className="flex items-center gap-1 hover:text-amber-400 transition-colors font-medium"
                        title="이 답변 음성으로 다시 듣기"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>음성 다시 듣기</span>
                      </button>
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {isUser && (
                    <span className="text-xs text-stone-400 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading shimmer */}
        {isLoading && (
          <div className="flex gap-3 items-start animate-pulse">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-stone-700 bg-stone-800 flex-shrink-0">
              <img
                src={activeAvatarUrl}
                alt={character.koreanName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-stone-850 border border-stone-700/80 px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-300">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                <span>{character.koreanName}께서 깊이 고뇌하며 답변을 작성 중이오...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips row above input (when chat has messages) */}
      {messages.length > 0 && (
        <div className="px-4 sm:px-5 py-2 border-t border-stone-800/60 bg-stone-950/50 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
          <span className="text-xs sm:text-sm font-semibold text-stone-400 flex-shrink-0">추천:</span>
          {character.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              id={`quick-chip-${idx}`}
              onClick={() => onSendMessage(q)}
              className="flex-shrink-0 text-xs sm:text-sm font-medium rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 px-3 py-1.5 text-stone-200 hover:text-amber-300 transition-colors truncate max-w-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-stone-800/80 bg-stone-950/90 p-3.5 sm:p-4.5">
        <div className="flex items-center gap-2.5">
          {/* Voice Input (Speech-to-Text) Button */}
          {recognitionSupported && (
            <button
              type="button"
              id="btn-voice-input"
              onClick={toggleListening}
              title={isListening ? '음성 듣기 중지' : '음성으로 말하기 (마이크 입력)'}
              className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition-all ${
                isListening
                  ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse ring-2 ring-rose-500/30'
                  : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-700 hover:bg-stone-800 hover:text-stone-100'
              }`}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              id="chat-message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? '음성을 듣고 있습니다... 말씀해 주세요.'
                  : `${character.koreanName}께 여쭈어볼 말씀을 입력하세요...`
              }
              className="w-full rounded-xl border border-stone-800 bg-stone-900/95 px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            id="btn-send-message"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl font-bold shadow-md transition-all ${
              !inputText.trim() || isLoading
                ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700/40'
                : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 shadow-amber-950/40 hover:scale-[1.03] active:scale-[0.97]'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Voice auto-play status caption */}
        <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm text-stone-400 px-1">
          <span>
            {autoVoiceEnabled ? (
              <span className="text-amber-400/90 flex items-center gap-1.5 font-medium">
                <Volume2 className="h-3.5 w-3.5 inline" /> AI 응답 시 음성(Voice) 자동 출력 켜짐
              </span>
            ) : (
              <span>음성 출력이 꺼져 있습니다 (상단 버튼으로 켤 수 있습니다)</span>
            )}
          </span>
          <span className="hidden sm:inline text-stone-400">Enter 키로 전송</span>
        </div>
      </div>
    </div>
  );
}
