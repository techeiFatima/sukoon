"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ─────────────── Buttons ─────────────── */

type Variant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-forest text-ivory hover:bg-forest-deep shadow-[0_1px_0_rgba(0,0,0,0.04)]",
  secondary: "bg-paper text-forest border border-line hover:border-sage",
  ghost: "text-forest hover:bg-sage-soft/60",
  quiet: "text-muted hover:text-forest",
  danger: "text-clay border border-clay/30 hover:bg-clay/5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-5 text-sm", lg: "h-12 px-7 text-[15px]" };
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-calm",
        "disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]",
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Breath small /> : null}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-sage-soft/70 hover:text-forest",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ─────────────── Text ─────────────── */

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-10 md:mb-14">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-[2.4rem] leading-[1.05] text-forest md:text-[3.2rem]">{title}</h1>
      {children && <div className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[1.55rem] leading-tight text-forest">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block">
      <span className="text-[13px] font-medium text-ink">{children}</span>
      {hint && <span className="ml-2 text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

/* ─────────────── Inputs ─────────────── */

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }>(
  function TextArea({ className, minRows = 3, value, ...rest }, outerRef) {
    const inner = useRef<HTMLTextAreaElement | null>(null);
    useLayoutEffect(() => {
      const el = inner.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    }, [value]);
    return (
      <textarea
        ref={(el) => {
          inner.current = el;
          if (typeof outerRef === "function") outerRef(el);
          else if (outerRef) outerRef.current = el;
        }}
        rows={minRows}
        value={value}
        className={cx("field resize-none leading-relaxed", className)}
        {...rest}
      />
    );
  },
);

export function Chip({
  selected,
  onClick,
  children,
  className,
  removable,
  onRemove,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border text-[13px] transition-all duration-200",
        selected ? "border-forest bg-forest text-ivory" : "border-line bg-paper text-ink hover:border-sage",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={onClick ? Boolean(selected) : undefined}
        className={cx("px-3.5 py-1.5", !onClick && "cursor-default", removable && "pr-1.5")}
      >
        {children}
      </button>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "item"}`}
          className="mr-1.5 rounded-full p-0.5 text-muted hover:text-clay"
        >
          <X size={13} />
        </button>
      )}
    </span>
  );
}

/* ─────────────── Layout ─────────────── */

export function Card({ className, children, as: As = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" }) {
  return <As className={cx("card p-6 md:p-7", className)}>{children}</As>;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const group = useId();
  return (
    <div role="tablist" className={cx("no-scrollbar -mx-4 mb-10 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              "relative shrink-0 rounded-full px-4 py-2 text-sm transition-colors",
              active ? "text-ivory" : "text-muted hover:text-forest",
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${group}`}
                className="absolute inset-0 rounded-full bg-forest"
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── Feedback ─────────────── */

export function Breath({ small, label }: { small?: boolean; label?: string }) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex items-center gap-3">
      <motion.span
        aria-hidden
        className={cx("inline-block rounded-full bg-sage", small ? "h-2 w-2" : "h-3 w-3")}
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {label && <span className="text-sm text-muted">{label}</span>}
    </span>
  );
}

export function Loading({ label = "Gathering your space…" }: { label?: string }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <Breath label={label} />
    </div>
  );
}

export function ErrorNote({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  if (!children) return null;
  return (
    <div role="alert" className="my-4 flex items-start justify-between gap-4 rounded-2xl border border-clay/25 bg-clay/5 px-4 py-3 text-sm text-clay">
      <span>{children}</span>
      {onRetry && (
        <button className="shrink-0 underline underline-offset-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Ornament className="mb-5 h-10 w-10 text-sand" />
      <p className="font-serif text-xl text-forest">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SavedHint({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const text = { idle: "", saving: "Saving…", saved: "Saved privately", error: "Not saved" }[state];
  return (
    <span aria-live="polite" className={cx("text-[12px] transition-opacity", state === "error" ? "text-clay" : "text-muted", state === "idle" && "opacity-0")}>
      {text}
    </span>
  );
}

/** Two-step delete: first click asks, second confirms. Avoids modal fatigue. */
export function ConfirmDelete({ onConfirm, label = "Delete", className }: { onConfirm: () => void; label?: string; className?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={cx("text-[13px] transition-colors", armed ? "font-medium text-clay" : "text-muted hover:text-clay", className)}
    >
      {armed ? "Tap again to delete" : label}
    </button>
  );
}

/* ─────────────── Modal ─────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("input, textarea, select")?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 backdrop-blur-[2px] md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className={cx(
              "max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-ivory p-6 pb-10 shadow-2xl md:rounded-[28px] md:p-8",
              wide ? "md:max-w-2xl" : "md:max-w-lg",
            )}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-2xl text-forest">{title}</h2>
              <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────── Brand ─────────────── */

/** An eight-pointed star (khatam) — a quiet nod to Islamic geometric design. */
export function Ornament({ className }: { className?: string }) {
  // Outline of two overlapping squares: inner vertices sit at R·cos45°/cos22.5°.
  const R = 17, r = (R * Math.SQRT1_2) / Math.cos(Math.PI / 8);
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    return `${(20 + rad * Math.cos(a)).toFixed(2)},${(20 + rad * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <polygon points={pts} />
      <circle cx="20" cy="20" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5 text-forest", className)}>
      <Ornament className="h-6 w-6" />
      <span className="font-serif text-[1.35rem] tracking-tight">Sukoon</span>
    </span>
  );
}

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
