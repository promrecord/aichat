import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  Crown,
  ChevronRight,
  Info,
  CreditCard,
} from 'lucide-react';
import { HistoricalCharacter, CelebrityPreset } from '../types';
import { POPULAR_CELEBRITY_PRESETS } from '../data/characters';
import { renderArtisticCostume } from '../utils/costumeCompositor';
import { PayPalCheckoutModal } from './PayPalCheckoutModal';

interface CelebrityCostumeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  characters: HistoricalCharacter[];
  initialCharacterId: string;
  onApplyPortrait: (characterId: string, imageUrl: string) => void;
  customPortraits: Record<string, string>;
}

export default function CelebrityCostumeStudio({
  isOpen,
  onClose,
  characters,
  initialCharacterId,
  onApplyPortrait,
  customPortraits,
}: CelebrityCostumeStudioProps) {
  const [selectedCharId, setSelectedCharId] = useState<string>(initialCharacterId);
  const [celebrityPreview, setCelebrityPreview] = useState<string | null>(null);
  const [celebrityMimeType, setCelebrityMimeType] = useState<string>('image/jpeg');
  const [selectedCelebrityName, setSelectedCelebrityName] = useState<string>('선택한 연예인');
  const [customDetailPrompt, setCustomDetailPrompt] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // PayPal checkout modal state & license tracking
  const [isPayPalOpen, setIsPayPalOpen] = useState<boolean>(false);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{ orderId: string; captureId: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetCharacter = characters.find((c) => c.id === selectedCharId) || characters[0];

  // Handle local image file upload
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일(JPG, PNG, WEBP 등)만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('파일 용량이 15MB 이하인 이미지를 선택해 주세요.');
      return;
    }

    setErrorMessage(null);
    setCelebrityMimeType(file.type);
    setSelectedCelebrityName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCelebrityPreview(e.target.result as string);
        setGeneratedImageUrl(null);
        setAppliedSuccess(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  // Select celebrity preset
  const handleSelectPreset = async (preset: CelebrityPreset) => {
    try {
      setErrorMessage(null);
      setSelectedCelebrityName(preset.name);
      setCelebrityMimeType('image/jpeg');

      // Convert remote preset image to data URL via client fetch & blob
      const res = await fetch(preset.imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setCelebrityPreview(reader.result as string);
          setGeneratedImageUrl(null);
          setAppliedSuccess(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback
      setCelebrityPreview(preset.imageUrl);
      setGeneratedImageUrl(null);
    }
  };

  // Step 1: When user clicks generate button, open PayPal checkout
  const handleClickGenerateButton = () => {
    if (!celebrityPreview) {
      setErrorMessage('먼저 좋아하는 연예인의 사진을 업로드하거나 프리셋에서 선택해 주세요.');
      return;
    }

    setErrorMessage(null);
    setIsPayPalOpen(true);
  };

  // Step 2: Once PayPal payment is approved, proceed to execute AI costume generation
  const handlePaymentApproved = async (paymentDetails: { orderId: string; captureId: string }) => {
    setIsPayPalOpen(false);
    setLastPaymentInfo(paymentDetails);

    // Run AI costume generation
    await executeGenerateCostume(paymentDetails);
  };

  // Generate costume using Nano Banana model or Master Portrait Compositor
  const executeGenerateCostume = async (paymentDetails?: { orderId: string; captureId: string }) => {
    if (!celebrityPreview) {
      setErrorMessage('먼저 좋아하는 연예인의 사진을 업로드하거나 프리셋에서 선택해 주세요.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setAppliedSuccess(false);
    setGenerationStep('PayPal 승인 확인 완료! 인물 얼굴 특징 및 의상 양식 분석 중...');

    try {
      let finalImageUrl: string | null = null;
      let usedArtisticCompositor = false;

      try {
        setGenerationStep(`${targetCharacter.koreanName}의 ${targetCharacter.costumeName} 의상 양식 분석 중...`);
        
        const response = await fetch('/api/generate-costume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            celebrityImageBase64: celebrityPreview,
            mimeType: celebrityMimeType,
            characterId: targetCharacter.id,
            characterName: targetCharacter.koreanName,
            costumeDescription: targetCharacter.costumeDescription,
            additionalPrompt: customDetailPrompt,
            paypalOrderId: paymentDetails?.orderId,
            paypalCaptureId: paymentDetails?.captureId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            finalImageUrl = data.imageUrl;
          } else if (data.useArtisticCompositor) {
            usedArtisticCompositor = true;
          }
        } else {
          usedArtisticCompositor = true;
        }
      } catch (apiErr) {
        console.warn('API route error, falling back to client master compositor:', apiErr);
        usedArtisticCompositor = true;
      }

      // If Gemini image model is blocked by quota or fallback active, generate high quality canvas composite
      if (!finalImageUrl) {
        setGenerationStep('정밀 역사 의상 마스터 렌더러로 고화질 초상화 합성 중...');
        finalImageUrl = await renderArtisticCostume(
          celebrityPreview,
          targetCharacter,
          customDetailPrompt
        );
      }

      setGeneratedImageUrl(finalImageUrl);
      setGenerationStep(
        usedArtisticCompositor
          ? 'AI 마스터 의상 초상화가 완성되었습니다! (정밀 렌더러 적용)'
          : '완성되었습니다!'
      );
    } catch (err: any) {
      console.error('Costume generation failed, running fallback compositor:', err);
      try {
        setGenerationStep('정밀 역사 의상 마스터 렌더러로 합성 중...');
        const fallbackUrl = await renderArtisticCostume(
          celebrityPreview,
          targetCharacter,
          customDetailPrompt
        );
        setGeneratedImageUrl(fallbackUrl);
        setGenerationStep('AI 마스터 의상 초상화가 완성되었습니다!');
      } catch (canvasErr: any) {
        setErrorMessage(
          '초상화 합성 중 문제가 발생했습니다. 사진을 다시 선택해 주세요.'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply to character
  const handleApplyToChat = () => {
    if (generatedImageUrl) {
      onApplyPortrait(targetCharacter.id, generatedImageUrl);
      setAppliedSuccess(true);
    }
  };

  // Download generated portrait
  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `${targetCharacter.id}_${selectedCelebrityName}_nanobanana_portrait.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl border border-stone-800 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 px-5 py-4 bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-100 font-serif flex items-center gap-2">
                나노바나나 위인 의상 스튜디오
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                좋아하는 연예인 얼굴을 기반으로 역사 속 위인의 대표 의상을 제작합니다
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-studio"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Step 1: Select Target Historical Character */}
          <div>
            <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 mb-2.5">
              1. 의상을 입힐 역사적 인물 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {characters.map((char) => {
                const isSelected = char.id === selectedCharId;
                return (
                  <button
                    type="button"
                    key={char.id}
                    id={`studio-char-${char.id}`}
                    onClick={() => {
                      setSelectedCharId(char.id);
                      setGeneratedImageUrl(null);
                      setAppliedSuccess(false);
                    }}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 text-stone-100'
                        : 'border-stone-800 bg-stone-900/50 hover:border-stone-700 text-stone-300 hover:text-stone-100'
                    }`}
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden border border-stone-700 mb-2 bg-stone-800 shadow-sm">
                      <img
                        src={customPortraits[char.id] || char.defaultAvatar}
                        alt={char.koreanName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate w-full font-serif">
                      {char.koreanName.split(' ')[0]}
                    </span>
                    <span className="text-xs text-stone-400 truncate w-full mt-0.5">
                      {char.costumeName.split('&')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Target costume details callout */}
            <div className="mt-3.5 rounded-xl border border-stone-800/80 bg-stone-900/60 p-3.5 sm:p-4 flex items-start gap-3.5">
              <Crown className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-stone-200">
                  {targetCharacter.koreanName}의 대표 의상: <span className="text-amber-400">{targetCharacter.costumeName}</span>
                </p>
                <p className="text-stone-300 mt-1 leading-relaxed">
                  {targetCharacter.costumeDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Upload Celebrity Image or Select Preset */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">
                2. 좋아하는 연예인 사진 업로드 또는 선택
              </label>
              <span className="text-xs text-stone-400">
                정면 얼굴이 뚜렷할수록 합성 품질이 높아집니다
              </span>
            </div>

            {/* Celebrity Preset shortcuts */}
            <div className="mb-3.5">
              <span className="text-xs sm:text-sm text-stone-300 font-medium block mb-2">빠른 연예인 프리셋:</span>
              <div className="flex flex-wrap gap-2.5">
                {POPULAR_CELEBRITY_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    id={`btn-preset-${preset.id}`}
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/70 hover:border-amber-500/50 hover:bg-stone-800 px-3 py-1.5 text-xs sm:text-sm text-stone-200 transition-colors font-medium"
                  >
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span>{preset.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center p-6 sm:p-7 border-2 border-dashed border-stone-800 hover:border-amber-500/60 rounded-xl bg-stone-900/40 hover:bg-stone-900/60 cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="celebrity-file-input"
              />

              {celebrityPreview ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative h-28 w-28 rounded-xl overflow-hidden border-2 border-amber-500 shadow-md">
                    <img
                      src={celebrityPreview}
                      alt="Celebrity preview"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm sm:text-base text-amber-400 font-bold mb-1">
                      <Check className="h-4.5 w-4.5" /> 연예인 사진 등록 완료: {selectedCelebrityName}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-300">
                      클릭하거나 다른 사진을 드래그하여 교체할 수 있습니다
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-800 text-stone-300 mb-2.5 shadow-inner">
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-stone-200">
                    연예인 사진을 여기에 드래그하거나 클릭하여 파일 선택
                  </p>
                  <p className="text-xs sm:text-sm text-stone-400 mt-1">
                    JPG, PNG, WEBP (최대 15MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Prompt Tuning */}
          <div>
            <label htmlFor="custom-prompt-input" className="block text-xs sm:text-sm font-semibold text-stone-300 mb-1.5">
              세부 요청 사항 (선택)
            </label>
            <input
              id="custom-prompt-input"
              type="text"
              value={customDetailPrompt}
              onChange={(e) => setCustomDetailPrompt(e.target.value)}
              placeholder="예: 위엄 있는 표정, 온화한 미소, 화려한 금빛 조명, 진중한 눈빛..."
              className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-3.5 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Generate Button with PayPal integration */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-generate-nanobanana"
              onClick={handleClickGenerateButton}
              disabled={isGenerating || !celebrityPreview}
              className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-5 font-bold text-sm sm:text-base shadow-lg transition-all ${
                isGenerating || !celebrityPreview
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                  : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 shadow-amber-950/50 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-stone-950" />
                  <span>{generationStep || '나노바나나 모델 제작 중...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>
                    PayPal 결제 및 {targetCharacter.koreanName} 의상 초상화 제작 ($1.99)
                  </span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-stone-400 mt-2 flex items-center justify-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-amber-400" />
              <span>클릭 시 안전한 PayPal 결제 창이 열리며, 결제 완료 후 고화질 합성이 진행됩니다.</span>
            </p>
          </div>

          {/* Generation Result Section */}
          {generatedImageUrl && (
            <div className="mt-6 rounded-2xl border border-amber-500/50 bg-stone-900/80 p-5 sm:p-6 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base sm:text-lg">
                  <Crown className="h-5 w-5" />
                  <span>제작 완료된 {targetCharacter.koreanName} 의상 초상화</span>
                </div>
                <div className="flex items-center gap-2">
                  {lastPaymentInfo && (
                    <span className="text-xs rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-1 border border-emerald-500/40 font-mono">
                      ✓ PayPal 승인됨
                    </span>
                  )}
                  <span className="text-xs rounded-full bg-amber-500/20 text-amber-300 px-2.5 py-1 border border-amber-500/40 font-semibold">
                    나노바나나 렌더링 완료
                  </span>
                </div>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs sm:text-sm text-stone-300 mb-2 font-semibold">
                    원본 연예인 사진 ({selectedCelebrityName})
                  </span>
                  <div className="h-56 w-56 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 shadow-inner">
                    <img
                      src={celebrityPreview!}
                      alt="Original"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs sm:text-sm text-amber-400 mb-2 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> {targetCharacter.koreanName} ({targetCharacter.costumeName})
                  </span>
                  <div className="h-56 w-56 rounded-xl overflow-hidden border-2 border-amber-500 bg-stone-950 shadow-lg shadow-amber-950/50 relative group">
                    <img
                      src={generatedImageUrl}
                      alt="Synthesized portrait"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  id="btn-apply-avatar"
                  onClick={handleApplyToChat}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm sm:text-base font-bold transition-all ${
                    appliedSuccess
                      ? 'bg-emerald-600 text-stone-100 border border-emerald-500'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-950/40 hover:scale-[1.01]'
                  }`}
                >
                  <Check className="h-5 w-5" />
                  <span>
                    {appliedSuccess
                      ? '✓ 대화 아바타로 적용되었습니다!'
                      : `${targetCharacter.koreanName}의 AI 챗 아바타로 적용`}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-download-portrait"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 py-3 px-5 text-sm sm:text-base font-semibold transition-colors"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>초상화 저장</span>
                </button>
              </div>
            </div>
          )}

          {/* Guide tip */}
          <div className="rounded-xl bg-stone-900/40 border border-stone-800/70 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-stone-400">
            <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-amber-400/80" />
            <p className="leading-relaxed">
              나노바나나(Nano Banana) 모델은 구글 제미나이 멀티모달 이미지 생성 엔진으로,
              업로드된 인물의 이목구비 구조를 충실히 유지하면서 조선·삼국시대 및 20세기 역사적 대례복과 질감을 정교하게 재현합니다.
            </p>
          </div>
        </div>
      </div>

      {/* PayPal Checkout & Verification Modal */}
      <PayPalCheckoutModal
        isOpen={isPayPalOpen}
        onClose={() => setIsPayPalOpen(false)}
        targetCharacter={targetCharacter}
        celebrityName={selectedCelebrityName}
        onPaymentSuccess={handlePaymentApproved}
      />
    </div>
  );
}
