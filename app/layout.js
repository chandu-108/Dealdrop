import "./globals.css";
import ToasterClient from "@/components/ui/Toaster";

export const metadata = {
  title: "Create Next App",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`vsc-initialized`}>
        {children}
        <ToasterClient />
      </body>
        </html>
  );
}