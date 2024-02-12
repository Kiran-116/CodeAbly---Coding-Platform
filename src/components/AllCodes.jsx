import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Box,
  Avatar,
  Text,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import Stars from "./Stars";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { FaSignOutAlt } from "react-icons/fa";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { navigate } from "react-router-dom";

const AllCodes = () => {
  const navigate = useNavigate();
  const [codeArray, setCodeArray] = useState([]);
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const [showSpacesModal, setShowSpacesModal] = useState(false);
  const [spacesData, setSpacesData] = useState([]);
  const [image,setImage] = useState(`https://www.gravatar.com/avatar/${hashEmail(
    "user"
  )}?d=identicon`);
  const [selectedCodeID, setSelectedCodeID] = useState(null);

  const fetchCodes = async () => {
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/allcodes`,
      {
        email: user.email,
      }
    );
    setCodeArray(res.data);
  };

  const saveUser = async () => {
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/saveuser`,
      {
        username: user.name,
        email: user.email,
        profileURL: user.picture,
      }
    );
    localStorage.setItem("email", user.email);
    localStorage.setItem("name", user.name);
    localStorage.setItem("picture", user.picture);
  };

  useEffect(() => {
    const fetchData = async () => {
      setImage(user.picture)
      await saveUser();
      await fetchCodes();
    };
    if (!codeArray.length) {
      fetchData();
    }
  }, [codeArray]);

  const getSpacesForCode = async (codeID) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/getspaces`,
        {
          codeID: codeID,
        }
      );

      setSpacesData(res.data);
      setSelectedCodeID(codeID);
      setShowSpacesModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    console.log(spacesData);
  }, [spacesData]);

  const closeSpacesModal = () => {
    setShowSpacesModal(false);
    setSpacesData([]);
    setSelectedCodeID(null);
  };

  const handleHelp = (spaceId) => {
    console.log(spaceId);
    navigate(`/code/${selectedCodeID}?space=${spaceId}`);
  };

  const solvedQuestionsNumbers = {
    Numbers: codeArray.filter(
      (codeData) => codeData.label === "numbers" && codeData.stars !== -1
    ).length,
    Arrays: codeArray.filter(
      (codeData) => codeData.label === "arrays" && codeData.stars !== -1
    ).length,
    LinkedLists: codeArray.filter(
      (codeData) => codeData.label === "linked_lists" && codeData.stars !== -1
    ).length,
  };

  function hashEmail(email) {
    const md5 = require("md5");
    return md5(email.trim().toLowerCase());
  }

// setImage(user?.picture)
  return (
    <Box marginX={20} marginTop={10}>
      <div
        style={{
          position: "fixed",
          left: 2,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px",
          background: "white",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={user.picture}
            alt={user.name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          />
          <Text fontWeight="bold">{user.name}</Text>
          <Icon as={FaSignOutAlt} w={6} h={6} ml={3} onClick={logout} />
        </div>
      </div>

      {showSpacesModal && (
        // Your modal code here
        <Modal isOpen={showSpacesModal} onClose={closeSpacesModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Spaces for Code</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {spacesData && spacesData.length != 0 ? (
                spacesData.map((space) => (
                  <div key={space._id}>
                    <Avatar
                      src={space.profileURL}
                      name={space.username}
                      size="md"
                    />
                    <p>Username: {space.username}</p>
                    <Button onClick={() => handleHelp(space.spaceID)}>
                      Help them
                    </Button>
                  </div>
                ))
              ) : (
                <p>No user is currently working on the problem.</p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={closeSpacesModal}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <Tabs>
        <TabList>
          <Tab _selected={{ color: "white", bg: "black" }}>
            Numbers ({solvedQuestionsNumbers.Numbers}/
            {
              codeArray.filter((codeData) => codeData.label === "numbers")
                .length
            }
            )
          </Tab>
          <Tab _selected={{ color: "white", bg: "black" }}>
            Arrays ({solvedQuestionsNumbers.Arrays}/
            {codeArray.filter((codeData) => codeData.label === "arrays").length}
            )
          </Tab>
          <Tab _selected={{ color: "white", bg: "black" }}>
            Linked Lists ({solvedQuestionsNumbers.LinkedLists}/
            {
              codeArray.filter((codeData) => codeData.label === "linked_lists")
                .length
            }
            )
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ol>
              {codeArray.map(
                (codeData) =>
                  codeData.label === "numbers" && (
                    <Box
                      key={codeData._id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      marginY={5}
                    >
                      <div>
                        <h3>{codeData.question}</h3>
                        <Stars stars={codeData.stars} />
                      </div>
                      <Flex gap={2}>
                        <Button onClick={() => getSpacesForCode(codeData._id)}>
                          Get Live Stats
                        </Button>

                        <Link to={`/code/${codeData._id}`}>
                          <Button
                            _hover={{ bg: "black", color: "white" }}
                            bgColor="white"
                            color="black"
                            border="1px solid black"
                          >
                            Open
                          </Button>
                        </Link>
                      </Flex>
                    </Box>
                  )
              )}
              more questions coming soon..
            </ol>
          </TabPanel>
          <TabPanel>
            <ol>
              {codeArray.map(
                (codeData) =>
                  codeData.label === "arrays" && (
                    <Box
                      key={codeData._id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      marginY={5}
                    >
                      <div>
                        <h3>{codeData.question}</h3>
                        <Stars stars={codeData.stars} />
                      </div>
                      <Flex gap={2}>
                      <Button onClick={() => getSpacesForCode(codeData._id)}>
                          Get Live Stats
                        </Button>
                      <Link to={`/code/${codeData._id}`}>
                        <Button
                          _hover={{ bg: "black", color: "white" }}
                          bgColor="white"
                          color="black"
                          border="1px solid black"
                        >
                          Open
                        </Button>
                      </Link>
                      </Flex>
                    </Box>
                  )
              )}
              <br />
              more questions coming soon..
            </ol>
          </TabPanel>
          <TabPanel>Coming Sooon...</TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AllCodes;
