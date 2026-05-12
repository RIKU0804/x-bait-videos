import React from "react";
import { Composition } from "remotion";
import { WorkflowCanvasBait } from "./compositions/WorkflowCanvasBait";

const FPS = 30;
const W = 1920;
const H = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WorkflowCanvasBait"
        component={WorkflowCanvasBait}
        durationInFrames={FPS * 17}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
