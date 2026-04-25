import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porch — Your neighborhood has a story",
  description: "Find out who's in charge, where your money goes, and how to help in your Oakland neighborhood.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
