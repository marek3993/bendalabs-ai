export default function CzechLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div lang="cs">{children}</div>;
}
