import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";

export interface RenderOptions {
  width?: number;
  height?: number;
  format?: "svg" | "png";
}

// Cache the font data
let fontCache: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;

  const fontPath = new URL("./fonts/Inter-Regular.ttf", import.meta.url);
  const fontData = await Bun.file(fontPath).arrayBuffer();
  fontCache = fontData;
  return fontData;
}

export async function renderToImage(
  element: ReactNode,
  options: RenderOptions = {}
): Promise<string | Buffer> {
  const { width = 800, height = 600, format = "png" } = options;

  const font = await loadFont();

  const svg = await satori(element as React.ReactElement, {
    width,
    height,
    fonts: [
      {
        name: "Inter",
        data: font,
        weight: 400,
        style: "normal",
      },
    ],
  });

  if (format === "svg") {
    return svg;
  }

  // Convert SVG to PNG using resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: width,
    },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

export async function renderToFile(
  element: ReactNode,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void> {
  const format = outputPath.endsWith(".svg") ? "svg" : "png";
  const result = await renderToImage(element, { ...options, format });

  if (typeof result === "string") {
    await Bun.write(outputPath, result);
  } else {
    await Bun.write(outputPath, result);
  }
}
