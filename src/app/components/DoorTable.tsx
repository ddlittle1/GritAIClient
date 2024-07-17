import {
  Heading,
  Table,
  TableContainer,
  Tbody,
  Text,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

import React from "react";

interface Door {
  _id: string;
  uniqueId: string;
  familyType: string;
  mark?: string;
  finish?: string;
  cost?: string;
  fireRating?: string;
  constructionType?: string;
  thickness?: string | null;
  frameType?: string | null;
  frameMaterial?: string | null;
  operationType?: string | null;
  doc_Id: string;
  conversionTime: string;
}

interface Props {
  doors: Door[];
}
function getSampleDoors(): Door[] {
  const sampleDoor = [
    {
      _id: "aae61527-83e5-4f89-b68f-f99ebf5b0912-000e46ff",
      uniqueId: "aae61527-83e5-4f89-b68f-f99ebf5b0912-000e46ff",
      familyType: "Curtain Wall Sgl Glass 3'-6x7'",
      mark: "116",
      finish: "",
      cost: "",
      fireRating: "",
      constructionType: "",
      thickness: null,
      frameType: null,
      frameMaterial: "",
      operationType: null,
      doc_Id: "0fc792c6-1004-4298-b38a-b69122a546c1",
      conversionTime: "7/5/2024 8:17:33 PM",
    },
    {
      _id: "e07164ea-3f3d-4af3-8ff5-11881079f693-000e95db",
      uniqueId: "e07164ea-3f3d-4af3-8ff5-11881079f693-000e95db",
      familyType: '36" x 84"',
      mark: "117",
      finish: "",
      cost: "",
      fireRating: "",
      constructionType: "",
      thickness: null,
      frameType: null,
      frameMaterial: "",
      operationType: null,
      doc_Id: "0fc792c6-1004-4298-b38a-b69122a546c1",
      conversionTime: "7/5/2024 8:17:33 PM",
    },
  ];
  return sampleDoor;
}

const DoorTable = async (dors: Props) => {
  const dors2: Door[] = getSampleDoors();
  //const { data } = useDoors();
  // console.log("Doors - data", doors);
  const getDoors = async () => {
    const res = await fetch("http://localhost:8080/api/doors/getall");
    return res.json();
  };
  const doors: Door[] = await getDoors();
  return (
    <>
      <Heading fontSize="2xl">Door Elements</Heading>
      <TableContainer>
        <Table variant="striped">
          <Thead fontSize="2xl">
            <Tr>
              <Th>Type</Th>
              <Th>Identifier</Th>
              <Th>Document ID</Th>
              <Th>Extraction Time</Th>
            </Tr>
          </Thead>
          <Tbody>
            {doors.map((door: Door) => (
              <Tr key={door.uniqueId}>
                <Td>{door.familyType}</Td>
                <Td>{door.uniqueId}</Td>
                <Td>{door.doc_Id}</Td>
                <Td>{door.conversionTime}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default DoorTable;
