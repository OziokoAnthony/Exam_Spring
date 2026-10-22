'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="p-4 text-gray-600">
      {label}
    </p>
  );
}

export function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-700">
      {message}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded border border-dashed p-4 text-gray-600">{children}</p>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  variant?: 'primary' | 'secondary';
};

export function Button({
  busy = false,
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    variant === 'primary' ? 'bg-black text-white' : 'border border-gray-400 bg-white text-black';
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`min-h-11 rounded px-4 py-2 disabled:opacity-50 ${base} ${className}`}
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

export const inputClass = 'min-h-11 rounded border p-2 text-base';

export function MasteryBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-3 rounded bg-gray-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-3 rounded bg-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
