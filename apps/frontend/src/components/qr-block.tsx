'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRBlockProps {
  value: string;
  size?: number;
}

export function QRBlock({ value, size = 96 }: QRBlockProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#ffffff"
      fgColor="#1A1714"
      level="M"
    />
  );
}
