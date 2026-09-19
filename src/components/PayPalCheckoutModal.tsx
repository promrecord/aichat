import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, ExternalLink, Check, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import { HistoricalCharacter } from '../types';

interface PayPalCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCharacter: HistoricalCharacter;
  celebrityName: string;
  onPaymentSuccess: (details: { orderId: string; captureId: string }) => void;
}

export const PayPalCheckoutModal: React.FC<PayPalCheckoutModalProps> = ({
  isOpen,
  onClose,
  targetCharacter,
  celebrityName,
  onPaymentSuccess,
}) => {
  const [config, setConfig] = useState<{
    clientId: string;
    itemPrice: string;
    currency: string;
    isConfigured: boolean;
    demoMode: boolean;
  }>({
    clientId: 'sb',
    itemPrice: '1.99',
    currency: 'USD',
    isConfigured: false,
    demoMode: true,
  });

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'paypal_window' | 'completed'>('review');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; captureId?: string } | null>(null);

  // Fetch PayPal configuration
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingConfig(true);
    setErrorMessage(null);
    setStep('review');

    fetch('/api/paypal/config')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setConfig({
            clientId: data.clientId || 'sb',
            itemPrice: data.itemPrice || '1.99',
            currency: data.currency || 'USD',
            isConfigured: Boolean(data.isConfigured),
            demoMode: Boolean(data.demoMode),
          });
          setLoadingConfig(false);
        }
      })
      .catch((err) => {
        console.error('PayPal config load failed:', err);
        if (isMounted) {
          setLoadingConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Pay with PayPal
  const handleInitiatePayPalPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on server
      const createRes = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: targetCharacter.id,
          characterName: targetCharacter.koreanName,
          celebrityName,
          costumeName: targetCharacter.costumeName,
        }),
      });

      if (!createRes.ok) {
        throw new Error('주문 생성 요청이 거절되었습니다.');
      }

      const orderData = await createRes.json();
      const currentOrderId = orderData.orderId;
      setOrderInfo({ orderId: currentOrderId });

      // Step 2: Simulate or capture payment
      setStep('paypal_window');

      // Short delay for payment processing experience
      setTimeout(async () => {
        try {
          const captureRes = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: currentOrderId }),
          });

          if (!captureRes.ok) {
            throw new Error('결제 승인 처리 중 문제가 발생했습니다.');
          }

          const captureData = await captureRes.json();
          setOrderInfo({
            orderId: currentOrderId,
            captureId: captureData.captureId,
          });
          setStep('completed');
          setIsProcessing(false);

          // Auto proceed to generation after a brief confirmation
          setTimeout(() => {
            onPaymentSuccess({
              orderId: currentOrderId,
              captureId: captureData.captureId || `CAP-${Date.now()}`,
            });
          }, 1200);
        } catch (captureErr: any) {
          setErrorMessage(captureErr.message || '결제 승인 실패');
          setIsProcessing(false);
          setStep('review');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'PayPal 결제 초기화 실패');
      setIsProcessing(false);
      setStep('review');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-800 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 px-6 py-4 bg-stone-900/60">
          <div className="flex items-center gap-3">
            {/* PayPal Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087] text-white shadow-md">
              <span className="font-extrabold italic text-lg tracking-tighter">P</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
                PayPal 결제 확인
              </h3>
              <p className="text-xs text-stone-400">
                나노바나나 AI 위인 의상 마스터 제작 라이선스
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-paypal-modal"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {step === 'review' && (
            <>
              {/* Product Card */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    주문 상품 내역
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/40">
                    초고화질 AI 렌더링
                  </span>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-stone-700 bg-stone-800 flex-shrink-0">
                    <img
                      src={targetCharacter.defaultAvatar}
                      alt={targetCharacter.koreanName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif text-base font-bold text-stone-100 truncate">
                      {targetCharacter.koreanName}의 {targetCharacter.costumeName}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      적용 대상: <span className="text-stone-200 font-medium">{celebrityName || '업로드된 연예인'}</span>
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">
                      {targetCharacter.costumeDescription}
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone-800 pt-3 flex items-center justify-between">
                  <span className="text-sm text-stone-300 font-medium">결제 금액</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-400 font-serif">
                      ${config.itemPrice} <span className="text-xs text-stone-400 font-sans font-normal">{config.currency}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">한화 약 2,600원 상당</span>
                  </div>
                </div>
              </div>

              {/* PayPal badge note */}
              <div className="rounded-xl border border-stone-800/80 bg-stone-900/40 p-3.5 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-relaxed">
                  <p className="font-semibold text-stone-200">안전한 PayPal 보안 결제 시스템</p>
                  <p className="text-stone-400 mt-0.5">
                    {config.isConfigured
                      ? 'PayPal 공인 REST 결제 엔진을 통해 전송되며 카드 번호 등 금융 정보는 안전하게 보호됩니다.'
                      : '현재 즉시 체험 가능한 PayPal Sandbox 테스트 모드가 활성화되어 있습니다. 결제 승인 후 바로 제작이 시작됩니다.'}
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-800 bg-rose-950/50 p-3.5 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm">
                  <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Payment Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* Official PayPal Style Button */}
                <button
                  type="button"
                  id="btn-confirm-paypal-pay"
                  onClick={handleInitiatePayPalPayment}
                  disabled={isProcessing || loadingConfig}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#ffc439] hover:bg-[#f4bb38] text-[#003087] font-extrabold text-base py-3.5 px-5 shadow-lg shadow-amber-950/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-[#003087]" />
                      <span>PayPal 결제 처리 중...</span>
                    </>
                  ) : (
                    <>
                      <span className="italic font-serif font-black text-lg">PayPal</span>
                      <span>로 결제하기 (${config.itemPrice})</span>
                    </>
                  )}
                </button>

                {/* PayPal Debit or Credit Card Style Button */}
                <button
                  type="button"
                  id="btn-confirm-paypal-card"
                  onClick={handleInitiatePayPalPayment}
                  disabled={isProcessing || loadingConfig}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2c2e2f] hover:bg-[#383b3d] text-white font-semibold text-sm py-3 px-4 border border-stone-700 transition-all disabled:opacity-60"
                >
                  <CreditCard className="h-4.5 w-4.5 text-stone-300" />
                  <span>신용카드 또는 체크카드 (PayPal Guest)</span>
                </button>
              </div>
            </>
          )}

          {/* Step: Processing PayPal Window */}
          {step === 'paypal_window' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#003087]/20 border border-[#003087] text-[#0079c1]">
                <RefreshCw className="h-8 w-8 animate-spin text-[#0079c1]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-stone-100">
                  PayPal 안전 결제 진행 중...
                </h4>
                <p className="text-xs sm:text-sm text-stone-400">
                  PayPal 승인 토큰을 확인하고 라이선스를 발급하고 있습니다.
                </p>
              </div>
              <div className="rounded-xl bg-stone-900/60 border border-stone-800 p-3 text-xs text-stone-400">
                주문 번호: <span className="font-mono text-amber-400">{orderInfo?.orderId}</span>
              </div>
            </div>
          )}

          {/* Step: Completed */}
          {step === 'completed' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4 animate-fadeIn">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400">
                <Check className="h-9 w-9 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-stone-100">
                  PayPal 결제가 완료되었습니다!
                </h4>
                <p className="text-xs sm:text-sm text-stone-300">
                  승인 번호: <span className="font-mono text-emerald-400">{orderInfo?.captureId}</span>
                </p>
                <p className="text-xs text-amber-400 pt-2 flex items-center justify-center gap-1">
                  <Sparkles className="h-4 w-4" /> 나노바나나 AI 의상 제작을 즉시 시작합니다...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
