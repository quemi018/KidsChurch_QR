import "server-only";

import QRCode from "qrcode";

import { buildQrPayload } from "./payload";

/** Error correction M: survives moderate screen glare / print smudges, stays scannable. */
const QR_OPTIONS = { errorCorrectionLevel: "M" as const, margin: 2 };

/** PNG data URL for on-screen display (server-rendered, no client JS needed). */
export async function qrDataUrl(token: string, widthPx = 320): Promise<string> {
  return QRCode.toDataURL(buildQrPayload(token), { ...QR_OPTIONS, width: widthPx });
}

/** PNG bytes for email attachments. */
export async function qrPngBuffer(token: string, widthPx = 512): Promise<Buffer> {
  return QRCode.toBuffer(buildQrPayload(token), { ...QR_OPTIONS, type: "png", width: widthPx });
}
