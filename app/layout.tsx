import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <QueryProvider>
            {children}
            {/* Toaster is placed here so it can be called from anywhere */}
            <Toaster position="top-right" />
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}