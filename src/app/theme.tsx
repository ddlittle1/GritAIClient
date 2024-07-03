/* theme.ts */
import { theme } from "@chakra-ui/pro-theme";
import { extendTheme } from "@chakra-ui/react";

const proTheme = extendTheme(theme);
const extendedConfig = {
  colors: { ...proTheme.colors, brand: proTheme.colors.teal },
  fonts: {
    heading: "'Inter Variable', -apple-system, system-ui, sans-serif",
    body: "'Inter Variable', -apple-system, system-ui, sans-serif",
  },
};

const gritTheme = extendTheme(extendedConfig, proTheme);

export default gritTheme;
