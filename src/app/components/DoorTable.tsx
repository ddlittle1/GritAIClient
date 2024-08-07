
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
  Button,
  Container,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Box,
  Stack,
  Tooltip,
} from "@chakra-ui/react";

import React from "react";
import { TypeQuery } from "../page";
import DoorDetailModal from "./DoorDetailModal";

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
  docPath: string;
  docTitle: string;
}

interface Props {
  doorQuery: TypeQuery;
}
function getSampleDoors(): Door[] {
  const sampleDoor = [
    {
      doc_Id: "66a8218f1b39857cfd665fb9",
      _id: "66a8218f1b39857cfd665fb9",
      docPath:
        "G:\\mark@construxiv.com\\Takeout\\Drive\\Construxiv_Projects\\eTakeoff\\STINE - Office Building.rvt",
      docTitle: "STINE - Office Building",
      conversionTime: "7/29/2024 6:11:10 PM",
      uniqueId: "5640d2b0-f533-44ce-b8f8-ff5f9d74cca8-00024e7a",
      familyType: '36" x 84"',
      mark: "1",
      finish: "",
      cost: "",
      fireRating: "",
      constructionType: "",
      frameType: null,
      frameMaterial: "",
      operationType: null,
      thickness: null,
    },
    {
      doc_Id: "66a8218f1b39857cfd665fba",
      _id: "66a8218f1b39857cfd665fba",
      docPath:
        "G:\\mark@construxiv.com\\Takeout\\Drive\\Construxiv_Projects\\eTakeoff\\STINE - Office Building.rvt",
      docTitle: "STINE - Office Building",
      conversionTime: "7/29/2024 6:11:10 PM",
      uniqueId: "5640d2b0-f533-44ce-b8f8-ff5f9d74cca8-00024ea9",
      familyType: '36" x 84"',
      mark: "2",
      finish: "",
      cost: "",
      fireRating: "",
      constructionType: "",
      frameType: null,
      frameMaterial: "",
      operationType: null,
      thickness: null,
    },
  ];
  return sampleDoor;
}

const DoorTable = async () => {
  // const doors: Door[] = getSampleDoors();
  //const { data } = useDoors();
  /// console.log("Doors - data", doors);
  const getDoors = async () => {
    const res = await fetch("http://localhost:8080/api/doors/getall");
    return res.json();
  };
  const doors: Door[] = await getDoors();
  // console.log('door', doors[0])
  //console.log('query', typeQuery); console.log('doors')
  return (
    <>
      <Heading fontSize="2xl">Door Elements</Heading>
      <TableContainer>
        <Table variant="simple">
          <Thead fontSize="2xl">
            <Tr>
              <Th>Type</Th>
              <Th>Title</Th>
              <Th>Identifier</Th>
              <Th>Document ID</Th>
              <Th>Extraction Time</Th>
            </Tr>
          </Thead>
          <Tbody>
            {doors.map((door: Door) => (
              <>
                <Tooltip label="Auto start" placement="auto-start">
                  <Button>Auto-Start</Button>

                  <Tr
                    data-key={door.uniqueId}
                    key={door.uniqueId}
                    className="hover:bg-sky-200"
                    onClick={(e) => {
                      const el = e.target as HTMLTableRowElement;
                      console.log(
                        "id",
                        el.parentElement?.dataset?.key,
                        "text",
                        el.innerHTML
                      );
                    }}
                  > <Tooltip label='Auto start' id="tt1" placement='auto-start'>
                      <Button>Auto-Start</Button>
                    </Tooltip>

                    <Td data-tooltip-content={door.docTitle} data-tooltip-id="tt1">{door.familyType}</Td>

                    <Td>{door.docTitle}</Td>
                    <Td>{door.mark}</Td>
                    <Td>{door.doc_Id}</Td>
                    <Td>{door.conversionTime}</Td>
                  </Tr>
                </Tooltip>
              </>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default DoorTable;
