import "./globals.css";
import { ReduxProvider } from "@/src/store/provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <ReduxProvider> {children}</ReduxProvider>
      </body>
    </html>
  );
}
