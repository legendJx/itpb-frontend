import "./globals.css";

export const metadata = {
  title: "In The Park Baseball",
  description: "A baseball simulator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
