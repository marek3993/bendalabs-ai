import { privatePageMetadata } from "@/lib/bendalabs/seo";
import { RequestFailure } from "@/components/bendalabs/request-status";
type Props = { searchParams?: Promise<{ back?: string; details?: string; message?: string }> };
export default async function Page({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  return <RequestFailure locale="cs" back={params?.back} details={params?.details} />;
}

export const metadata = privatePageMetadata("BendaLabs");
