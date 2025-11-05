import "./globals.css";
import Navbar from "./components/Navbar/Navbar"; // או "@/app/components/Navbar/Navbar"

export const metadata = {
  title: "MuseUp",
  description: "A social network for artists and art lovers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="pb-14 sm:pb-0">{children}</main>
      </body>
    </html>
  );
}
