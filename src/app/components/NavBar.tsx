"use client";
import { Box, HStack, Text, useColorMode } from "@chakra-ui/react";
import { Logo } from "./Logo";
import ColorModeSwitch from "./ColorModeSwitch";
import { Logo2 } from "./logo2";
import SearchInput from "./SearchInput";

interface Props {
  onSearch: (searchText: string) => void;
}

const NavBar = ({ onSearch }: Props) => {
  console.log("rudolph");
  const { colorMode } = useColorMode();

  console.log("santa", colorMode);
  return (
    <HStack padding="10px">
      <Box color="blue" boxSize="60px">
        <Logo2 color={colorMode === "dark" ? "white" : "red"} boxSize="65px" />
      </Box>
      <SearchInput onSearch={onSearch} />
      <ColorModeSwitch />
    </HStack>
  );
};

export default NavBar;
