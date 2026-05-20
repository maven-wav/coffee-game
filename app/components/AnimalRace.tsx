"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ANIMALS = [
  { emoji: "🐢", name: "거북이" },
  { emoji: "🐌", name: "달팽이" },
  { emoji: "🐎", name: "말" },
  { emoji: "🐆", name: "치타" },
  { emoji: "🐇", name: "토끼" },
  { emoji: "🐶", name: "강아지" },
  { emoji: "🐱", name: "고양이" },
  { emoji: "🐧", name: "펭귄" },
];

const BOOST_TEXTS = ["추월 중! 🚀", "막판 스퍼트!"];
const STUMBLE_TEXTS = ["넘어짐! 💥", "딴짓 중 🙃", "쉬는 중 😴"];

type Phase = "setup" | "reveal" | "race" | "result";

type Animal = (typeof ANIMALS)[number];

type Participant = {
  id: number;
  name: string;
  animal: Animal;
};

type Racer = {
  id: number;
  position: number;
  finished: boolean;
  finishOrder: number | null;
  eventText: string | null;
  eventCooldown: number;
};

export type AnimalRaceCafe = {
  name: string;
  discount: number;
  link: string;
};

type AnimalRaceProps = {
  selectedCafe: AnimalRaceCafe;
  onComplete?: () => void;
  onBack?: () => void;
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rankBadgeStyle(rank: number, total: number) {
  if (rank === 1) return { bg: "#FFEC00", text: "#3A1D00", extra: "" };
  if (rank === 2) return { bg: "#C0C0C0", text: "#111111", extra: "" };
  if (rank === 3) return { bg: "#EF9F27", text: "#FFFFFF", extra: "" };
  if (rank === total) return { bg: "#E24B4A", text: "#FFFFFF", extra: " 💸" };
  return { bg: "#333355", text: "#FFFFFF", extra: "" };
}

export default function AnimalRace({
  selectedCafe,
  onComplete,
  onBack,
}: AnimalRaceProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [finishCounter, setFinishCounter] = useState(0);
  const [results, setResults] = useState<Participant[]>([]);

  const intervalRef = useRef<number | null>(null);
  const finishCounterRef = useRef(0);
  const raceEndedRef = useRef(false);
  const eventTimersRef = useRef<Map<number, number>>(new Map());

  const clearRaceInterval = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearEventTimers = useCallback(() => {
    eventTimersRef.current.forEach((id) => window.clearTimeout(id));
    eventTimersRef.current.clear();
  }, []);

  useEffect(() => {
    setNames((prev) => {
      const next = Array.from({ length: playerCount }, (_, i) => prev[i] ?? "");
      return next;
    });
  }, [playerCount]);

  useEffect(() => {
    if (phase !== "reveal") return;
    setRevealedCount(0);
    const timers: number[] = [];
    for (let i = 0; i < participants.length; i++) {
      timers.push(
        window.setTimeout(() => setRevealedCount((c) => c + 1), (i + 1) * 120),
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, participants.length]);

  useEffect(() => {
    return () => {
      clearRaceInterval();
      clearEventTimers();
    };
  }, [clearEventTimers, clearRaceInterval]);

  function handleReveal() {
    const assigned = shuffle(ANIMALS).slice(0, playerCount);
    const next: Participant[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: names[i].trim() || `${i + 1}번 참가자`,
      animal: assigned[i],
    }));
    setParticipants(next);
    setPhase("reveal");
  }

  function startRace() {
    clearRaceInterval();
    clearEventTimers();
    finishCounterRef.current = 0;
    raceEndedRef.current = false;
    setFinishCounter(0);
    setResults([]);

    const initial: Racer[] = participants.map((p) => ({
      id: p.id,
      position: 0,
      finished: false,
      finishOrder: null,
      eventText: null,
      eventCooldown: 0,
    }));
    setRacers(initial);
    setPhase("race");

    intervalRef.current = window.setInterval(() => {
      setRacers((prev) => {
        let nextFinish = finishCounterRef.current;
        const updated = prev.map((racer) => {
          if (racer.finished) return racer;

          let speed = 0.5 + Math.random() * 1.1;
          let eventText = racer.eventText;
          let eventCooldown = Math.max(0, racer.eventCooldown - 1);

          if (eventCooldown === 0 && Math.random() < 0.04) {
            if (Math.random() < 0.5) {
              speed *= 2.8;
              eventText = pickRandom(BOOST_TEXTS);
            } else {
              speed = 0;
              eventText = pickRandom(STUMBLE_TEXTS);
            }
            eventCooldown = 18;

            const existing = eventTimersRef.current.get(racer.id);
            if (existing) window.clearTimeout(existing);
            const timerId = window.setTimeout(() => {
              setRacers((current) =>
                current.map((r) =>
                  r.id === racer.id ? { ...r, eventText: null } : r,
                ),
              );
              eventTimersRef.current.delete(racer.id);
            }, 900);
            eventTimersRef.current.set(racer.id, timerId);
          }

          let position = racer.position + speed;
          let finished: boolean = racer.finished;
          let finishOrder = racer.finishOrder;

          if (position >= 100) {
            position = 100;
            finished = true;
            nextFinish += 1;
            finishOrder = nextFinish;
          }

          return {
            ...racer,
            position,
            finished,
            finishOrder,
            eventText,
            eventCooldown,
          };
        });

        finishCounterRef.current = nextFinish;
        setFinishCounter(nextFinish);

        if (
          updated.every((r) => r.finished) &&
          updated.length > 0 &&
          !raceEndedRef.current
        ) {
          raceEndedRef.current = true;
          clearRaceInterval();
          const ordered = [...participants].sort((a, b) => {
            const fa = updated.find((r) => r.id === a.id)?.finishOrder ?? 999;
            const fb = updated.find((r) => r.id === b.id)?.finishOrder ?? 999;
            return fa - fb;
          });
          window.setTimeout(() => {
            setResults(ordered);
            setPhase("result");
          }, 900);
        }

        return updated;
      });
    }, 50);
  }

  function handleRetry() {
    clearRaceInterval();
    clearEventTimers();
    setPhase("setup");
    setParticipants([]);
    setRevealedCount(0);
    setRacers([]);
    setResults([]);
    finishCounterRef.current = 0;
    raceEndedRef.current = false;
    setFinishCounter(0);
  }

  const loser = results[results.length - 1];
  const podium = results.slice(0, 3);
  const podiumMedals = ["🥇", "🥈", "🥉"];

  if (phase === "setup") {
    return (
      <div className="flex flex-1 flex-col bg-white px-1 py-2">
        <h2 className="text-center text-lg font-bold text-[#111111]">
          몇 명이서 하나요?
        </h2>
        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => setPlayerCount((c) => Math.max(2, c - 1))}
            disabled={playerCount <= 2}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#F7F7F7] text-xl font-bold text-[#111111] disabled:opacity-40"
          >
            −
          </button>
          <span className="text-5xl font-black text-[#FFEC00] drop-shadow-sm">
            {playerCount}
          </span>
          <button
            type="button"
            onClick={() => setPlayerCount((c) => Math.min(8, c + 1))}
            disabled={playerCount >= 8}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#F7F7F7] text-xl font-bold text-[#111111] disabled:opacity-40"
          >
            +
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {names.map((name, index) => (
            <li key={index} className="flex items-center gap-3">
              <span
                className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl border border-dashed border-[#D0D0D0] bg-[#F7F7F7] text-lg text-[#BBBBBB]"
                aria-hidden
              >
                ❓
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const next = [...names];
                  next[index] = e.target.value;
                  setNames(next);
                }}
                placeholder={`${index + 1}번 참가자 이름`}
                className="min-w-0 flex-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-3 text-sm text-[#111111] outline-none placeholder:text-[#BBBBBB] focus:border-[#FFEC00]"
              />
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center text-xs text-[#999999]">
          레디하면 동물이 랜덤 공개돼요
        </p>

        <button
          type="button"
          onClick={handleReveal}
          className="mt-6 w-full rounded-xl bg-[#FFEC00] px-5 py-4 text-sm font-black text-[#3A1D00] transition active:scale-[0.99]"
        >
          준비 완료 — 동물 공개!
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-center text-sm font-medium text-[#999999] underline underline-offset-4"
          >
            ← 게임 선택으로
          </button>
        )}
      </div>
    );
  }

  if (phase === "reveal") {
    return (
      <div className="-mx-4 flex flex-1 flex-col bg-[#0F0F20] px-4 py-6">
        <h2 className="text-center text-lg font-bold text-white">
          내 동물은...?! 🎲
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {participants.map((p, index) => (
            <div
              key={p.id}
              className="rounded-[14px] bg-[#1A1A2E] p-4 text-center transition-all duration-300"
              style={{
                opacity: index < revealedCount ? 1 : 0,
                transform: index < revealedCount ? "scale(1)" : "scale(0.8)",
              }}
            >
              <span className="text-4xl">{p.animal.emoji}</span>
              <p className="mt-2 text-sm font-bold text-[#FFEC00]">
                {p.animal.name}
              </p>
              <p className="mt-1 text-xs font-medium text-white">{p.name}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={startRace}
          disabled={revealedCount < participants.length}
          className="mt-auto w-full rounded-xl bg-[#FFEC00] px-5 py-4 text-sm font-black text-[#3A1D00] transition active:scale-[0.99] disabled:opacity-50"
        >
          🏁 경주 시작!
        </button>
      </div>
    );
  }

  if (phase === "race") {
    const sorted = [...racers].sort((a, b) => b.position - a.position);

    return (
      <div className="-mx-4 flex flex-1 flex-col bg-[#0F0F20] px-4 py-4">
        <p className="mb-3 text-center text-sm font-bold text-neutral-400">
          완주 {finishCounter} / {participants.length}
        </p>
        <div className="space-y-3 rounded-2xl bg-[#1A1A2E] p-3">
          {participants.map((p) => {
            const racer = racers.find((r) => r.id === p.id);
            if (!racer) return null;

            const rank =
              sorted.findIndex((r) => r.id === p.id) + 1;
            const badge = rankBadgeStyle(rank, participants.length);

            return (
              <div key={p.id} className="relative">
                {racer.eventText && (
                  <span className="absolute -top-2 left-12 z-10 rounded-full bg-[#FFEC00] px-2 py-0.5 text-[10px] font-black text-[#3A1D00]">
                    {racer.eventText}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                    }}
                  >
                    {rank}
                    {badge.extra}
                  </span>
                  <div className="relative h-10 min-w-0 flex-1 overflow-hidden rounded-lg bg-[#0F0F20]">
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-2xl transition-[left] duration-75"
                      style={{ left: `calc(${racer.position}% - 14px)` }}
                    >
                      {p.animal.emoji}
                    </span>
                  </div>
                  <span className="text-sm" aria-hidden>
                    🏁
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 flex flex-1 flex-col bg-[#0F0F20] px-4 py-6">
      {loser && (
        <div className="rounded-2xl bg-[#E24B4A] p-5 text-center">
          <span className="text-5xl">{loser.animal.emoji}</span>
          <p className="mt-2 text-sm font-bold text-white/90">
            꼴등 — 커피 쏘는 사람
          </p>
          <p className="mt-1 text-xl font-black text-white">{loser.name}</p>
        </div>
      )}

      <ul className="mt-5 space-y-2">
        {podium.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl bg-[#1A1A2E] px-4 py-3"
          >
            <span className="text-xl">{podiumMedals[i]}</span>
            <span className="text-2xl">{p.animal.emoji}</span>
            <span className="flex-1 text-sm font-bold text-white">
              {p.name}
            </span>
            <span className="text-xs text-[#FFEC00]">{p.animal.name}</span>
          </li>
        ))}
        {results.slice(3, -1).map((p) => {
          const place = results.indexOf(p) + 1;
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-[#1A1A2E] px-4 py-2.5"
            >
              <span className="w-6 text-center text-sm font-bold text-neutral-500">
                {place}
              </span>
              <span className="text-xl">{p.animal.emoji}</span>
              <span className="flex-1 text-sm text-white">{p.name}</span>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleRetry}
        className="mt-6 w-full rounded-xl border-2 border-[#FFEC00] bg-transparent px-5 py-3 text-sm font-black text-[#FFEC00]"
      >
        ↩ 다시 하기
      </button>

      <a
        href={selectedCafe.link}
        onClick={() => onComplete?.()}
        className="mt-3 block w-full rounded-xl bg-[#FFEC00] px-5 py-4 text-center text-sm font-black text-[#3A1D00] transition active:scale-[0.99]"
      >
        카카오페이 굿딜로 결제하기 ☕
      </a>
    </div>
  );
}
