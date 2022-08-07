import { Box, Button } from "@chakra-ui/react";
import React from "react";
import { useConnect } from "wagmi";

import { injectedConnector } from "../../lib/wagmi";

export interface ConnectWalletProps {
  callback?: () => void;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ callback }) => {
  const { connect } = useConnect();

  const connectMetamask = () => {
    connect({ connector: injectedConnector });
    if (callback) {
      callback();
    }
  };

  return (
    <Box>
      <Button width="full" onClick={connectMetamask}>
        Metamask
      </Button>
    </Box>
  );
};
