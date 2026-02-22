import "./globals.css";
import React from "react";

import { Providers } from "@/components/Providers";

export const metadata = {
  title: "Questio - AI MCQ Generator",
  description: "Generate high-quality multiple choice questions instantly using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
