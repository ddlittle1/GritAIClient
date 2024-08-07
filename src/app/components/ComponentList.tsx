import { Button, Heading, List, ListItem } from "@chakra-ui/react";
import React, { SyntheticEvent } from "react";
import useComponentTypes, { ComponentTypes } from "../hooks/useComponents";

interface Props {
  onSelectedComponent: (component: number) => void;
  selectedComponent: string;
}
const ComponentList = ({ onSelectedComponent, selectedComponent }: Props) => {
  const { dat, isLoading, error } = useComponentTypes();

  return (
    <>
      <Heading fontSize="2xl" marginBottom={3}>
        Components
      </Heading>
      <List paddingLeft={5}>
        {dat.map((compType) => (
          <ListItem key={compType.id}>
            <Button
              whiteSpace="normal"
              textAlign="left"
              key={compType.id}
              onClick={(e: SyntheticEvent) => {
                const el = e.target as HTMLButtonElement;
                console.log("hello\n", el.innerHTML);
                selectedComponent = el.innerHTML;
                // el.innerText = "no";
              }}
              variant="link"
              isActive={compType.enabled}
            >
              {compType.name}
            </Button>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default ComponentList;
