import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Center,
  Heading,
  Text,
  Button,
  Image,
  Container,
  Grid,
  GridItem,
  Flex,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
const CodingIllustration = require("../images/coding_illustration.jpeg");

const LandingPage = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  const handleAuth = async () => {
    await loginWithRedirect();
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box bg="white" minH="100vh">
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        p="4"
        bg="transparent" 
        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.1)" 
      >
        <Text fontSize="xl" fontWeight="bold" color="black">
          CODEABLy 👨‍💻
        </Text>{" "}
      </Flex>

      <Center py="10">
        <Container maxW="container.xl">
          <Grid templateColumns="1fr 1fr" gap={10}>
            <GridItem>
              <Heading as="h1" size="2xl" color="black">
                Welcome to CODEABLy
              </Heading>
              <Text fontSize="xl" mt="4" color="black">
                Your Coding Companion
              </Text>
              <Text fontSize="lg" mt="6" color="gray.600">
                CodeAbly is a coding platform that helps you learn, visualize your
                performance, get help from coding experts or help someone who might need you
                 and solve coding problems with the power of AI
                assistance.
              </Text>
              <Button
                colorScheme="blue"
                size="lg"
                mt="8"
                mr="4"
                px="8"
                _hover={{ bg: "black", color: "white" }}
                onClick={handleAuth}
                bgColor="white" 
                color="black" 
                border="1px solid black"
              >
                Get Started
              </Button>
            </GridItem>
            <GridItem>
              <Image
                src={CodingIllustration} 
                alt="Coding Illustration"
                w="50%"
                borderRadius={5}
              />
            </GridItem>
          </Grid>
        </Container>
      </Center>

      <Center py="13">
        <Container maxW="container.lg">
          <Heading as="h2" size="xl" textAlign="center" color="black">
            Key Features
          </Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={6} mt="8">
            <GridItem>
              <Box
                p="4"
                bg="white"
                color="black"
                boxShadow="5px 5px 5px rgba(0, 0, 0, 0.1)"
                borderRadius="lg"
              >
                <Heading as="h3" size="lg">
                  Realtime Coding Collabs
                </Heading>
                <Text fontSize="md">
                  Connect with any of the available coding enthusiast and 
                  have a great collaboration experiences.
                </Text>
              </Box>
            </GridItem>
            <GridItem>
              <Box
                p="4"
                bg="white"
                color="black"
                boxShadow="5px 5px 5px rgba(0, 0, 0, 0.1)"
                borderRadius="lg"
              >
                <Heading as="h3" size="lg">
                  Real Time Sync Management 
                </Heading>
                <Text fontSize="md">
                  Real time activity visualization and
                  Component Locking Feature to maintain data synchronization.
                </Text>
              </Box>
            </GridItem>
            <GridItem>
              <Box
                p="4"
                bg="white"
                color="black"
                boxShadow="5px 5px 5px rgba(0, 0, 0, 0.1)"
                borderRadius="lg"
              >
                <Heading as="h3" size="lg">
                  AI Assistance and Initial Credits
                </Heading>
                <Text fontSize="md">
                  Get AI-powered assistance and some credits to get helped 
                  during unavailability of potential helper.
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Center>
      <Center mt={2}>
        <Text fontSize="md" color="gray.500">
        CODEABLy: Revolutionizing coding collabs 👨‍💻
        </Text>
      </Center>
    </Box>
  );
};

export default LandingPage;
