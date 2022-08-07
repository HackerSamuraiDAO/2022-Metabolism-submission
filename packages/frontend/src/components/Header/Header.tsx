import { Box, Flex, Text } from "@chakra-ui/react";
import React from "react";

import { SERVICE_NAME } from "../../lib/app/constants";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";
import { Wallet } from "../Wallet";

export const Header: React.FC = () => {
  return (
    <Box p="4" as="header">
      <Flex justify="space-between">
        <Text fontWeight={"bold"}>{SERVICE_NAME}</Text>
        <ConnectWalletWrapper>
          <Wallet />
        </ConnectWalletWrapper>
      </Flex>
    </Box>
  );
};
