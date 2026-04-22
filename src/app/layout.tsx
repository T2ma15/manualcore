import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManualCore — Every process. Fully documented.",
  description:
    "Process Knowledge Formalization Engine. Turn unstructured process knowledge into formal industrial documentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
