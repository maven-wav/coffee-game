"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Phase = "setup" | "play";

type PirateRouletteProps = {
  onComplete: () => void;
};

type Expression = "calm" | "nervous" | "anxious" | "scared" | "dead";

function playClickSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    /* audio unavailable */
  }
}

function playWinSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* audio unavailable */
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function getExpression(
  currentSlot: number,
  totalSlots: number,
  isDead: boolean,
): Expression {
  if (isDead) return "dead";
  if (totalSlots === 0) return "calm";
  const ratio = currentSlot / totalSlots;
  if (ratio <= 0.25) return "calm";
  if (ratio <= 0.5) return "nervous";
  if (ratio <= 0.75) return "anxious";
  return "scared";
}

function slotPosition(index: number, total: number) {
  const angle = Math.PI + ((index + 0.5) / total) * Math.PI;
  return {
    x: 150 + 88 * Math.cos(angle),
    y: 118 + 88 * Math.sin(angle),
  };
}

function BarrelEyes({ expression }: { expression: Expression }) {
  const eyeY = 168;
  const leftX = 128;
  const rightX = 172;

  if (expression === "dead") {
    return (
      <g stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
        <line x1={leftX - 8} y1={eyeY - 8} x2={leftX + 8} y2={eyeY + 8} />
        <line x1={leftX + 8} y1={eyeY - 8} x2={leftX - 8} y2={eyeY + 8} />
        <line x1={rightX - 8} y1={eyeY - 8} x2={rightX + 8} y2={eyeY + 8} />
        <line x1={rightX + 8} y1={eyeY - 8} x2={rightX - 8} y2={eyeY + 8} />
      </g>
    );
  }

  const eyeClass =
    expression === "anxious"
      ? "pirate-eye-wobble"
      : expression === "scared"
        ? "pirate-eye-shake"
        : "";

  return (
    <g className={eyeClass}>
      <ellipse cx={leftX} cy={eyeY} rx="14" ry="16" fill="#fff" />
      <ellipse cx={rightX} cy={eyeY} rx="14" ry="16" fill="#fff" />
      <circle
        cx={leftX}
        cy={eyeY + (expression === "scared" ? 2 : 0)}
        r={expression === "scared" ? 7 : 6}
        fill="#1a1a1a"
      />
      <circle
        cx={rightX}
        cy={eyeY + (expression === "scared" ? 2 : 0)}
        r={expression === "scared" ? 7 : 6}
        fill="#1a1a1a"
      />
      {expression === "nervous" && (
        <circle cx={185} cy={148} r="5" fill="#87CEEB" opacity="0.9" />
      )}
      {expression === "anxious" && (
        <>
          <path
            d="M 108 152 Q 100 148 108 144"
            fill="none"
            stroke="#87CEEB"
            strokeWidth="2"
          />
          <path
            d="M 192 152 Q 200 148 192 144"
            fill="none"
            stroke="#87CEEB"
            strokeWidth="2"
          />
        </>
      )}
      {expression === "scared" && (
        <>
          <path
            d="M 105 150 Q 95 145 105 140"
            fill="none"
            stroke="#87CEEB"
            strokeWidth="2.5"
          />
          <path
            d="M 195 150 Q 205 145 195 140"
            fill="none"
            stroke="#87CEEB"
            strokeWidth="2.5"
          />
        </>
      )}
    </g>
  );
}

function KnifeIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1="0" y1="14" x2="0" y2="-6" stroke="#C0C0C0" strokeWidth="3" />
      <polygon points="0,-14 -5,-4 5,-4" fill="#E8E8E8" stroke="#888" strokeWidth="1" />
      <rect x="-4" y="10" width="8" height="6" rx="1" fill="#5D4037" />
    </g>
  );
}

export default function PirateRoulette({ onComplete }: PirateRouletteProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState(4);
  const [totalSlots, setTotalSlots] = useState(8);
  const [winSlot, setWinSlot] = useState(0);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [insertedSlots, setInsertedSlots] = useState<number[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [isStabbing, setIsStabbing] = useState(false);
  const completeTimerRef = useRef<number | null>(null);

  const expression = useMemo(
    () => getExpression(currentSlot, totalSlots, isDead),
    [currentSlot, totalSlots, isDead],
  );

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearCompleteTimer();
  }, [clearCompleteTimer]);

  function startPlay() {
    const slots = players * 2;
    setTotalSlots(slots);
    setWinSlot(Math.floor(Math.random() * slots));
    setCurrentSlot(0);
    setInsertedSlots([]);
    setIsShaking(false);
    setIsFalling(false);
    setIsDead(false);
    setFlashRed(false);
    setIsStabbing(false);
    setPhase("play");
  }

  function handleStab() {
    if (isStabbing || isFalling || phase !== "play") return;

    setIsStabbing(true);

    if (currentSlot === winSlot) {
      setIsDead(true);
      setIsFalling(true);
      setFlashRed(true);
      vibrate([200, 100, 200]);
      playWinSound();
      window.setTimeout(() => setFlashRed(false), 300);
      completeTimerRef.current = window.setTimeout(() => {
        onComplete();
      }, 800);
      return;
    }

    setInsertedSlots((prev) => [...prev, currentSlot]);
    setIsShaking(true);
    vibrate(100);
    playClickSound();
    setCurrentSlot((s) => s + 1);
    window.setTimeout(() => {
      setIsShaking(false);
      setIsStabbing(false);
    }, 300);
  }

  if (phase === "setup") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#0F0F20] px-4 py-8">
        <p className="text-center text-xl font-bold text-white">
          몇 명이서 하나요?
        </p>
        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setPlayers((p) => Math.max(2, p - 1))}
            disabled={players <= 2}
            className="grid h-12 w-12 place-items-center rounded-full bg-[#1A1A2E] text-2xl font-black text-white disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center text-6xl font-black text-[#FFEC00]">
            {players}
          </span>
          <button
            type="button"
            onClick={() => setPlayers((p) => Math.min(6, p + 1))}
            disabled={players >= 6}
            className="grid h-12 w-12 place-items-center rounded-full bg-[#1A1A2E] text-2xl font-black text-white disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={startPlay}
          className="mt-12 w-full max-w-[280px] rounded-xl bg-[#FFEC00] px-5 py-4 text-base font-black text-[#111111] transition active:scale-[0.99]"
        >
          시작하기
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-1 flex-col bg-[#0F0F20] px-4 py-4 transition-colors duration-300 ${
        flashRed ? "bg-red-600" : ""
      }`}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className={`transition-transform duration-[600ms] ease-in ${
            isShaking ? "pirate-shake" : ""
          } ${isFalling ? "pirate-fall" : ""}`}
        >
          <svg
            viewBox="0 0 300 280"
            className="h-auto w-full max-w-[280px]"
            aria-hidden
          >
            <defs>
              <linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B4513" />
                <stop offset="50%" stopColor="#A0522D" />
                <stop offset="100%" stopColor="#8B4513" />
              </linearGradient>
            </defs>

            {Array.from({ length: totalSlots }, (_, i) => {
              const { x, y } = slotPosition(i, totalSlots);
              const filled = insertedSlots.includes(i);
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill={filled ? "#3d2817" : "#5D4037"}
                    stroke="#3E2723"
                    strokeWidth="2"
                  />
                  {filled && <KnifeIcon x={x} y={y} />}
                </g>
              );
            })}

            <ellipse cx="150" cy="195" rx="95" ry="75" fill="url(#wood)" />
            <ellipse
              cx="150"
              cy="195"
              rx="88"
              ry="68"
              fill="none"
              stroke="#6D4C41"
              strokeWidth="2"
              opacity="0.5"
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M ${95 + i * 22} 130 Q ${150} ${200 + i * 3} ${205 - i * 22} 130`}
                fill="none"
                stroke="#6D4C41"
                strokeWidth="2"
                opacity="0.35"
              />
            ))}

            <ellipse cx="150" cy="130" rx="100" ry="35" fill="#A0522D" />
            <ellipse cx="150" cy="125" rx="95" ry="30" fill="#8B4513" />

            <BarrelEyes expression={expression} />

            {expression === "calm" && (
              <path
                d="M 135 198 Q 150 205 165 198"
                fill="none"
                stroke="#3E2723"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
            {expression === "nervous" && (
              <path
                d="M 138 200 Q 150 196 162 200"
                fill="none"
                stroke="#3E2723"
                strokeWidth="2"
              />
            )}
            {(expression === "anxious" || expression === "scared") && (
              <ellipse cx="150" cy="202" rx="8" ry="10" fill="#3E2723" />
            )}
          </svg>
        </div>
      </div>

      <div className="pb-4">
        <p className="mb-3 text-center text-sm font-bold text-neutral-400">
          {currentSlot + 1} / {totalSlots}
        </p>
        <button
          type="button"
          onClick={handleStab}
          disabled={isStabbing || isFalling}
          className="w-full rounded-xl border-2 border-[#FFEC00] bg-[#1A1A2E] px-5 py-4 text-base font-black text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          칼 꽂기 🗡️
        </button>
      </div>
    </div>
  );
}
