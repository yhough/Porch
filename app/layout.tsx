import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porch — Your neighborhood, finally legible",
  description: "See who represents you, where your taxes go, and how to get involved in your Oakland neighborhood.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
