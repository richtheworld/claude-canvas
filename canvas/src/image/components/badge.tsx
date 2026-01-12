import React from "react";
import type { CSSProperties } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "outline";

export interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  default: {
    bg: "#27272a",
    text: "#fafafa",
  },
  success: {
    bg: "#166534",
    text: "#bbf7d0",
  },
  warning: {
    bg: "#854d0e",
    text: "#fef08a",
  },
  error: {
    bg: "#991b1b",
    text: "#fecaca",
  },
  info: {
    bg: "#1e40af",
    text: "#bfdbfe",
  },
  outline: {
    bg: "transparent",
    text: "#a1a1aa",
    border: "#3f3f46",
  },
};

const sizeStyles: Record<string, { fontSize: number; paddingX: number; paddingY: number; borderRadius: number }> = {
  sm: { fontSize: 11, paddingX: 6, paddingY: 2, borderRadius: 4 },
  md: { fontSize: 12, paddingX: 10, paddingY: 4, borderRadius: 6 },
  lg: { fontSize: 14, paddingX: 12, paddingY: 6, borderRadius: 8 },
};

export function Badge({ children, variant = "default", size = "md" }: BadgeProps) {
  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: sizing.fontSize,
    fontWeight: 500,
    fontFamily: "Inter",
    paddingLeft: sizing.paddingX,
    paddingRight: sizing.paddingX,
    paddingTop: sizing.paddingY,
    paddingBottom: sizing.paddingY,
    borderRadius: sizing.borderRadius,
    ...(colors.border ? { borderWidth: 1, borderStyle: "solid", borderColor: colors.border } : {}),
  };

  return <div style={style}>{children}</div>;
}

export interface BadgeGroupProps {
  children: React.ReactNode;
  gap?: number;
}

export function BadgeGroup({ children, gap = 8 }: BadgeGroupProps) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap }}>
      {children}
    </div>
  );
}
