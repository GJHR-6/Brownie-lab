import type { Metadata } from "next";

export const metadata: Metadata = { title: "Arma tu postre" };

export default function PersonalizaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
