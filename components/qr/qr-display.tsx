import { calculateAge } from "@/lib/utils/age";

type QrDisplayProps = {
  dataUrl: string;
  child: { full_name: string; gender: string; birthday: string };
};

/**
 * The on-screen QR card. Large, high-contrast, and print-friendly; the image
 * encodes only the opaque token. Guardians photograph or screenshot this.
 */
export function QrDisplay({ dataUrl, child }: QrDisplayProps) {
  return (
    <figure className="print-card mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Victory Caloocan Kids Church
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, no optimisation needed */}
      <img
        src={dataUrl}
        alt={`Kids Church QR code for ${child.full_name}`}
        width={320}
        height={320}
        className="mt-3 h-auto w-full max-w-[320px]"
      />
      <figcaption className="mt-2">
        <p className="text-2xl font-bold">{child.full_name}</p>
        <p className="text-slate-600">
          Age {calculateAge(child.birthday)} • {child.gender}
        </p>
      </figcaption>
    </figure>
  );
}
