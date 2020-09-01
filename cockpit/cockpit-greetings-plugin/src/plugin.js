import React from "react";
import ReactDOM from "react-dom";

import Greetings from "./Greetings";
let container;

export default {
  id: "myDemoPlugin",
  pluginPoint: "cockpit.dashboard",
  priority: 9,
  render: (node, { api }) => {
    container = node;
    ReactDOM.render(
      <Greetings camundaAPI={api} />,
      container
    );
  },
  unmount: () => {
    ReactDOM.unmountComponentAtNode(container);
  }
};
