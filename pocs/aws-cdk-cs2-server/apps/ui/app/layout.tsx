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
        <ToastContainer />
      </body>
    </html>
  );
}
