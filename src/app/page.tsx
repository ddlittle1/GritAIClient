"use client";
import { Link } from "@chakra-ui/next-js";
import { Grid, GridItem, Show, Text } from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import ComponentList from "./components/ComponentList";

interface Props {
  onSearch: (searchText: string) => void;
}
export default function Page() {
  return (
    <>
      <Grid
        templateAreas={{
          base: `"nav" "main"`,
          lg: `"nav nav" "aside main"`,
        }}
        templateColumns={{
          base: "1fr",
          lg: "200px 1fr",
        }}
      >
        <GridItem area="nav">
          <NavBar />
        </GridItem>
        <Show above="lg">
          <GridItem area="aside">
            <ComponentList />
          </GridItem>
        </Show>
        <GridItem area="main">
          <Text color="red">Main</Text>
        </GridItem>
      </Grid>
      <Link href="/about" color="blue.400" _hover={{ color: "blue.500" }}>
        About
      </Link>
    </>
  );
}
