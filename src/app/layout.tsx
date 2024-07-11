import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { Providers } from "../../providers";

import { fonts } from "./fonts";
import NavBar from "./components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grit AI Client",
  description: "Grit AI",
};
interface Props {
  onSearch: (searchText: string) => void;
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fonts.rubik.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
