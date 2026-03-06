import "./globals.css";
import { ReduxProvider } from "@/src/store/provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-[#0a0e27]">
        <ReduxProvider> {children}</ReduxProvider>
      </body>
    </html>
  );
}
