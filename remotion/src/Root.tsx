import React from "react";
import { Composition } from "remotion";
import { WorkflowCanvasBait } from "./compositions/WorkflowCanvasBait";
import { IDEAutoBuildBait } from "./compositions/IDEAutoBuildBait";
import { SlackChatBait } from "./compositions/SlackChatBait";
import { RevenueDashboardBait } from "./compositions/RevenueDashboardBait";
import { XMultiAccountBait } from "./compositions/XMultiAccountBait";
import { AgentMonitorBait } from "./compositions/AgentMonitorBait";
import { ContentFactoryBait } from "./compositions/ContentFactoryBait";
import { PersonaForgeBait } from "./compositions/PersonaForgeBait";
import { AccountFarmBait } from "./compositions/AccountFarmBait";
import { BanShieldBait } from "./compositions/BanShieldBait";
import { RevenueStackBait } from "./compositions/RevenueStackBait";
import { DMCloserBait } from "./compositions/DMCloserBait";
import { ImageFactoryBait } from "./compositions/ImageFactoryBait";

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
      <Composition
        id="IDEAutoBuildBait"
        component={IDEAutoBuildBait}
        durationInFrames={FPS * 24}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="SlackChatBait"
        component={SlackChatBait}
        durationInFrames={FPS * 17}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="RevenueDashboardBait"
        component={RevenueDashboardBait}
        durationInFrames={FPS * 18}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="XMultiAccountBait"
        component={XMultiAccountBait}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="AgentMonitorBait"
        component={AgentMonitorBait}
        durationInFrames={FPS * 16}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="ContentFactoryBait"
        component={ContentFactoryBait}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="PersonaForgeBait"
        component={PersonaForgeBait}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="AccountFarmBait"
        component={AccountFarmBait}
        durationInFrames={FPS * 18}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="BanShieldBait"
        component={BanShieldBait}
        durationInFrames={FPS * 16}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="RevenueStackBait"
        component={RevenueStackBait}
        durationInFrames={FPS * 18}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="DMCloserBait"
        component={DMCloserBait}
        durationInFrames={FPS * 18}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="ImageFactoryBait"
        component={ImageFactoryBait}
        durationInFrames={FPS * 18}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
