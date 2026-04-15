import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, X, Zap } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface TutorialStepDef {
  id: string;
  title: string;
  description: string;
  targetIds: string[];
  beforeFocus?: "none" | "open-sidebar" | "close-sidebar" | "open-more-actions" | "close-more-actions";
}

function getStepTarget(step?: TutorialStepDef | null) {
  if (!step) return null;
  for (const id of step.targetIds) {
    const el = document.getElementById(id);
    if (el && el.offsetParent !== null) return el;
  }
  return null;
}

export function DashboardTutorial({
  open,
  steps,
  onClose,
  onStepRender,
}: {
  open: boolean;
  steps: TutorialStepDef[];
  onClose: () => void;
  onStepRender?: (step: TutorialStepDef, stepIndex: number) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;

  useEffect(() => {
    if (!open || !step) return;
    onStepRender?.(step, currentStep);
  }, [open, step, currentStep, onStepRender]);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setTargetRect(null);
      return;
    }

    let raf = 0;
    const updatePosition = () => {
      const target = getStepTarget(steps[currentStep]);
      if (target) {
        if (step.id !== "mobile-menu-button") { target.scrollIntoView({ block: isMobile ? "center" : "nearest", inline: "nearest", behavior: "smooth" }); }
        raf = window.requestAnimationFrame(() => {
          setTargetRect(target.getBoundingClientRect());
        });
      } else {
        setTargetRect(null);
      }
    };

    const timeout = window.setTimeout(updatePosition, 160);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, currentStep, steps, isMobile]);

  const tooltipStyle = useMemo(() => {
    if (!targetRect) {
      return isMobile
        ? ({ left: 12, right: 12, bottom: 12, width: "auto" } as React.CSSProperties)
        : ({ right: 16, top: 24, width: 360 } as React.CSSProperties);
    }
    if (isMobile) {
      return {
        left: 12,
        right: 12,
        bottom: 12,
        width: "auto",
        maxHeight: "48vh",
      } as React.CSSProperties;
    }

    const desiredWidth = 380;
    const rightOverflow = targetRect.right + 24 + desiredWidth > window.innerWidth - 16;
    const left = rightOverflow
      ? Math.max(16, targetRect.left - desiredWidth - 24)
      : Math.min(window.innerWidth - desiredWidth - 16, targetRect.right + 24);
    const top = Math.min(window.innerHeight - 300, Math.max(16, targetRect.top));
    return { left, top, width: desiredWidth } as React.CSSProperties;
  }, [targetRect, isMobile]);

  const goNext = () => {
    if (isLastStep) onClose();
    else setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  const goPrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  if (!open || !step) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <AnimatePresence>
        {targetRect && (
          <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 h-full w-full pointer-events-auto">
            <defs>
              <mask id="tutorial-mask-panel">
                <rect width="100%" height="100%" fill="white" />
                <motion.rect
                  initial={false}
                  animate={{
                    x: targetRect.left - 8,
                    y: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                  }}
                  rx="16"
                  fill="black"
                  transition={{ type: "spring", damping: 24, stiffness: 220 }}
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.76)" mask="url(#tutorial-mask-panel)" />
          </motion.svg>
        )}
      </AnimatePresence>

      {targetRect && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          className="absolute z-10 rounded-2xl border-2 border-brand shadow-[0_0_30px_rgba(255,99,33,0.45)] pointer-events-none"
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-20 rounded-[2rem] border border-neutral-100 bg-white p-4 sm:p-7 shadow-[0_30px_60px_rgba(0,0,0,0.25)]" style={tooltipStyle}>
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Zap className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Tutorial</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">MinhaBagg</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-[104px] sm:min-h-[120px] overflow-y-auto pr-1">
          <h3 className="mb-3 text-xl sm:text-2xl font-black tracking-tight text-neutral-900">{step.title}</h3>
          <p className="text-sm font-medium leading-relaxed text-neutral-500">{step.description}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 sm:mt-6 sm:pt-5">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex gap-1 max-w-[120px] sm:max-w-none overflow-hidden">
              {steps.map((_, index) => (
                <div key={index} className={cn("h-1.5 rounded-full transition-all shrink-0", index === currentStep ? "w-7 bg-brand" : "w-1.5 bg-neutral-200")} />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300 whitespace-nowrap">{currentStep + 1}/{steps.length}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentStep > 0 && <button onClick={goPrev} className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600"><ChevronLeft className="h-5 w-5" /></button>}
            <button onClick={goNext} className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-2xl bg-brand px-4 sm:px-5 font-black text-white shadow-lg shadow-brand/20">
              {isLastStep ? "Finalizar" : "Próximo"}
              {isLastStep ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
