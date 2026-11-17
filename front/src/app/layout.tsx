import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
export const metadata: Metadata = { title: "RedChat", description: "Общий чат в реальном времени" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ru"><body><Providers>{children}</Providers></body></html>;
}
