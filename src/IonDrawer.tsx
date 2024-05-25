import React from "react";
import { CupertinoPane } from "cupertino-pane";
import { useEffect, useRef, useState } from "react";

import { ReactElement } from "react";

export interface PanelProps {
  panelKey: string;
  children: ReactElement;
}

export interface FeedContent {
  panelKey: string;
}

const topPosition = 600;
const backdropOpacity = 0.4;

const IonDrawer = ({ panelKey, children }: PanelProps) => {
  const drawerRef = useRef<CupertinoPane>();
  const isShowing = useRef<boolean>(false);
  const [opacity, setOpacity] = useState<number>(backdropOpacity);

  const changeOpacity = (val: any, transition: any) => {
    // const backdrop = drawerRef.current?.backdrop;
    const topScreen = topPosition;
    const newScreen = window.screen.height - val;
    setOpacity((backdropOpacity * newScreen) / topScreen);
}

  useEffect(() => {
    drawerRef.current = new CupertinoPane(`.${panelKey}`, {
    initialBreak: "bottom",
      backdrop: isShowing.current,
      backdropOpacity: opacity,
      parentElement: "body",
      upperThanTop: true,
    buttonDestroy: false,
    breaks: {
        middle: { enabled: true, height: 300, bounce: true },
        bottom: { enabled: true, height: 80 },
    },
      events: {
        // onDidDismiss: () => hidePanel(),
        onBackdropTap: () => {
            drawerRef.current?.moveToBreak('bottom');
            isShowing.current = false;
        },
        onDrag: () => changeOpacity(drawerRef.current?.getPanelTransformY(), 'unset'),
        // onTransitionStart: (e) =>
        //   e?.translateY.new &&
        //   changeOpacity(e.translateY.new, "all 300ms ease 0s"),
      }
    });
    const showPanel = async () => {
        await drawerRef.current?.present({ animate: true });
      };
      if (!isShowing.current) {
        showPanel();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={panelKey}>{children}</div>;
};

export default IonDrawer;
