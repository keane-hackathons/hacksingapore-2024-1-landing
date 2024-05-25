import React, { MutableRefObject } from "react";
import { CupertinoPane } from "cupertino-pane";
import { useEffect } from "react";

import { ReactElement } from "react";

export interface PanelProps {
  innerRef: MutableRefObject<CupertinoPane | undefined>;
  inputRef: MutableRefObject<HTMLIonInputElement | null>;
  panelKey: string;
  children?: ReactElement | ReactElement[];
}

const backdropOpacity = 0.4;

export default function IonFlyingModal ({ innerRef, inputRef, panelKey, children }: PanelProps) {

  useEffect(() => {
    innerRef.current = new CupertinoPane(`.${panelKey}`, {
      modal: {
        transition: 'zoom',
        flying: true
      },
      backdrop: true,
      backdropOpacity: backdropOpacity,
      parentElement: "body",
    buttonDestroy: false,
      events: {
        onDidPresent: () => inputRef.current?.setFocus(),
        onBackdropTap: () => innerRef.current?.destroy({animate: true}),
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={panelKey}>{children}</div>;
};
