"use client";

import Image from "next/image";
import Link from "next/link";

type SiteBrandProps = {
  href: string;
  tagline: string;
};

export default function SiteBrand({ href, tagline }: SiteBrandProps) {
  return (
    <Link href={href} aria-label="BendaLabs" className="group inline-flex items-center gap-3">
      <Image
        src="/bendalabs-logo.png"
        alt=""
        width={512}
        height={512}
        priority
        sizes="(min-width: 640px) 32px, 28px"
        className="h-[28px] w-auto shrink-0 sm:h-[32px]"
      />

      <span className="flex min-w-0 flex-col">
        <span className="text-lg font-semibold leading-none tracking-[-0.04em] text-neutral-950">
          BendaLabs
        </span>
        <span className="mt-1 hidden text-[11px] leading-none text-neutral-500 sm:block">{tagline}</span>
      </span>
    </Link>
  );
}
