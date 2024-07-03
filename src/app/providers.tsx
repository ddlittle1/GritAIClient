// app/providers.tsx
"use client";
import { theme } from "@chakra-ui/pro-theme";
import { extendTheme } from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/react";
import "@fontsource-variable/inter";
import gritTheme from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider theme={gritTheme}>{children}</ChakraProvider>;
}
