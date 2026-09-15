"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Development-only aid: exposes the text a USB scanner would type, so the
 * check-in flow can be tried without hardware. Never rendered in production
 * (the page only mounts it when NODE_ENV === "development").
 */
export function DevScanHelper({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the text is selectable below.
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-4 text-sm print:hidden">
      <p className="font-semibold text-purple-900">Testing without a scanner (development only)</p>
      <p className="mt-1 text-purple-900">
        A USB scanner would type this text into the Admin Scanner and press Enter. Copy it, open the
        Admin Scanner in another browser window, paste, press Enter.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={payload}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 rounded border border-purple-300 bg-white px-2 py-1 font-mono text-xs"
        />
        <Button variant="secondary" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
