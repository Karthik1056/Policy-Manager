import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";
import GlobalAIAssistant from "@/components/GlobalAIAssistant";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
            <GlobalAIAssistant />
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}