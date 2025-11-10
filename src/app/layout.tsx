import "./globals.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Footer from "./components/Footer/Footer";
import type { ReactNode } from "react";

export const metadata = { title: "MuseUp" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          color: "#121826",
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        {/* Sidebar קבוע, ינהל גם ריווח תוכן דרך CSS variable */}
        <Sidebar />

        {/* התוכן הראשי – מקבל padding-right מה־:root שמוגדר ב-Sidebar */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr auto",
            gridTemplateAreas: `"main" "footer"`,
            minHeight: "100vh",
            paddingRight: "var(--sidebar-space, 24px)",
          }}
        >
          <main style={{ gridArea: "main", padding: 16 }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
