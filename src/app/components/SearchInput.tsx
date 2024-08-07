import { Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import React, { useRef } from "react";
import { BsSearch } from "react-icons/bs";
import { FaBuilding, FaSearch } from "react-icons/fa";

interface Props {
  onSearch: (searchText: string) => void;
}
const SearchInput = ({ onSearch }: Props) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        console.log("search", ref.current?.value);
        if (ref.current) onSearch(ref.current.value);
      }}
    >
      <InputGroup paddingLeft={5} paddingRight={5}>
        <InputLeftElement paddingLeft={6}> {<FaSearch />} </InputLeftElement>
        <Input
          borderRadius={20}
          placeholder="Search..."
          variant="filled"
        />{" "}
      </InputGroup>
    </form>
  );
};

export default SearchInput;
