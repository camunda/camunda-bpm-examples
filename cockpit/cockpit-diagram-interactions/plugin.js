/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const renderTable = async (operationMap, node) => {
  if (!Object.keys(operationMap).length) {
    node.innerHTML = "No open Tasks";
    return;
  }

  const table = document.createElement("table");
  table.style = "table-layout: fixed; width: 100%;";
  table.createTHead().innerHTML = `
    <td>User</td>
    <td>Activity ID</td>
    <td>Open Task Count</td>`;

  const body = table.createTBody();

  for (const [user, tasks] of Object.entries(operationMap)) {
    for (const [task, count] of Object.entries(tasks)) {
      const row = document.createElement("tr");
      const userCol = document.createElement("td");
      const taskCol = document.createElement("td");
      const countCol = document.createElement("td");

      userCol.innerText = user;
      taskCol.innerText = task;
      countCol.innerText = count;

      row.appendChild(userCol);
      row.appendChild(taskCol);
      row.appendChild(countCol);
      body.appendChild(row);
    }
  }

  node.innerHTML = "";
  node.appendChild(table);
};

let cb = el => console.error("No callback defined: ", el);

const diagramPlugin = {
  id: "diagramPlugin",
  pluginPoint: "cockpit.processDefinition.diagram.plugin",
  priority: 5,
  render: viewer => {
    viewer.get("eventBus").on("element.click", event => {
      if (event.element.type.includes("Task")) {
        cb(event.element);
      } else {
        cb(false);
      }
    });
  }
};

const tabPlugin = {
  id: "tabPlugin",
  pluginPoint: "cockpit.processDefinition.runtime.tab",
  priority: 5,
  render: (node, { processDefinitionId, api }) => {
    async function getUsertasks(taskId) {
      const apiUrl = api.engineApi;
      let result;

      if (taskId) {
        result = await fetch(
          `${apiUrl}/task?processDefinitionId=${processDefinitionId}&taskDefinitionKey=${taskId}&maxResults=500`
        );
      } else {
        result = await fetch(
          `${apiUrl}/task?processDefinitionId=${processDefinitionId}&maxResults=500`
        );
      }

      const json = await result.json();
      const operationMap = {};
      json.forEach(task => {
        const assignee = task.assignee || "unassigned";
        const operationPerUser = operationMap[assignee] || {};
        operationPerUser[task.taskDefinitionKey] =
          operationPerUser[task.taskDefinitionKey] || 0;
        operationPerUser[task.taskDefinitionKey]++;
        operationMap[assignee] = operationPerUser;
      });

      renderTable(operationMap, node);
    }

    getUsertasks();

    cb = el => {
      getUsertasks(el.id);
    };
  },
  unmount: () => {
    cb = () => {};
  },
  properties: {
    label: "Open User Tasks"
  }
};

export default [tabPlugin, diagramPlugin];
