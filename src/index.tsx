import React from "react";
import ReactDom from "react-dom/client";
import { App } from "./App";
// import { connect } from "utils/redux";
// import * as redux from "./redux";


// const ConnectedApp = connect({ App, redux });
const ConnectedApp = App;
let root:ReactDom.Root | null = null;

window.addEventListener("beforeunload", () => {
    if (root) {
        root.unmount();
    }
});

window.addEventListener("pageshow", () => {
    const mountPoint = document.querySelector("#react-root");
    root = ReactDom.createRoot(mountPoint!);

    root.render(<ConnectedApp />);
});