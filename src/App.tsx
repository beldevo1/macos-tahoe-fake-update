import { useEffect, useRef, useState } from "react";

const AppleLogo = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
  </svg>
);

type Config = {
  duration: number;
  realisticPauses: boolean;
  hideCursor: boolean;
  autoFullscreen: boolean;
  playChime: boolean;
  showRemaining: boolean;
  stuckAtEnd: boolean;
};

export default function App() {
  const [config, setConfig] = useState<Config>({
    duration: 5,
    realisticPauses: true,
    hideCursor: true,
    autoFullscreen: true,
    playChime: true,
    showRemaining: true,
    stuckAtEnd: false,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Preparing update…");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [escapeCount, setEscapeCount] = useState(0);

  const simulationRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const pauseAccumRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);

  const presets = [
    { label: "Quick 2m", value: 2 },
    { label: "Classic 5m", value: 5 },
    { label: "Prank 15m", value: 15 },
    { label: "Evil 30m", value: 30 },
  ];

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      [659, 784, 1046].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.02);
        osc.connect(gain);
        osc.start(now + i * 0.02);
        osc.stop(now + 1.5);
      });
    } catch {}
  };

  const startSimulation = async () => {
    setProgress(0);
    setStatusText("Preparing update…");
    setIsSimulating(true);
    startTimeRef.current = Date.now();
    pauseAccumRef.current = 0;
    pausedRef.current = false;

    if (config.playChime) playChime();

    if (config.autoFullscreen && simulationRef.current) {
      try {
        await simulationRef.current.requestFullscreen();
      } catch {}
    }
  };

  const exitSimulation = async () => {
    setIsSimulating(false);
    setProgress(0);
    setEscapeCount(0);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }
    cancelAnimationFrame(animationRef.current);
  };

  useEffect(() => {
    if (!isSimulating) return;

    const totalMs = config.duration * 60 * 1000;
    const pausePoints = config.realisticPauses
      ? [
          { at: 12, duration: 4000 + Math.random() * 3000 },
          { at: 27, duration: 6000 + Math.random() * 4000 },
          { at: 48, duration: 8000 + Math.random() * 5000 },
          { at: 71, duration: 10000 + Math.random() * 6000 },
          { at: 86, duration: 7000 + Math.random() * 4000 },
        ]
      : [];
    const triggered = new Set<number>();

    const update = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current - pauseAccumRef.current;
      let baseProgress = Math.min(99.9, (elapsed / totalMs) * 100);

      if (config.stuckAtEnd) {
        baseProgress = Math.min(baseProgress, 87 + Math.sin(now / 2000) * 0.3);
      }

      // Handle pauses
      for (const point of pausePoints) {
        if (
          baseProgress >= point.at &&
          baseProgress < point.at + 2 &&
          !triggered.has(point.at) &&
          !pausedRef.current
        ) {
          triggered.add(point.at);
          pausedRef.current = true;
          const pauseStart = Date.now();
          setStatusText("Verifying update…");
          setTimeout(() => {
            pauseAccumRef.current += Date.now() - pauseStart;
            pausedRef.current = false;
          }, point.duration);
          break;
        }
      }

      if (!pausedRef.current) {
        setProgress(baseProgress);
      }

      // Update texts
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingMins = Math.ceil(remainingMs / 60000);
      const remainingSecs = Math.ceil(remainingMs / 1000);

      if (config.showRemaining) {
        if (remainingSecs < 30) {
          setTimeRemaining("Less than a minute remaining");
        } else if (remainingMins <= 1) {
          setTimeRemaining("About a minute remaining");
        } else if (remainingMins < 60) {
          setTimeRemaining(`About ${remainingMins} minutes remaining`);
        } else {
          const hrs = Math.floor(remainingMins / 60);
          const mins = remainingMins % 60;
          setTimeRemaining(`About ${hrs} hour${hrs > 1 ? "s" : ""}${mins ? ` ${mins} min` : ""} remaining`);
        }
      }

      if (baseProgress < 5) {
        setStatusText("Preparing macOS Tahoe update…");
      } else if (baseProgress < 20) {
        setStatusText("Installing macOS Tahoe…");
      } else if (baseProgress < 45) {
        setStatusText(config.showRemaining ? timeRemaining : "Installing...");
      } else if (baseProgress < 70) {
        setStatusText("Updating system files…");
      } else if (baseProgress < 90) {
        setStatusText(config.showRemaining ? timeRemaining : "Finalizing update…");
      } else {
        setStatusText("Your Mac will restart to complete the update");
      }

      if (baseProgress >= 99.9 && !config.stuckAtEnd) {
        setProgress(100);
        setStatusText("Installation complete. Restarting…");
        setTimeout(() => {
          exitSimulation();
        }, 2500);
        return;
      }

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, config, timeRemaining]);

  useEffect(() => {
    if (!isSimulating) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEscapeCount((c) => c + 1);
        setTimeout(() => setEscapeCount(0), 1500);
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === "p") {
        exitSimulation();
      }
      // Block common exits
      if (["F11", "F12"].includes(e.key)) e.preventDefault();
    };

    const handleContext = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", handleKey);
    window.addEventListener("contextmenu", handleContext);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("contextmenu", handleContext);
    };
  }, [isSimulating]);

  useEffect(() => {
    if (escapeCount >= 3) {
      exitSimulation();
    }
  }, [escapeCount]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050810] text-white selection:bg-white/20">
      {/* Tahoe background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_-20%,#1a3a6e_0%,transparent_60%),radial-gradient(800px_600px_at_80%_20%,#0d5f7a_0%,transparent_50%),radial-gradient(600px_400px_at_20%_30%,#2a4b8d_0%,transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(transparent_0%,transparent_calc(50%-1px),rgba(255,255,255,0.1)_50%,transparent_calc(50%+1px),transparent_100%),linear-gradient(90deg,transparent_0%,transparent_calc(50%-1px),rgba(255,255,255,0.1)_50%,transparent_calc(50%+1px),transparent_100%)] [background-size:40px_40px]" />
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#3b82f6]/20 blur-[180px]" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#06b6d4]/20 blur-[150px]" />
      </div>

      {/* Main UI */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-2xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
                <AppleLogo className="h-5 w-5 text-white/90" />
              </div>
              <div>
                <h1 className="text-[15px] font-medium tracking-wide text-white/90">macOS Tahoe</h1>
                <p className="-mt-1 text-[12px] text-white/50">Update Prank Simulator • v26.0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-white/60 ring-1 ring-white/10 backdrop-blur-xl sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Liquid Glass Ready
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left: Controls */}
              <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent" />
                <div className="relative p-7 sm:p-9">
                  <div className="mb-8 flex items-start justify-between">
                    <div>
                      <h2 className="text-[28px] font-semibold tracking-tight text-white">Update Simulator</h2>
                      <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/60">
                        Prank your friends with a pixel-perfect macOS Tahoe update screen. Set the timer,
                        hit start, and watch them panic.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-black/40 p2.5 ring-1 ring-white/10 backdrop-blur-xl">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-white/15 to-white/5 ring-1 ring-white/15">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="1.5">
                          <path d="M12 16v-4M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-5">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-[13px] font-medium uppercase tracking-wider text-white/50">Duration</label>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[13px] font-medium tabular-nums text-white/90 ring-1 ring-white/15">
                            {config.duration} min
                          </span>
                          <span className="text-[11px] text-white/40">≈ {Math.round(config.duration * 0.7)}–{config.duration} min real</span>
                        </div>
                      </div>
                      <div className="group relative">
                        <input
                          type="range"
                          min="1"
                          max="60"
                          value={config.duration}
                          onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                          className="h-[36px] w-full cursor-pointer appearance-none bg-transparent"
                          style={{
                            background: `linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) ${config.duration/60*100}%, rgba(255,255,255,0.15) ${config.duration/60*100}%, rgba(255,255,255,0.15) 100%)`,
                            height: '4px',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {presets.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setConfig({ ...config, duration: p.value })}
                            className={`group relative overflow-hidden rounded-xl border px-3 py-2 text-[12px] font-medium transition-all ${
                              config.duration === p.value
                                ? "border-white/30 bg-white/15 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                                : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white/90"
                            }`}
                          >
                            <span className="relative z-10">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { key: "realisticPauses", label: "Realistic pauses", desc: "Stalls at 27%, 48%, 71%" },
                        { key: "hideCursor", label: "Hide cursor", desc: "True fullscreen vibe" },
                        { key: "autoFullscreen", label: "Auto fullscreen", desc: "Launch in fullscreen" },
                        { key: "playChime", label: "Boot chime", desc: "Play startup sound" },
                        { key: "showRemaining", label: "Show time left", desc: " 'About X min remaining'" },
                        { key: "stuckAtEnd", label: "Evil mode", desc: "Stuck at 87% forever" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setConfig({ ...config, [opt.key as keyof Config]: !config[opt.key as keyof Config] })}
                          className="group relative flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 text-left transition-all hover:border-white/20 hover:bg-white/5"
                        >
                          <div className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-all ${
                            config[opt.key as keyof Config]
                              ? "border-white/40 bg-white text-black"
                              : "border-white/25 bg-white/5 group-hover:border-white/40"
                          }`}>
                            {config[opt.key as keyof Config] && (
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium leading-tight text-white/90">{opt.label}</div>
                            <div className="mt-0.5 text-[11px] leading-snug text-white/45">{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={startSimulation}
                      className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-white px-6 py-[14px] text-[15px] font-medium text-black shadow-[0_8px_24px_-8px_rgba(255,255,255,0.3),inset_0_1px_0_0_rgba(255,255,255,0.8)] transition-all hover:shadow-[0_12px_32px_-8px_rgba(255,255,255,0.4)] active:scale-[0.98] sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white to-zinc-200 opacity-0 transition-opacity group-hover:opacity-100" />
                      <AppleLogo className="relative h-4 w-4" />
                      <span className="relative">Start Update</span>
                    </button>
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] text-white/55 backdrop-blur-xl sm:justify-start">
                      <kbd className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">⌘⌥P</kbd>
                      <span>to exit • Tap ESC 3×</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="flex flex-col gap-6">
                <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-black/60 shadow-2xl backdrop-blur-2xl">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,rgba(59,130,246,0.15),transparent)]" />
                  </div>
                  <div className="relative border-b border-white/10 bg-white/[0.02] px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                      <span className="ml-2 text-[11px] font-medium uppercase tracking-widest text-white/40">Preview</span>
                    </div>
                  </div>
                  <div className="relative flex aspect-[16/10] items-center justify-center bg-black p-8">
                    <div className="flex w-full max-w-[260px] flex-col items-center">
                      <AppleLogo className="mb-10 h-14 w-14 text-white/90 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
                      <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/15 backdrop-blur">
                        <div className="h-full w-[62%] rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
                      </div>
                      <p className="mt-6 text-center text-[13px] font-normal tracking-wide text-white/70">
                        About {config.duration} minutes remaining
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-xl">
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(245 158 11)" strokeWidth="1.75">
                        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium text-amber-200/90">Prank responsibly</h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-amber-100/60">
                        This is a visual simulator only. It doesn't install anything. Perfect for convincing coworkers their Mac is updating to Tahoe during meetings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: "◐", title: "Liquid Glass UI", desc: "Authentic Tahoe design language" },
                { icon: "⎋", title: "Triple-ESC exit", desc: "Hidden escape for prankster" },
                { icon: "∞", title: "Evil mode", desc: "Stuck at 87% indefinitely" },
              ].map((f) => (
                <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-all hover:bg-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[16px] leading-none text-white/70 ring-1 ring-white/15">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white/90">{f.title}</div>
                      <div className="mt-0.5 text-[12px] text-white/50">{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-white/5 py-4 text-center text-[11px] text-white/30">
          Not affiliated with Apple Inc. macOS and Tahoe are trademarks of Apple. For entertainment only.
        </footer>
      </div>

      {/* Simulation Overlay */}
      {isSimulating && (
        <div
          ref={simulationRef}
          className={`fixed inset-0 z-[9999] flex select-none items-center justify-center bg-black ${config.hideCursor ? "cursor-none" : ""}`}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Real macOS boot background */}
          <div className="absolute inset-0 bg-black" />
          
          {/* Subtle vignette like real Mac */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

          <div className="relative flex flex-col items-center">
            {/* Apple Logo - exact size and positioning */}
            <div className="mb-[74px]">
              <AppleLogo className="h-[78px] w-[78px] text-white" />
            </div>

            {/* Progress bar container - exact macOS dimensions */}
            <div className="relative">
              <div className="h-[6px] w-[300px] overflow-hidden rounded-full bg-[#2a2a2a]">
                <div
                  className="h-full rounded-full bg-white transition-all duration-200 ease-linear will-change-[width]"
                  style={{
                    width: `${progress}%`,
                    boxShadow: progress > 0 ? "0 0 10px rgba(255,255,255,0.3)" : "none",
                  }}
                />
              </div>
              
              {/* Progress bar glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-60 blur-[8px] transition-all duration-200"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, white ${Math.max(0, progress - 5)}%, white ${progress}%, transparent ${Math.min(100, progress + 5)}%)`,
                  width: "300px",
                }}
              />
            </div>

            {/* Status text - only show when relevant */}
            {config.showRemaining && progress > 8 && (
              <div className="mt-[42px] h-[20px]">
                <p className="text-center font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display'] text-[17px] font-normal leading-[20px] tracking-[-0.2px] text-[#f5f5f7] antialiased">
                  {statusText}
                </p>
              </div>
            )}

            {/* Exit hint - tiny and hidden */}
            {escapeCount > 0 && (
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/60 backdrop-blur-xl">
                Press ESC {3 - escapeCount} more times to exit
              </div>
            )}
          </div>

          {/* Fake loading indicator for extra realism */}
          <div className="pointer-events-none absolute bottom-10 right-10 flex items-center gap-2 opacity-[0.03] hover:opacity-20 transition-opacity">
            <div className="h-1 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: "0ms" }} />
            <div className="h-1 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: "200ms" }} />
            <div className="h-1 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      )}
    </div>
  );
}
// Zod Schema
export const Schema = {
    "commentary": "Built a pixel-perfect macOS Tahoe update prank simulator with Liquid Glass UI. Features realistic progress bar, authentic pauses, boot chime, and evil mode that stalls at 87%. Fullscreen, cursor hiding, and triple-ESC exit make it convincingly real.",
    "template": "next-forge",
    "title": "macOS Tahoe Update Prank",
    "description": "A realistic macOS Tahoe system update simulator for pranking friends. Features authentic Apple logo, progress bar, time remaining, realistic pauses, fullscreen mode, and Liquid Glass design. Completely harmless - just a visual simulation.",
    "additional_dependencies": [],
    "has_additional_dependencies": false,
    "install_dependencies_command": "",
    "port": 3000,
    "file_path": "pages/index.tsx",
    "code": "<see code above>"
}