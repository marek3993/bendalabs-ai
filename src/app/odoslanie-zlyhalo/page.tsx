import { privatePageMetadata } from "@/lib/bendalabs/seo";

export const metadata = privatePageMetadata("Odoslanie zlyhalo | BendaLabs");

import { RequestFailure } from "@/components/bendalabs/request-status";
type Props = { searchParams?: Promise<{ back?: string; details?: string; message?: string }> };
export default async function Page({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  return <RequestFailure locale="sk" back={params?.back} details={params?.details} />;
}
