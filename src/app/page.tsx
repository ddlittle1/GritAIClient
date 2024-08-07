"use client";
import { Link } from "@chakra-ui/next-js";
import { Grid, GridItem, Show, Text } from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import ComponentList from "./components/ComponentList";
import DoorTable from "./components/DoorTable";
import { useState } from "react";
import Walls from "./Walls/page";

export interface TypeQuery {
  onSearch: (searchText: string) => void;
}

export interface ComponentQuery {
  selectedComponent: number;
}

export default function Page() {
  const [typeQuery, setTypeQuery] = useState<TypeQuery>({} as TypeQuery);
  const [selectedComponent] = useState<ComponentQuery>({} as ComponentQuery);
  var currentSelection = 1;
  const changeMe = false;
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
          <NavBar
            onSearch={(searchText) => {
              console.log("search", typeQuery);
            }}
          />
        </GridItem>
        <Show above="lg">
          <GridItem area="aside">
            <ComponentList
              selectedComponent={"Doors"}
              onSelectedComponent={() => {
                console.log("onselectedcomponent");
                console.log("selectedComponent", selectedComponent);
              }}
            />
          </GridItem>
        </Show>
        <GridItem area="main">{changeMe ? <Walls /> : <DoorTable />}</GridItem>
      </Grid>
      <Link href="/about" color="blue.400" _hover={{ color: "blue.500" }}>
        About
      </Link>
    </>
  );
}
