"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const CLIMB = "cubic-bezier(0.55, 0, 0.8, 0.5)";
const FLIGHT_DURATION = 4000;

const fadeUp = [
  { opacity: 0, transform: "translateY(24px)" },
  { opacity: 1, transform: "translateY(0)" },
];

const planeColor = "saturate(0.65) sepia(0.16) contrast(0.96) brightness(1.04)";

const keyframes: Record<string, Keyframe[]> = {
  nav: [
    { opacity: 0, transform: "translateY(-12px)" },
    { opacity: 1, transform: "translateY(0)" },
  ],
  // The plane moves across and climbs on separate curves so its path bends.
  flightAcross: [
    { transform: "translate3d(calc(-90vw - 50%), -50%, 0) scale(0.45)" },
    { transform: "translate3d(calc(110vw + 100%), -50%, 0) scale(3.2)" },
  ],
  flightClimb: [{ translate: "0 300px" }, { translate: "0 -100vh" }],
  flightFade: [
    { opacity: 0, offset: 0 },
    { opacity: 1, offset: 0.12 },
    { opacity: 1, offset: 0.98 },
    { opacity: 0, offset: 1 },
  ],
  pitch: [{ rotate: "-2deg" }, { rotate: "-13deg" }],
  planeFocus: [
    { filter: "saturate(0.35) sepia(0.3) contrast(0.72) brightness(1.18) blur(1.2px)" },
    { filter: `${planeColor} blur(0)`, offset: 0.5 },
    { filter: `${planeColor} blur(0)`, offset: 0.88 },
    { filter: "saturate(0.7) sepia(0.12) contrast(1) brightness(1.06) blur(2.5px)" },
  ],
  planeBob: [
    { translate: "0 0", rotate: "0deg" },
    { translate: "0 -0.8%", rotate: "-0.6deg" },
  ],
  glint: [
    { opacity: 0, backgroundPosition: "100% 0", offset: 0 },
    { opacity: 0, backgroundPosition: "100% 0", offset: 0.4 },
    { opacity: 1, offset: 0.55 },
    { opacity: 0, backgroundPosition: "0 0", offset: 0.78 },
    { opacity: 0, backgroundPosition: "0 0", offset: 1 },
  ],
  trail: [
    { opacity: 0, scale: "0 1", offset: 0 },
    { opacity: 0, scale: "0 1", offset: 0.18 },
    { opacity: 0.85, offset: 0.45 },
    { opacity: 0.6, scale: "1 1.8", offset: 1 },
  ],
  mist: [
    { opacity: 0, transform: "translate3d(12%, -5%, 0)", offset: 0 },
    { opacity: 0.7, offset: 0.35 },
    { opacity: 0.7, offset: 0.65 },
    { opacity: 0, transform: "translate3d(-25%, 12%, 0)", offset: 1 },
  ],
  light: [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: 0.45 },
    { opacity: 0.8, offset: 0.76 },
    { opacity: 0, offset: 1 },
  ],
  journey: [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }],
};

export default function IntroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const running: Animation[] = [];
    let formAnimation: Animation | undefined;

    const animate = (target: string, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const element = scope.querySelector(`[data-motion="${target}"]`);
      if (!element) return;
      const animation = element.animate(frames, { fill: "both", ...options });
      running.push(animation);
      return animation;
    };

    const stopAll = () => running.splice(0).forEach((animation) => animation.cancel());

    const play = () => {
      stopAll();
      if (reducedMotion.matches) return;

      // Page content
      animate("nav", keyframes.nav, { duration: 900, easing: EASE_OUT });
      animate("eyebrow", fadeUp, { duration: 1200, delay: 500, easing: EASE_OUT });
      animate("heading", fadeUp, { duration: 1200, delay: 800, easing: EASE_OUT });
      animate("subtitle", fadeUp, { duration: 1200, delay: 1200, easing: EASE_OUT });
      formAnimation = animate("search", fadeUp, { duration: 1200, delay: 2000, easing: EASE_OUT });

      // Plane fly-by
      const flight = { duration: FLIGHT_DURATION };
      animate("flight", keyframes.flightAcross, { ...flight, easing: "cubic-bezier(0.5, 0.1, 0.75, 0.55)" });
      animate("flight", keyframes.flightClimb, { ...flight, easing: CLIMB });
      animate("flight", keyframes.flightFade, flight);
      animate("pitch", keyframes.pitch, { ...flight, easing: CLIMB });
      animate("plane", keyframes.planeFocus, flight);
      animate("plane", keyframes.planeBob, { duration: 1300, iterations: 3, direction: "alternate", easing: "ease-in-out" });
      animate("glint", keyframes.glint, { ...flight, easing: "ease-in-out" });
      animate("trail-inner", keyframes.trail, { ...flight, easing: "ease-out" });
      animate("trail-outer", keyframes.trail, { ...flight, delay: 80, easing: "ease-out" });
      animate("mist", keyframes.mist, { ...flight, easing: "ease-in-out" });
      animate("light", keyframes.light, { ...flight, easing: "ease-in-out" });
      animate("journey", keyframes.journey, { duration: 5500, delay: 400, easing: "ease-in-out" });
    };

    // Skip the form's fade-in if someone tabs into it early.
    const form = scope.querySelector('[data-motion="search"]');
    const showForm = () => formAnimation?.finish();

    form?.addEventListener("focusin", showForm);
    reducedMotion.addEventListener("change", play);
    play();

    return () => {
      stopAll();
      form?.removeEventListener("focusin", showForm);
      reducedMotion.removeEventListener("change", play);
    };
  }, []);

  return (
    <div ref={root} className="contents">
      {children}
    </div>
  );
}
