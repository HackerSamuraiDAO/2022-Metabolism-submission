import {
  Box,
  Button,
  Divider,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";

import { ConnectWalletWrapper } from "../ConnectWalletWrapper";

export const Main: React.FC = () => {
  return (
    <Box
      boxShadow={useColorModeValue("md", "md-dark")}
      borderRadius="2xl"
      py="8"
    >
      <Stack spacing="4" px="8">
        <ConnectWalletWrapper>
          <Button w="full">build something valuable</Button>
        </ConnectWalletWrapper>
      </Stack>
    </Box>
  );
};
