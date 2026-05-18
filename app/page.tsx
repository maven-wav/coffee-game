"use client";

import { FormEvent, useMemo, useState } from "react";

type DrawHistory = {
  id: number;
  winner: string;
  participants: string[];
  createdAt: string;
};

const starterNames = ["민수", "지은", "현우", "서연"];

export default function Home() {
  const [participants, setParticipants] = useState<string[]>(starterNames);
  const [name, setName] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<DrawHistory[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canDraw = participants.length >= 2 && !isDrawing;

  const participantSummary = useMemo(() => {
    if (participants.length === 0) {
      return "아직 참가자가 없어요";
    }

    return `${participants.length}명이 커피 운명을 기다리는 중`;
  }, [participants.length]);

  function addParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = name.trim();
    if (!nextName || participants.includes(nextName)) {
      setName("");
      return;
    }

    setParticipants((current) => [...current, nextName]);
    setName("");
    setWinner(null);
  }

  function removeParticipant(targetName: string) {
    setParticipants((current) => current.filter((item) => item !== targetName));
    setWinner((currentWinner) =>
      currentWinner === targetName ? null : currentWinner,
    );
  }

  function drawCoffeeBuyer() {
    if (!canDraw) {
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    window.setTimeout(() => {
      const selected =
        participants[Math.floor(Math.random() * participants.length)];
      const createdAt = new Intl.DateTimeFormat("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());

      setWinner(selected);
      setHistory((current) => [
        {
          id: Date.now(),
          winner: selected,
          participants,
          createdAt,
        },
        ...current.slice(0, 4),
      ]);
      setIsDrawing(false);
    }, 900);
  }

  function resetGame() {
    setParticipants(starterNames);
    setWinner(null);
    setHistory([]);
    setName("");
    setIsDrawing(false);
  }

  return (
    <main className="min-h-screen bg-[#f7efe3] text-[#2d1b12]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#9b5a2e]">
              Coffee Game
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              오늘 커피는 누가 쏠까?
            </h1>
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="rounded-full border border-[#2d1b12]/15 bg-white/70 px-5 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            처음부터
          </button>
        </header>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#3b2417] p-6 text-white shadow-2xl shadow-[#6f3c18]/20 sm:p-10">
            <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-[#f7b267]/20 blur-3xl" />
            <div className="absolute bottom-0 left-8 h-44 w-44 rounded-full bg-[#d4a373]/20 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <p className="text-sm font-semibold text-[#f7d7b1]">
                  {participantSummary}
                </p>
                <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <p className="text-sm font-semibold text-[#f7d7b1]">
                    오늘의 당첨자
                  </p>
                  <div className="mt-4 min-h-36">
                    {isDrawing ? (
                      <div className="flex h-36 items-center justify-center">
                        <div className="h-20 w-20 animate-spin rounded-full border-8 border-[#f7d7b1]/20 border-t-[#f7d7b1]" />
                      </div>
                    ) : winner ? (
                      <div>
                        <p className="text-6xl font-black tracking-tight sm:text-8xl">
                          {winner}
                        </p>
                        <p className="mt-4 text-lg text-[#f7d7b1]">
                          축하합니다. 오늘 커피는 시원하게 한 잔 쏘기!
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-5xl font-black tracking-tight sm:text-7xl">
                          Ready?
                        </p>
                        <p className="mt-4 text-lg text-[#f7d7b1]">
                          참가자 2명 이상이면 바로 추첨할 수 있어요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={drawCoffeeBuyer}
                disabled={!canDraw}
                className="rounded-full bg-[#ffb703] px-8 py-5 text-xl font-black text-[#2d1b12] shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:bg-[#ffc83d] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isDrawing ? "추첨 중..." : "커피 쏠 사람 뽑기"}
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-[#6f3c18]/10">
              <h2 className="text-xl font-black">참가자</h2>
              <form onSubmit={addParticipant} className="mt-4 flex gap-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="이름 입력"
                  className="min-w-0 flex-1 rounded-full border border-[#2d1b12]/10 bg-[#f7efe3] px-4 py-3 outline-none transition focus:border-[#9b5a2e]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#2d1b12] px-5 py-3 font-bold text-white transition hover:bg-[#4a2b1b]"
                >
                  추가
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <button
                    key={participant}
                    type="button"
                    onClick={() => removeParticipant(participant)}
                    className="rounded-full bg-[#f7efe3] px-4 py-2 text-sm font-bold transition hover:bg-[#ead7bf]"
                    title="클릭하면 참가자에서 제외됩니다"
                  >
                    {participant} ×
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-[#6f3c18]/10">
              <h2 className="text-xl font-black">최근 결과</h2>
              <div className="mt-4 space-y-3">
                {history.length > 0 ? (
                  history.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#2d1b12]/10 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-black">{item.winner}</p>
                        <time className="text-xs font-semibold text-[#9b5a2e]">
                          {item.createdAt}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-[#6f4b37]">
                        {item.participants.join(", ")}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#f7efe3] p-4 text-sm font-semibold text-[#6f4b37]">
                    아직 추첨 기록이 없어요.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
