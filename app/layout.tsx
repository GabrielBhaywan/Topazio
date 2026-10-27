import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Topázio | Gestão empresarial",
  description: "Fundação do sistema de gestão empresarial Topázio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
