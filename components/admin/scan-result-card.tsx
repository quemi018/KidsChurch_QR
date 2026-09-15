import type { CheckInResult } from "@/lib/attendance/types";
import { formatTime, formatTimeWithSeconds } from "@/lib/utils/datetime";
import { formatPhilippineMobile } from "@/lib/validation/phone";

export type ScanDisplayState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "network_error" }
  | { kind: "result"; result: CheckInResult };

const tones = {
  success: "border-green-400 bg-green-50 text-green-950",
  warning: "border-amber-400 bg-amber-50 text-amber-950",
  error: "border-red-400 bg-red-50 text-red-950",
  neutral: "border-slate-300 bg-white text-slate-800",
};

/**
 * "LAST SCAN" card (spec §19, §32). Large text, obvious colour per outcome;
 * stays on screen until the next scan so a volunteer can verify the child.
 */
export function ScanResultCard({ state }: { state: ScanDisplayState }) {
  if (state.kind === "idle") {
    return (
      <Card tone="neutral" heading="Scanner ready">
        <p className="text-lg text-slate-600">Scan a child&apos;s QR code to check them in.</p>
      </Card>
    );
  }
  if (state.kind === "processing") {
    return (
      <Card tone="neutral" heading="Processing…">
        <p className="text-lg text-slate-600">Recording attendance.</p>
      </Card>
    );
  }
  if (state.kind === "network_error") {
    return (
      <Card tone="error" heading="Unable to record attendance">
        <p className="text-lg">Check the internet connection and scan again.</p>
      </Card>
    );
  }

  const { result } = state;
  switch (result.status) {
    case "checked_in":
      return (
        <Card tone="success" heading="CHECKED IN">
          <p className="text-4xl font-bold">{result.child.name}</p>
          <p className="text-2xl">
            Age {result.child.age} • {result.child.gender}
          </p>
          <div className="mt-3 space-y-0.5 text-lg">
            <p>
              <span className="text-green-800">Guardian:</span> {result.guardian.name}
            </p>
            <p>
              {result.guardian.relationship ? `${result.guardian.relationship} • ` : ""}
              {formatPhilippineMobile(result.guardian.contact)}
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold">
            Check-in: {formatTimeWithSeconds(result.checkedInAt)}
          </p>
        </Card>
      );
    case "already_checked_in":
      return (
        <Card tone="warning" heading="Already Checked In">
          <p className="text-4xl font-bold">{result.child.name}</p>
          <p className="text-2xl">
            Age {result.child.age} • {result.child.gender}
          </p>
          <p className="mt-3 text-lg font-semibold">
            Checked in at {formatTime(result.checkedInAt)}
          </p>
        </Card>
      );
    case "invalid_qr":
      return (
        <Card tone="error" heading="Invalid Kids Church QR Code">
          <p className="text-lg">This is not a Victory Kids Church QR code.</p>
        </Card>
      );
    case "unknown_qr":
      return (
        <Card tone="error" heading="QR Code Not Recognized">
          <p className="text-lg">Please ask an Admin for assistance.</p>
        </Card>
      );
    case "inactive_child":
      return (
        <Card tone="error" heading="Child Record Inactive">
          <p className="text-lg">Please ask an Admin for assistance.</p>
        </Card>
      );
    case "no_open_session":
      return (
        <Card tone="error" heading="No Kids Church Session Is Open">
          <p className="text-lg">Open a session before scanning attendance.</p>
        </Card>
      );
    case "unauthorized":
      return (
        <Card tone="error" heading="Not signed in as an Admin">
          <p className="text-lg">Please log in again.</p>
        </Card>
      );
    case "error":
      return (
        <Card tone="error" heading="Unable to record attendance">
          <p className="text-lg">Something went wrong. Please scan again.</p>
        </Card>
      );
  }
}

function Card({
  tone,
  heading,
  children,
}: {
  tone: keyof typeof tones;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className={`rounded-2xl border-4 p-6 shadow-sm ${tones[tone]}`}
    >
      <p className="text-sm font-bold tracking-widest uppercase">Last scan</p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-tight">{heading}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
