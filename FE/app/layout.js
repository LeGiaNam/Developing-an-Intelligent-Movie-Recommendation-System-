import "./globals.css";

export const metadata = {
  title: "IPANMOVIE",
  description: "A cinematic movie recommendation and streaming interface.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
