"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Step = "select" | "game" | "result";
type TouchPoint = { x: number; y: number; color: string };
type RingPoint = TouchPoint & {
  id: number;
  isWinner: boolean;
  isDimmed: boolean;
};

const CAFES = [
  {
    name: "블루샥",
    logo: "/logo-blushaak.png",
    discount: 7,
    bg: "#E8F4F0",
    link: "https://link.kakaopay.com/u/payweb?bg_color=bg_grey&navigation=hide&url=https%3A%2F%2Fgood-deal-web.kakaopay.com%2Fpayment%2Fbrd-69cd09d9-47d86b-169a2d51fd%3FappType%3DKAKAOPAY%26f_referral_id%3DRC3571098572034610115%26isAuth%3Dfalse%26lockStatus%3Dfalse%26t_ch%3Dgooddeal-share&version=-492422463",
  },
  {
    name: "메가커피",
    logo: "/logo-mega.png",
    discount: 5,
    bg: "#FFF3E0",
    link: "https://link.kakaopay.com/_/Ba3hu2g?f_referral_id=RC3571098572034610115",
  },
  {
    name: "컴포즈커피",
    logo: "/logo-compose.svg",
    discount: 5,
    bg: "#F3E5F5",
    link: "https://link.kakaopay.com/_/TBPyqU8?f_referral_id=RC3571098572034610115",
  },
  {
    name: "빽다방",
    logo: "/logo-paik.png",
    discount: 4,
    bg: "#FFF8E1",
    link: "https://link.kakaopay.com/_/icIghBU?f_referral_id=RC3571098572034610115",
  },
  {
    name: "이디야",
    logo: "/logo-ediya.png",
    discount: 4,
    bg: "#E8F5E9",
    link: "https://link.kakaopay.com/_/RACjFjp?f_referral_id=RC3571098572034610115",
  },
];

const RING_COLORS = ["#FFEC00", "#3CB6E3", "#7ED557", "#FF6B9D", "#FF9F43"];

export default function Home() {
  const [step, setStep] = useState<Step>("select");
  const [selectedCafeIndex, setSelectedCafeIndex] = useState(0);
  const [rings, setRings] = useState<RingPoint[]>([]);
  const [winnerColor, setWinnerColor] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<"idle" | "counting" | "picked">(
    "idle",
  );

  const gameZoneRef = useRef<HTMLDivElement | null>(null);
  const touchesRef = useRef<Map<number, RingPoint>>(new Map());
  const selectTimerRef = useRef<number | null>(null);
  const resultTimerRef = useRef<number | null>(null);
  const colorIndexRef = useRef(0);
  const hasPickedRef = useRef(false);

  const selectedCafe = CAFES[selectedCafeIndex];
  const activeTouchCount = rings.length;

  const statusBadge = useMemo(() => {
    if (step === "select") {
      return "커피 선택";
    }

    if (step === "game") {
      return `${selectedCafe.name} ${selectedCafe.discount}%`;
    }

    return "결제 연결";
  }, [selectedCafe.discount, selectedCafe.name, step]);

  const gameStatusText = useMemo(() => {
    if (gameStatus === "picked") {
      return "🎉 선택 완료!";
    }

    if (activeTouchCount >= 2) {
      return `${activeTouchCount}명 참가 중 · 잠시 후 선택됩니다...`;
    }

    return "손가락을 올리면 자동으로 선택됩니다";
  }, [activeTouchCount, gameStatus]);

  const clearSelectTimer = useCallback(() => {
    if (selectTimerRef.current) {
      window.clearTimeout(selectTimerRef.current);
      selectTimerRef.current = null;
    }
  }, []);

  const clearResultTimer = useCallback(() => {
    if (resultTimerRef.current) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }, []);

  const syncRings = useCallback(() => {
    setRings(Array.from(touchesRef.current.values()));
  }, []);

  const resetTouchGame = useCallback(() => {
    clearSelectTimer();
    clearResultTimer();
    touchesRef.current.clear();
    colorIndexRef.current = 0;
    hasPickedRef.current = false;
    setRings([]);
    setWinnerColor(null);
    setGameStatus("idle");
  }, [clearResultTimer, clearSelectTimer]);

  const pickWinner = useCallback(() => {
    const touchEntries = Array.from(touchesRef.current.entries());

    if (touchEntries.length < 2 || hasPickedRef.current) {
      return;
    }

    clearSelectTimer();
    hasPickedRef.current = true;

    const [winnerId, winnerPoint] =
      touchEntries[Math.floor(Math.random() * touchEntries.length)];

    setWinnerColor(winnerPoint.color);

    touchesRef.current.forEach((point, id) => {
      touchesRef.current.set(id, {
        ...point,
        isWinner: id === winnerId,
        isDimmed: id !== winnerId,
      });
    });

    syncRings();
    setGameStatus("picked");

    resultTimerRef.current = window.setTimeout(() => {
      setStep("result");
    }, 1800);
  }, [clearSelectTimer, syncRings]);

  const schedulePickWinner = useCallback(() => {
    clearSelectTimer();

    if (touchesRef.current.size >= 2 && !hasPickedRef.current) {
      setGameStatus("counting");
      selectTimerRef.current = window.setTimeout(pickWinner, 1800);
      return;
    }

    setGameStatus("idle");
  }, [clearSelectTimer, pickWinner]);

  useEffect(() => {
    if (step !== "game") {
      return;
    }

    const gameZone = gameZoneRef.current;
    if (!gameZone) {
      return;
    }

    function handleTouchStart(event: TouchEvent) {
      event.preventDefault();

      if (hasPickedRef.current || !gameZone) {
        return;
      }

      const rect = gameZone.getBoundingClientRect();

      for (const touch of Array.from(event.changedTouches)) {
        const color = RING_COLORS[colorIndexRef.current % RING_COLORS.length];
        colorIndexRef.current += 1;

        touchesRef.current.set(touch.identifier, {
          id: touch.identifier,
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          color,
          isWinner: false,
          isDimmed: false,
        });
      }

      syncRings();
      schedulePickWinner();
    }

    function handleTouchMove(event: TouchEvent) {
      event.preventDefault();

      if (hasPickedRef.current || !gameZone) {
        return;
      }

      const rect = gameZone.getBoundingClientRect();

      for (const touch of Array.from(event.changedTouches)) {
        const currentTouch = touchesRef.current.get(touch.identifier);

        if (currentTouch) {
          touchesRef.current.set(touch.identifier, {
            ...currentTouch,
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          });
        }
      }

      syncRings();
    }

    function handleTouchEnd(event: TouchEvent) {
      event.preventDefault();

      if (hasPickedRef.current) {
        return;
      }

      for (const touch of Array.from(event.changedTouches)) {
        touchesRef.current.delete(touch.identifier);
      }

      syncRings();
      schedulePickWinner();
    }

    gameZone.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    gameZone.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    gameZone.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      gameZone.removeEventListener("touchstart", handleTouchStart);
      gameZone.removeEventListener("touchmove", handleTouchMove);
      gameZone.removeEventListener("touchend", handleTouchEnd);
    };
  }, [schedulePickWinner, step, syncRings]);

  useEffect(() => {
    return () => {
      clearSelectTimer();
      clearResultTimer();
    };
  }, [clearResultTimer, clearSelectTimer]);

  function startGame() {
    resetTouchGame();
    setStep("game");
  }

  function restart() {
    resetTouchGame();
    setSelectedCafeIndex(0);
    setStep("select");
  }

  return (
    <main className="min-h-dvh bg-[#F7F7F7] text-[#111111]">
      <section className="mx-auto flex min-h-dvh w-full max-w-[360px] flex-col px-4 py-4">
        <header className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFEC00] px-4 py-3 text-[#3A1D00] shadow-sm">
          <p className="min-w-0 flex-1 text-[13px] font-black leading-tight tracking-tight">
            커피내기하고 굿딜로 할인받기
          </p>
          <span className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold">
            {statusBadge}
          </span>
        </header>

        <div className="flex justify-center py-3 text-lg font-black text-[#3A1D00]">
          {step === "select" ? "●" : "○"}
          <span className="px-2 text-[#B8B8B8]">—</span>
          {step === "game" ? "●" : "○"}
          <span className="px-2 text-[#B8B8B8]">—</span>
          {step === "result" ? "●" : "○"}
        </div>

        {step === "select" && (
          <div className="flex flex-1 flex-col">
            <div className="mb-5">
              <h1 className="text-xl font-black tracking-tight">
                어떤 커피로 내기할까요?
              </h1>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                카카오페이 굿딜 혜택을 고르고 손가락 게임을 시작하세요.
              </p>
            </div>

            <div className="space-y-2">
              {CAFES.map((cafe, index) => {
                const isSelected = selectedCafeIndex === index;

                return (
                  <button
                    key={cafe.name}
                    type="button"
                    onClick={() => setSelectedCafeIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                      isSelected
                        ? "border-[#3A1D00] bg-[#FFFDE7]"
                        : "border-transparent bg-white"
                    }`}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl"
                      style={{ backgroundColor: cafe.bg }}
                    >
                      <img
                        src={cafe.logo}
                        alt={cafe.name}
                        className="h-full w-full object-contain p-1"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-black">
                        {cafe.name}
                      </span>
                      <span className="block text-xs font-semibold text-neutral-500">
                        카카오페이 굿딜
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black ${
                        cafe.name === "블루샥"
                          ? "bg-[#FFEC00] text-[#3A1D00]"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {cafe.discount}% 할인
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <div className="mb-2 rounded-2xl bg-white p-3 text-sm font-bold text-[#3A1D00]">
                블루샥이 지금 최대 할인! 오늘의 추천 ☕
              </div>
              <button
                type="button"
                onClick={startGame}
                className="w-full rounded-xl bg-[#FFEC00] px-5 py-3 text-base font-black text-[#3A1D00] shadow-sm transition active:scale-[0.99]"
              >
                게임 시작 →
              </button>
            </div>
          </div>
        )}

        {step === "game" && (
          <div className="flex flex-1 flex-col">
            <div className="mb-4 text-center">
              <h1 className="text-2xl font-black tracking-tight">
                손가락 내기 게임
              </h1>
            </div>

            <div
              ref={gameZoneRef}
              className="relative grid aspect-[9/14] w-full overflow-hidden rounded-2xl bg-[#0F0F20] transition-colors duration-300"
              style={{
                touchAction: "none",
                backgroundColor: winnerColor ?? "#0F0F20",
              }}
            >
              <div
                className={`pointer-events-none m-auto px-8 text-center text-lg font-black leading-snug text-white transition-opacity ${
                  activeTouchCount > 0 ? "opacity-0" : "opacity-100"
                }`}
              >
                모두 손가락을 화면에 올려주세요
              </div>

              {rings.map((ring) => (
                <div
                  key={ring.id}
                  className="pointer-events-none absolute rounded-full transition-all duration-300"
                  style={{
                    left: ring.x,
                    top: ring.y,
                    width: ring.isWinner ? 120 : 100,
                    height: ring.isWinner ? 120 : 100,
                    opacity: ring.isDimmed ? 0 : 1,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {!ring.isDimmed && !ring.isWinner && (
                    <span
                      className="absolute inset-0 animate-ping rounded-full opacity-35"
                      style={{
                        backgroundColor: ring.color,
                      }}
                    />
                  )}
                  {ring.isWinner ? (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: "#0F0F20",
                        boxShadow: "0 0 32px rgba(15, 15, 32, 0.35)",
                      }}
                    >
                      <span
                        className="absolute left-1/2 top-1/2 h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          backgroundColor: "transparent",
                          border: `4px solid ${ring.color}`,
                        }}
                      />
                    </span>
                  ) : (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: `4px solid ${ring.color}`,
                        boxShadow: "0 0 18px rgba(255, 255, 255, 0.15)",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-2 rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-[#3A1D00]">
              {gameStatusText}
            </p>
            <button
              type="button"
              onClick={() => {
                resetTouchGame();
                setStep("select");
              }}
              className="mt-3 w-full rounded-xl bg-[#FFEC00] px-5 py-3 text-base font-black text-[#3A1D00] shadow-sm transition active:scale-[0.99]"
            >
              ← 커피 다시 선택
            </button>
          </div>
        )}

        {step === "result" && (
          <div className="flex flex-1 flex-col">
            <div className="py-5 text-center">
              <h1 className="text-2xl font-black tracking-tight text-[#111111]">
                커피 한 잔 쏘는 날이에요 ☕
              </h1>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                오늘의 커피값은 당신 몫!
              </p>
            </div>

            <article className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div
                className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-[2rem]"
                style={{ backgroundColor: selectedCafe.bg }}
              >
                <img
                  src={selectedCafe.logo}
                  alt={selectedCafe.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>

              <div className="mt-4 inline-flex rounded-full bg-[#FFEC00] px-4 py-2 text-sm font-black text-[#3A1D00]">
                {selectedCafe.name} 쏘기 당첨! 🎯
              </div>

              <p className="mt-3 text-sm font-medium leading-6 text-neutral-500">
                카카오페이가 {selectedCafe.discount}% 할인으로 조금 더 달게
                만들어 드릴게요
              </p>

              <a
                href={selectedCafe.link}
                className="mt-7 block w-full rounded-xl bg-[#FFEC00] px-5 py-4 text-sm font-black leading-5 text-[#3A1D00] transition active:scale-[0.99]"
              >
                굿딜로 {selectedCafe.name} {selectedCafe.discount}% 할인받고
                결제하기
              </a>

              <button
                type="button"
                onClick={restart}
                className="mt-3 text-sm font-black text-neutral-500 underline underline-offset-4"
              >
                다시 하기
              </button>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
