import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CharacterDeck from './components/CharacterDeck';
import ChatInterface from './components/ChatInterface';
import CelebrityCostumeStudio from './components/CelebrityCostumeStudio';
import { HISTORICAL_CHARACTERS } from './data/characters';
import { ChatMessage, HistoricalCharacter } from './types';
import { playCharacterVoice, stopCurrentAudio } from './utils/audioPlayer';

export default function App() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('sejong');
  const [customPortraits, setCustomPortraits] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('historical_custom_portraits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [studioInitialCharId, setStudioInitialCharId] = useState<string>('sejong');
  const [isLoadingReply, setIsLoadingReply] = useState<boolean>(false);

  // Chat message histories keyed by character ID
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('historical_chat_histories');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }

    // Default welcome messages from each historical figure
    const initials: Record<string, ChatMessage[]> = {
      sejong: [
        {
          id: 'welcome-sejong',
          sender: 'assistant',
          text: '과인은 조선의 제4대 국왕 세종(世宗)이오. 백성을 어여삐 여겨 훈민정음을 짓고 천문과 과학을 진흥시켰소. 오늘 그대와 마주하여 학문과 삶의 지혜를 나누고자 하니, 편히 묻고 답하시오.',
          timestamp: Date.now(),
          characterId: 'sejong',
        },
      ],
      gwanggaeto: [
        {
          id: 'welcome-gwanggaeto',
          sender: 'assistant',
          text: '나는 고구려 제19대 군주, 국강상광개토경평안호태왕(廣開土大王) 담덕이노라! 영락(永樂)의 깃발 아래 북방의 광활한 대륙을 호령하며 천손의 기상을 떨쳤노라. 그대의 가슴속 웅대한 꿈과 기백을 내게 말해보라!',
          timestamp: Date.now(),
          characterId: 'gwanggaeto',
        },
      ],
      einstein: [
        {
          id: 'welcome-einstein',
          sender: 'assistant',
          text: '반갑네! 나는 알베르트 아인슈타인이라네. 질문을 멈추지 않는 지적 호기심은 인간의 가장 위대한 보물이지. 시공간의 상대성부터 우주의 신비, 과학과 평화, 혹은 일상의 고민까지 무엇이든 즐겁게 이야기해보세!',
          timestamp: Date.now(),
          characterId: 'einstein',
        },
      ],
      yisunsin: [
        {
          id: 'welcome-yisunsin',
          sender: 'assistant',
          text: '나는 조선의 바다를 지킨 삼도수군통제사 이순신이오. 죽고자 하면 살고 살고자 하면 죽는다는 각오로 험난한 파도를 헤쳐왔소. 그대가 마주한 인생의 파도 앞에서도 결코 물러서지 말기를 바라오.',
          timestamp: Date.now(),
          characterId: 'yisunsin',
        },
      ],
      cleopatra: [
        {
          id: 'welcome-cleopatra',
          sender: 'assistant',
          text: '이집트의 여왕 클레오파트라입니다. 지혜와 담대한 결단으로 나일강의 왕국을 이끌었죠. 그대의 혜안과 포부를 함께 나누어 보아요.',
          timestamp: Date.now(),
          characterId: 'cleopatra',
        },
      ],
    };
    return initials;
  });

  // Save custom portraits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('historical_custom_portraits', JSON.stringify(customPortraits));
    } catch {
      // ignore
    }
  }, [customPortraits]);

  // Save chat histories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('historical_chat_histories', JSON.stringify(chatHistories));
    } catch {
      // ignore
    }
  }, [chatHistories]);

  // Current active character
  const currentCharacter: HistoricalCharacter =
    HISTORICAL_CHARACTERS.find((c) => c.id === selectedCharacterId) || HISTORICAL_CHARACTERS[0];

  const currentMessages = chatHistories[selectedCharacterId] || [];
  const customAvatar = customPortraits[selectedCharacterId];
  const activeAvatarUrl = customAvatar || currentCharacter.defaultAvatar;

  // Switch character
  const handleSelectCharacter = (id: string) => {
    stopCurrentAudio();
    setIsSpeaking(false);
    setSelectedCharacterId(id);
  };

  // Open Costume Studio
  const handleOpenStudio = (charId?: string) => {
    setStudioInitialCharId(charId || selectedCharacterId);
    setIsStudioOpen(true);
  };

  // Apply custom celebrity portrait to a character
  const handleApplyPortrait = (charId: string, imageUrl: string) => {
    setCustomPortraits((prev) => ({
      ...prev,
      [charId]: imageUrl,
    }));
  };

  // Speak a message aloud
  const speakMessage = async (
    text: string,
    character: HistoricalCharacter,
    existingAudio?: string
  ) => {
    setIsSpeaking(true);

    try {
      let audioBase64 = existingAudio;

      // If no pre-cached audio, fetch from /api/tts
      if (!audioBase64) {
        try {
          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voiceName: character.voiceName,
              characterName: character.koreanName,
            }),
          });
          if (ttsRes.ok) {
            const ttsData = await ttsRes.json();
            audioBase64 = ttsData.audioBase64;
          }
        } catch (ttsErr) {
          console.warn('TTS API fetch failed, will use browser speech fallback:', ttsErr);
        }
      }

      await playCharacterVoice({
        text,
        audioBase64,
        characterId: character.id,
        onStart: () => setIsSpeaking(true),
        onEnded: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (err) {
      console.warn('Error during voice playback:', err);
      setIsSpeaking(false);
    }
  };

  // Send a message in chat
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoadingReply) return;

    stopCurrentAudio();
    setIsSpeaking(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const newHistory = [...currentMessages, userMessage];

    setChatHistories((prev) => ({
      ...prev,
      [selectedCharacterId]: newHistory,
    }));

    setIsLoadingReply(true);

    try {
      // Request AI reply
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: currentCharacter.id,
          message: text.trim(),
          history: currentMessages.slice(-8), // send last 8 messages for context
          systemInstruction: currentCharacter.systemInstruction,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || '대화 생성에 실패했습니다.');
      }

      const data = await response.json();
      const replyText = data.text || '죄송하오, 다시 한 번 말씀해 주시겠소?';

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        characterId: currentCharacter.id,
        characterName: currentCharacter.koreanName,
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedCharacterId]: [...newHistory, botMessage],
      }));

      // If auto-voice is enabled, speak aloud!
      if (autoVoiceEnabled) {
        await speakMessage(replyText, currentCharacter);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: '송구하오, 잠시 통신에 혼선이 있어 답을 잇지 못하였소. 잠시 후 다시 여쭈어 주시오.',
        timestamp: Date.now(),
        characterId: currentCharacter.id,
      };
      setChatHistories((prev) => ({
        ...prev,
        [selectedCharacterId]: [...newHistory, errorMessage],
      }));
    } finally {
      setIsLoadingReply(false);
    }
  };

  // Replay a specific message's voice
  const handleReplayVoice = (message: ChatMessage) => {
    speakMessage(message.text, currentCharacter, message.audioBase64);
  };

  // Stop current voice
  const handleStopVoice = () => {
    stopCurrentAudio();
    setIsSpeaking(false);
  };

  // Clear chat history
  const handleClearHistory = () => {
    stopCurrentAudio();
    setIsSpeaking(false);
    setChatHistories((prev) => ({
      ...prev,
      [selectedCharacterId]: [],
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Top Navigation */}
      <Header
        selectedCharacter={currentCharacter}
        autoVoiceEnabled={autoVoiceEnabled}
        onToggleAutoVoice={() => {
          if (autoVoiceEnabled && isSpeaking) {
            handleStopVoice();
          }
          setAutoVoiceEnabled(!autoVoiceEnabled);
        }}
        onOpenCostumeStudio={() => handleOpenStudio(selectedCharacterId)}
        hasCustomCostume={Boolean(customAvatar)}
        customAvatarUrl={customAvatar}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">
        {/* Historical Character Selector Deck */}
        <CharacterDeck
          characters={HISTORICAL_CHARACTERS}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          customPortraits={customPortraits}
          onOpenCostumeStudioFor={handleOpenStudio}
        />

        {/* Chat Interface Stage */}
        <div className="flex-1 min-h-[520px] sm:min-h-[580px]">
          <ChatInterface
            character={currentCharacter}
            activeAvatarUrl={activeAvatarUrl}
            isCustomAvatar={Boolean(customAvatar)}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingReply}
            isSpeaking={isSpeaking}
            onStopVoice={handleStopVoice}
            onReplayVoice={handleReplayVoice}
            onOpenCostumeStudio={() => handleOpenStudio(selectedCharacterId)}
            onClearHistory={handleClearHistory}
            autoVoiceEnabled={autoVoiceEnabled}
          />
        </div>
      </main>

      {/* Celebrity Costume Studio Modal */}
      <CelebrityCostumeStudio
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        characters={HISTORICAL_CHARACTERS}
        initialCharacterId={studioInitialCharId}
        onApplyPortrait={handleApplyPortrait}
        customPortraits={customPortraits}
      />
    </div>
  );
}
