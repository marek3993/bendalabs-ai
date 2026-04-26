"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackGoogleAdsConversion } from "@/lib/analytics/google-ads";

type ContactRequestSuccessStateProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
};

export default function ContactRequestSuccessState({
  backHref,
  backLabel,
  title,
  description,
}: ContactRequestSuccessStateProps) {
  useEffect(() => {
    trackGoogleAdsConversion();
  }, []);

  return (
    <main className="section-surface-soft min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_16px_50px_rgba(17,17,17,0.05)] sm:p-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Lead form</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">{description}</p>

        <Link
          href={backHref}
          className="mt-8 inline-flex rounded-full border border-black bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
