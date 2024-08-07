import {
  Heading,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Button,
  Link,
} from "@chakra-ui/react";
import React from "react";
import formatFeet from "../components/formatFeet";

interface Wall {
  _id: string;
  name: string;
  conversionTime: string;
  structuralUsage: string;
  width: number;
  displayUnitSystem: string;
  doc_Id: string;
  uniqueId: string;
  docPath: string;
  docTitle: string;
}

function getSampleWalls(): Wall[] {
  const sampleWall: Wall[] = [
    {
      _id: "66a309d0f8e1184ccbc53ac9",
      name: "Exterior - Wood Panel on Metal Stud - Parapet",
      conversionTime: "7/26/2024 2:28:29 AM",
      structuralUsage: "NonBearing",
      width: 0.9062500000000001,
      displayUnitSystem: "IMPERIAL",
      doc_Id: "0fc792c6-1004-4298-b38a-b69122a546c1",
      uniqueId: "5e0bc1aa-5715-46e1-a969-6e93a8d1c547-000db810",
      docTitle: "Audubon_Arch_2025",
      docPath: "C:\\Users\\david\\revitSamples\\audubon\\Audubon_Arch_2025.rvt",
    },
    {
      _id: "66a309d0f8e1184ccbc53aca",
      name: 'Interior - 9 1/4" Partition - 1 HR- P6',
      conversionTime: "7/26/2024 2:28:29 AM",
      structuralUsage: "NonBearing",
      width: 0.7708333333333334,
      displayUnitSystem: "IMPERIAL",
      doc_Id: "0fc792c6-1004-4298-b38a-b69122a546c1",
      uniqueId: "5e0bc1aa-5715-46e1-a969-6e93a8d1c547-000db82d",
      docTitle: "Audubon_Arch_2025",
      docPath: "C:\\Users\\david\\revitSamples\\audubon\\Audubon_Arch_2025.rvt",
    },
  ];
  return sampleWall;
}

const Walls = async () => {
  const getWalls = async () => {
    const res = await fetch("http://localhost:8080/api/walls/getall");

    //console.log("getWalls", res.json())
    return res.json();
  };
  const walls = await getWalls();
  //const walls = getSampleWalls();
  console.log("walls", walls[0]);
  return (
    <>
      <Heading fontSize="2xl">Wall Elements</Heading>
      <TableContainer>
        <Table variant="striped">
          <Thead fontSize="2xl">
            <Tr>
              <Th>Type</Th>
              <Th>DB Identifier</Th>
              <Th>Document ID</Th>
              <Th>Document Title</Th>
              <Th>Structural Usage</Th>
              <Th>Width</Th>
              <Th>Units</Th>
              <Th>Unique Id</Th>
              <Th>Extraction Time</Th>
            </Tr>
          </Thead>
          <Tbody>
            {walls.map((wall: Wall) => (
              <Tr key={wall._id}>
                <Td>{wall.name}</Td>
                <Td>{wall._id}</Td>
                <Td>{wall.doc_Id}</Td>
                <Td>
                  <Link href={wall.docPath}>{wall.docTitle}</Link>
                </Td>
                <Td>{wall.structuralUsage}</Td>
                <Td>{formatFeet(wall.width)}</Td>
                <Td>{wall.displayUnitSystem}</Td>
                <Td>{wall.uniqueId}</Td>
                <Td>{wall.conversionTime}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Walls;
