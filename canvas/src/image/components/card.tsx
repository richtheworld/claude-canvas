import React from "react";
import type { ReactNode, CSSProperties } from "react";

export interface CardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  variant?: "default" | "dark" | "light";
  width?: number;
  padding?: number;
}

const variants: Record<string, { bg: string; border: string; text: string; muted: string }> = {
  default: {
    bg: "#1a1a1a",
    border: "#333",
    text: "#ffffff",
    muted: "#a0a0a0",
  },
  dark: {
    bg: "#0a0a0a",
    border: "#222",
    text: "#ffffff",
    muted: "#888",
  },
  light: {
    bg: "#ffffff",
    border: "#e5e5e5",
    text: "#0a0a0a",
    muted: "#666",
  },
};

export function Card({
  title,
  description,
  children,
  variant = "default",
  width,
  padding = 24,
}: CardProps) {
  const colors = variants[variant];

  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    padding,
    borderRadius: 12,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontFamily: "Inter",
    ...(width ? { width } : {}),
  };

  const titleStyle: CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: description ? 8 : 16,
    color: colors.text,
  };

  const descriptionStyle: CSSProperties = {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
  };

  return (
    <div style={containerStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      {description && <div style={descriptionStyle}>{description}</div>}
      {children}
    </div>
  );
}

export interface CardContentProps {
  children?: ReactNode;
}

export function CardContent({ children }: CardContentProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {children}
    </div>
  );
}

export interface CardRowProps {
  label: string;
  value: string | number;
  variant?: "default" | "dark" | "light";
}

export function CardRow({ label, value, variant = "default" }: CardRowProps) {
  const colors = variants[variant];

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: colors.muted, fontSize: 14 }}>{label}</span>
      <span style={{ color: colors.text, fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
