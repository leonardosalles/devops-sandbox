import "./globals.css";
import { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

export const dynamic = "force-static";

export const metadata = {
  title: "CS2 Server Manager",
  description: "CS2 Server Manager",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="/runtime-env.js" suppressHydrationWarning />
      </head>
      <body className="bg-scanlines">
        <div className="noise"></div>
        {children}
        <ToastContainer theme="dark" />
        <footer className="text-center text-xs text-gray-400 fixed bottom-0 w-full py-2 px-4">
          Made with <span className="text-red-500">❤️</span> by{" "}
          <strong>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/leonardosalles"
            >
              Leonardo Salles
            </a>
          </strong>
        </footer>
      </body>
    </html>
  );
}
