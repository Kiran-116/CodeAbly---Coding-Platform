import { StarIcon } from "@chakra-ui/icons";
import { Text, Box } from "@chakra-ui/react";
import React from "react";

const Stars = ({ stars }) => {
  if (stars === -1) {
    return (
      <Box bg="black" color="white" p={1} borderRadius="md" display="inline-block">
        <Text>Not Solved</Text>
      </Box>
    );
  }

  return (
    <Box>
      {[...Array(5)].map((_, index) => (
        <StarIcon
          key={index}
          color={index < stars ? "green.500" : "gray.200"}
        />
      ))}
    </Box>
  );
};

export default Stars;
