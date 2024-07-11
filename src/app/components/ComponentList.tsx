import { Button, Heading, List, ListItem } from "@chakra-ui/react";
import React from "react";
import useComponentTypes from "../hooks/useComponents";

const ComponentList = () => {
  const { data, isLoading, error } = useComponentTypes();

  return (
    <>
      <Heading fontSize="2xl" marginBottom={3}>
        Components
      </Heading>
      <List>
        {data.map((compType) => (
          <ListItem key={compType.id}>
            <Button whiteSpace="normal" textAlign="left" variant="link">
              {compType.name}
            </Button>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default ComponentList;
