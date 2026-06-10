"use client";

/**
 * VoiceOrb —— 琥珀语音球，整个产品唯一的视觉主角
 *
 * 状态语言：
 * - idle      缓慢呼吸，像一盏安静的灯
 * - connecting 光晕旋转
 * - listening 随用户音量泛起涟漪
 * - thinking  内核收缩、微光闪烁
 * - speaking  随 AI 语音脉动
 */

import { useEffect, useRef, MutableRefObject } from "react";
import { motion } from "framer-motion";
import { VoiceState } from "@/types/voice";

interface VoiceOrbProps {
  state: VoiceState;
  micOn: boolean;
  micLevelRef: MutableRefObject<number>;
  onTap: () => void;
}

const STATE_LABEL: Record<VoiceState, string> = {
  idle: "轻触开始对话",
  connecting: "正在连接…",
  listening: "在听，请讲",
  thinking: "思考中…",
  speaking: "正在回答 · 开口即可打断",
};

export function VoiceOrb({ state, micOn, micLevelRef, onTap }: VoiceOrbProps) {
  const coreRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  // 麦克风音量直接驱动 DOM，绕过 React 渲染
  useEffect(() => {
    let raf = 0;
    let smoothed = 0;
    const tick = () => {
      const target = micOn ? micLevelRef.current : 0;
      smoothed += (target - smoothed) * 0.18;
      if (coreRef.current) {
        const scale = 1 + smoothed * 0.22;
        coreRef.current.style.setProperty("--mic-scale", scale.toFixed(3));
      }
      if (haloRef.current) {
        haloRef.current.style.opacity = (0.45 + smoothed * 0.55).toFixed(2);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [micOn, micLevelRef]);

  const breathing = state === "idle";
  const speaking = state === "speaking";
  const thinking = state === "thinking";
  const connecting = state === "connecting";
  const listening = state === "listening";

  return (
    <div className="flex flex-col items-center gap-7 select-none">
      <button
        onClick={onTap}
        aria-label={micOn ? "结束对话" : "开始对话"}
        className="relative w-52 h-52 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ember))]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[hsl(var(--ink))]"
      >
        {/* 远景光晕 */}
        <div
          ref={haloRef}
          className={`absolute -inset-14 rounded-full orb-halo blur-3xl transition-opacity duration-700 ${
            micOn || speaking ? "opacity-70" : "opacity-40"
          } ${connecting ? "animate-[spin_4s_linear_infinite]" : ""}`}
        />

        {/* 听 · 涟漪环 */}
        {listening && (
          <>
            <span className="absolute inset-0 rounded-full border border-[hsl(var(--ember))]/35 animate-orb-ripple" />
            <span className="absolute inset-0 rounded-full border border-[hsl(var(--ember))]/25 animate-orb-ripple [animation-delay:0.6s]" />
          </>
        )}

        {/* 说 · 脉动环 */}
        {speaking && (
          <span className="absolute -inset-2 rounded-full border-2 border-[hsl(var(--ember))]/30 animate-orb-pulse" />
        )}

        {/* 球体本体 */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          animate={
            breathing
              ? { scale: [1, 1.035, 1] }
              : speaking
                ? { scale: [1, 1.06, 1.02, 1.07, 1] }
                : thinking
                  ? { scale: 0.92 }
                  : { scale: 1 }
          }
          transition={
            breathing
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : speaking
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
          }
        >
          <div
            ref={coreRef}
            className="absolute inset-0 rounded-full orb-core"
            style={{ transform: "scale(var(--mic-scale, 1))" }}
          >
            {/* 内部流转的光 */}
            <div
              className={`absolute -inset-1/4 orb-swirl ${
                thinking ? "animate-[spin_2.2s_linear_infinite]" : "animate-[spin_14s_linear_infinite]"
              }`}
            />
            {/* 顶部高光 */}
            <div className="absolute inset-0 rounded-full orb-gloss" />
            {/* 思考时的微光闪烁 */}
            {thinking && <div className="absolute inset-0 rounded-full orb-shimmer" />}
          </div>
        </motion.div>

        {/* 待机时中央的暗色提示点 */}
        {!micOn && state === "idle" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-[hsl(var(--ink))]/55 backdrop-blur-sm" />
          </span>
        )}
      </button>

      {/* 状态文字 */}
      <motion.p
        key={state}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-sm tracking-[0.2em] text-[hsl(var(--ink-soft))]"
      >
        {micOn || state !== "idle" ? STATE_LABEL[state] : STATE_LABEL.idle}
      </motion.p>
    </div>
  );
}
