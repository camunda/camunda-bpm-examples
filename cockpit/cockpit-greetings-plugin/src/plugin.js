import React from "react";
import ReactDOM from "react-dom";

import Greetings from "./Greetings";
let container;

export default {
  id: "myDemoPlugin",
  pluginPoint: "cockpit.dashboard",
  priority: 9,
  render: (node, { CSRFToken }) => {
    container = node;
    ReactDOM.render(
      <Greetings CSRFToken={CSRFToken} />,
      container
    );
  },
  unmount: () => {
    ReactDOM.unmountComponentAtNode(container);
  }
};
