import React from "react";
import { Text } from "@chakra-ui/react";

function feetAndInches(decimal: number) {
  const feet = Math.floor(decimal);
  const inches = 12 * (decimal - Math.floor(decimal));

  return feet.toString() + "' " + inches.toFixed(2).toString() + '"';
}

const formatFeet = (ftVal: number) => {
  //console.log("og", ftVal * 1.0);
  const formattedString = feetAndInches(ftVal * 12.0);
  return <Text>{formattedString}</Text>;
};

export default formatFeet;
