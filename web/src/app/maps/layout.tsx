import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FloodSense LK Maps",
  description: "Flood map views and emergency response layers.",
};

export default function MapsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
