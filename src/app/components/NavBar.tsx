"use client";
import { Box, HStack, Link, Text, useColorMode } from "@chakra-ui/react";
import { Logo } from "./Logo";
import ColorModeSwitch from "./ColorModeSwitch";
import { Logo2 } from "./logo2";
import SearchInput from "./SearchInput";

interface Props {
  onSearch: (searchText: string) => void;
}

const NavBar = ({ onSearch }: Props) => {
  const { colorMode } = useColorMode();
  return (
    <HStack padding="10px">
      <Box boxSize="60px">
        <Link href="/">
          <Logo2 boxSize="65px" />
        </Link>
      </Box>
      <SearchInput onSearch={onSearch} />
      <ColorModeSwitch />
    </HStack>
  );
};

export default NavBar;
