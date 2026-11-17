"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useErrorPage } from "@/components/site-shell";
import { Icon } from "@/components/icon";
import { CONTACT } from "@/domain/catalog";
import { notFoundAstronaut } from "@/content/media";

const digits = [
  [
    "10000",
    "10010",
    "10010",
    "10010",
    "11111",
    "00010",
    "00010",
    "00010",
    "00000",
  ],
  [
    "00000",
    "01110",
    "11011",
    "10001",
    "10001",
    "10001",
    "11011",
    "01110",
    "00000",
  ],
  [
    "00010",
    "10010",
    "10010",
    "10010",
    "11111",
    "00010",
    "00010",
    "00010",
    "00010",
  ],
];
type Tile = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  turn: number;
  pop: number;
  colour: string;
  opacity: number;
  size: number;
  formsCode: boolean;
  originX: number;
  originY: number;
  phase: number;
};

/** Drift the grid gently and nudge touched tiles without losing the404 silhouette. */
function FragmentedCode() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let tiles: Tile[] = [];
    let frame = 0,
      previousFrame = 0,
      resetAt = 0,
      width = 0,
      height = 0;
    let pointer: { x: number; y: number; time: number } | null = null;
    /** Paint bounded spring motion with subtle drift and seven-second touch recovery. */
    function draw(time: number) {
      frame = 0;
      const step = Math.min(
        2,
        previousFrame ? (time - previousFrame) / (1000 / 60) : 1,
      );
      previousFrame = time;
      context!.clearRect(0, 0, width, height);
      if (resetAt && time >= resetAt) {
        for (const tile of tiles) {
          tile.homeX = tile.originX;
          tile.homeY = tile.originY;
        }
        resetAt = 0;
      }
      for (const tile of tiles) {
        // Move the numeral mostly together so ambient motion cannot dissolve its outline.
        const amplitude = motion.matches ? 0 : 8;
        const phase = tile.formsCode ? 0 : tile.phase;
        const detail = motion.matches || !tile.formsCode ? 0 : 2;
        const driftX =
          Math.sin(time / 2200 + phase) * amplitude +
          Math.sin(time / 2200 + tile.phase) * detail;
        const driftY =
          Math.cos(time / 3000 + phase) * amplitude +
          Math.cos(time / 3000 + tile.phase) * detail;
        tile.vx =
          (tile.vx + (tile.homeX + driftX - tile.x) * 0.035 * step) *
          Math.pow(0.83, step);
        tile.vy =
          (tile.vy + (tile.homeY + driftY - tile.y) * 0.035 * step) *
          Math.pow(0.83, step);
        tile.x += tile.vx * step;
        tile.y += tile.vy * step;
        tile.turn *= Math.pow(0.88, step);
        tile.pop *= Math.pow(0.88, step);
        context!.save();
        context!.translate(tile.x, tile.y);
        context!.rotate(tile.turn);
        context!.scale(1 + tile.pop * 0.4, 1 + tile.pop * 0.4);
        context!.globalAlpha = tile.opacity;
        context!.fillStyle = tile.colour;
        if (tile.pop > 0.05) {
          context!.shadowColor = "#46acdc";
          context!.shadowBlur = tile.pop * 14;
        }
        context!.fillRect(-tile.size / 2, -tile.size / 2, tile.size, tile.size);
        if (tile.size > 12) {
          context!.globalAlpha = tile.opacity * 0.65;
          context!.fillStyle = "#c3f8ff";
          context!.fillRect(
            -tile.size / 2,
            -tile.size / 2,
            tile.size * 0.55,
            0.8,
          );
          context!.fillRect(
            -tile.size / 2,
            -tile.size / 2,
            0.8,
            tile.size * 0.3,
          );
        }
        context!.restore();
      }
      if (!motion.matches && !document.hidden)
        frame = requestAnimationFrame(draw);
      else previousFrame = 0;
    }
    /** Fit the grid to the viewport while retaining the three-digit silhouette. */
    function resize() {
      cancelAnimationFrame(frame);
      frame = 0;
      const bounds = element!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      element!.width = Math.round(width * ratio);
      element!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      const cell = Math.max(8, Math.min(22, width / 64));
      const columns = Math.ceil(width / cell),
        rows = Math.ceil(height / cell);
      const compact = width <= 600;
      const scale = Math.max(
        compact ? 2 : 1,
        Math.floor(Math.min(columns / 28, rows / 12)),
      );
      const codeScale = compact ? (width * 0.68) / (17 * scale * cell) : 0.65;
      const codeCenterY = height * (compact ? 0.36 : 0.5);
      const left = Math.floor((columns - 17 * scale) / 2),
        top = Math.floor((rows - digits[0].length * scale) / 2);
      tiles = [];
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < columns; col++) {
          const gx = Math.floor((col - left) / scale),
            gy = Math.floor((row - top) / scale);
          const digit = Math.floor(gx / 6),
            localX = gx % 6;
          const filled =
            digit >= 0 &&
            digit < 3 &&
            gy >= 0 &&
            gy < digits[digit].length &&
            localX >= 0 &&
            localX < 5 &&
            digits[digit][gy][localX] === "1";
          const seed = col * 37 + row * 71;
          const radius = Math.hypot(
            (col / columns - 0.5) / 0.55,
            (row / rows - (compact ? 0.37 : 0.48)) / (compact ? 0.39 : 0.5),
          );
          const density = Math.max(0.025, 1 - radius ** 1.6);
          if (!filled && (seed % 101) / 101 > density) continue;
          const scattered = !filled && seed % 3 === 0;
          let homeX =
            (col + 0.5) * cell +
            (scattered
              ? ((seed % 7) - 3) * cell * 0.35
              : filled
                ? ((seed % 5) - 2) * cell * 0.1
                : 0);
          let homeY =
            (row + 0.5) * cell +
            (scattered
              ? ((seed % 9) - 4) * cell * 0.25
              : filled
                ? ((seed % 5) - 2) * cell * 0.075
                : 0);
          if (filled) {
            homeX = width / 2 + (homeX - width / 2) * codeScale;
            homeY = codeCenterY + (homeY - height / 2) * codeScale;
          }
          const accents = [
            "#41c5f1",
            "#28d8c2",
            "#7a70f5",
            "#3585ea",
            "#47accf",
            "#a5b8d5",
          ];
          const neutrals = [
            "#c6d0df",
            "#a3b2c6",
            "#8093ae",
            "#d6dee8",
            "#92a1b8",
          ];
          const colour = filled
            ? seed % 5 === 0
              ? accents[seed % accents.length]
              : neutrals[seed % neutrals.length]
            : accents[seed % accents.length];
          tiles.push({
            phase: seed * 0.37,
            formsCode: filled,
            originX: homeX,
            originY: homeY,
            x: homeX,
            y: homeY,
            homeX,
            homeY,
            vx: 0,
            vy: 0,
            turn: scattered ? 0.12 : 0,
            pop: 0,
            colour,
            opacity: filled
              ? compact
                ? 0.88 + (seed % 4) * 0.04
                : 0.7 + (seed % 4) * 0.09
              : (0.06 + (seed % 7) * 0.025) *
                density *
                (compact &&
                Math.abs(homeX - width / 2) < width * 0.38 &&
                Math.abs(homeY - codeCenterY) < width * 0.18
                  ? 0.25
                  : 1),
            size:
              cell *
              (filled ? codeScale : 1) *
              (filled
                ? compact
                  ? [0.65, 0.85, 1, 1.2, 1.4][seed % 5]
                  : [0.5, 0.7, 0.85, 1, 1.2, 1.45][seed % 6]
                : [0.3, 0.6, 1, 1.5, 2.1, 2.9][seed % 6]),
          });
        }
      tiles.sort((a, b) => Number(a.formsCode) - Number(b.formsCode));
      pointer = null;
      resetAt = 0;
      draw(performance.now());
      element!.dataset.ready = "true";
    }
    /** Nudge only the touched tiles in the direction of pointer travel. */
    function move(event: PointerEvent) {
      if (motion.matches || event.pointerType === "touch") return;
      const bounds = element!.getBoundingClientRect();
      const x = event.clientX - bounds.left,
        y = event.clientY - bounds.top;
      const elapsed = pointer
        ? Math.max(8, event.timeStamp - pointer.time)
        : 16;
      const dx = pointer
        ? Math.max(-4, Math.min(4, ((x - pointer.x) / elapsed) * 12))
        : 0;
      const dy = pointer
        ? Math.max(-4, Math.min(4, ((y - pointer.y) / elapsed) * 12))
        : -0.5;
      for (const tile of tiles)
        if (
          Math.abs(tile.x - x) < tile.size &&
          Math.abs(tile.y - y) < tile.size
        ) {
          if (Math.hypot(dx, dy) > 1) {
            const margin = tile.size / 2;
            tile.homeX = Math.max(
              margin,
              Math.min(width - margin, tile.originX + dx * 5),
            );
            tile.homeY = Math.max(
              margin,
              Math.min(height - margin, tile.originY + dy * 5),
            );
          }
          resetAt = performance.now() + 7000;
          tile.vx = dx;
          tile.vy = dy - 0.25;
          tile.turn = dx * 0.02;
          tile.pop = 0.2;
        }
      pointer = { x, y, time: event.timeStamp };
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }
    /** Nudge a finger-sized cluster and restart the shared idle regroup deadline. */
    function tap(event: PointerEvent) {
      if (motion.matches || event.pointerType !== "touch") return;
      const bounds = element!.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      for (const tile of tiles) {
        if (Math.hypot(tile.x - x, tile.y - y) > Math.max(36, tile.size))
          continue;
        const angle = Math.atan2(tile.y - y, tile.x - x) + tile.phase * 0.1;
        const distance = 8 + (Math.sin(tile.phase) + 1) * 2;
        const margin = tile.size / 2;
        tile.homeX = Math.max(
          margin,
          Math.min(width - margin, tile.originX + Math.cos(angle) * distance),
        );
        tile.homeY = Math.max(
          margin,
          Math.min(height - margin, tile.originY + Math.sin(angle) * distance),
        );
        tile.vx = Math.cos(angle) * 0.7;
        tile.vy = Math.sin(angle) * 0.7;
        tile.turn = Math.sin(angle) * 0.06;
        tile.pop = 0.2;
        resetAt = performance.now() + 7000;
      }
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }
    /** Suspend offscreen animation and resume from the current recovery deadlines. */
    function visibility() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousFrame = 0;
      if (!document.hidden) draw(performance.now());
    }
    /** Forget pointer velocity when leaving the artwork. */
    function leave() {
      pointer = null;
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerdown", tap);
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("pointerleave", leave);
    motion.addEventListener("change", resize);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerdown", tap);
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("pointerleave", leave);
      motion.removeEventListener("change", resize);
    };
  }, []);
  return (
    <canvas ref={canvas} className="not-found-grid-art" aria-hidden="true" />
  );
}

/** Offer an accessible way home inside the shared site header and footer. */
export default function NotFound() {
  useErrorPage();
  return (
    <section className="not-found-art" aria-labelledby="not-found-title">
      <h1 id="not-found-title" className="sr-only">
        404 — Page not found
      </h1>
      <div className="not-found-static-code" aria-hidden="true">
        404
      </div>
      <FragmentedCode />
      <a
        className="not-found-instagram"
        href={CONTACT.instagram}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram: @soccerbotstudiosg"
      >
        <Icon name="instagram" />
      </a>
      <p className="not-found-message">
        Oops, this page drifted off course.
        <span>Let the ball take you home.</span>
      </p>
      <div className="not-found-explorer">
        <img
          src={notFoundAstronaut}
          width="1280"
          height="1280"
          alt=""
          className="not-found-astronaut"
          fetchPriority="high"
        />
        <Link href="/" className="not-found-home" aria-label="Back to home">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <radialGradient id="home-chrome" cx="32%" cy="22%" r="80%">
                <stop stopColor="#cad5e4" />
                <stop offset=".26" stopColor="#76859b" />
                <stop offset=".43" stopColor="#263449" />
                <stop offset=".54" stopColor="#8494a8" />
                <stop offset=".7" stopColor="#26334b" />
                <stop offset="1" stopColor="#0a1235" />
              </radialGradient>
              <radialGradient id="home-depth">
                <stop stopColor="#050a2f" />
                <stop offset=".8" stopColor="#132c4c" />
                <stop offset="1" stopColor="#46acdc" />
              </radialGradient>
              <clipPath id="home-sphere">
                <circle cx="60" cy="60" r="52" />
              </clipPath>
            </defs>
            <circle cx="60" cy="60" r="54" fill="#46acdc" opacity=".25" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="url(#home-chrome)"
              stroke="#d7ecff"
            />
            <g
              clipPath="url(#home-sphere)"
              fill="none"
              stroke="#111d3c"
              strokeWidth=".65"
              opacity=".65"
            >
              <path d="M30 13 42 29 25 49 8 43M90 13 78 29 95 49 112 43M8 77 25 75 39 97 32 113M112 77 95 75 81 97 88 113M42 29H78M25 49V75M95 49V75M39 97H81M42 29 39 10M78 29 81 10" />
            </g>
            <path
              className="not-found-home-hole"
              transform="translate(18 18) scale(.7)"
              d="M31 57 60 33 89 57H81V85H65V68H55V85H39V57Z"
              fill="url(#home-depth)"
              stroke="#86cbd6"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
