import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { BackToTop } from "@/components/BackToTop";

export const metadata = {
  title: "IPANMOVIE — Intelligent Movie Streaming",
  description: "Discover, watch and get AI-powered movie recommendations tailored just for you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>
          {children}
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}
