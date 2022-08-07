import { Box, Button, Stack, useColorModeValue } from "@chakra-ui/react";
import React from "react";

import { Mode } from "../../types/livepeer";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";

export const Main: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>("select");

  return (
    <Box
      boxShadow={useColorModeValue("md", "md-dark")}
      borderRadius="2xl"
      p="8"
    >
      <Box>
        {mode === "select" && (
          <Stack>
            <Button
              w="full"
              onClick={() => {
                setMode("create");
              }}
            >
              Create Streaming
            </Button>
            <Button
              w="full"
              onClick={() => {
                setMode("view");
              }}
            >
              View Streaming
            </Button>
          </Stack>
        )}
        {mode == "create" && (
          <Stack>
            <ConnectWalletWrapper>
              <Button w="full">Start</Button>
            </ConnectWalletWrapper>
            <Button
              w="full"
              onClick={() => {
                setMode("select");
              }}
            >
              Back
            </Button>
          </Stack>
        )}
        {mode == "view" && (
          <Stack>
            <Button w="full">View</Button>
            <Button
              w="full"
              onClick={() => {
                setMode("select");
              }}
            >
              Back
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};
