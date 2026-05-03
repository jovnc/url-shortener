"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRBlockProps {
  value: string;
  size?: number;
}

export function QRBlock({ value, size = 96 }: QRBlockProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="white"
      fgColor="#1a1714"
      level="M"
    />
  );
}
