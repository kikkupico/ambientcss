import React, { useState } from "react";
import { Container, Row, Col, Stack } from "react-bootstrap";
import {
  AmbientProvider,
  AmbientPanel,
  AmbientButton,
  AmbientKnob,
  AmbientSwitch,
} from "@ambientcss/components";

export default function App() {
  const [gain, setGain] = useState(50);
  const [armed, setArmed] = useState(false);

  return (
    <div style={{ background: "#e8edf2", minHeight: "100vh" }}>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs="auto">
            <AmbientProvider theme={{ lightHue: 220, lightSaturation: 14, lumeHue: 190, keyLight: 0.9, fillLight: 0.72 }}>
              <AmbientPanel style={{ padding: 24 }}>
                <Stack gap={3} className="align-items-center">
                  <AmbientButton>Play</AmbientButton>
                  <AmbientSwitch label="Arm" checked={armed} onCheckedChange={setArmed} led="#ef4444" />
                  <AmbientKnob label="Gain" value={gain} onChange={setGain} />
                </Stack>
              </AmbientPanel>
            </AmbientProvider>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
