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

import React, { useState, useEffect } from "react";

import { Table } from "./Table";

function ProcessInstanceCount({ camundaAPI }) {
  const [processInstanceCounts, setProcessInstanceCounts] = useState();

  const cockpitApi = camundaAPI.cockpitApi;
  const engine = camundaAPI.engine;

  useEffect(() => {
    fetch(
      `${cockpitApi}/plugin/sample-plugin/${engine}/process-instance`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )
      .then(async res => {
        setProcessInstanceCounts(await res.json());
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  if (!processInstanceCounts) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <h1>Process Instances per Definition</h1>

    <Table
      head={
        <>
          <Table.Head key="processDefinitionKey">Key</Table.Head>
          <Table.Head key="instancesCount">Instances</Table.Head>
        </>
      }
    >
      {processInstanceCounts.map(processDefinition => {
        return (
          <Table.Row key={processDefinition.key}>
            <Table.Cell key="processDefinitionKey">{processDefinition.key}</Table.Cell>
            <Table.Cell key="instancesCount">{processDefinition.instanceCount}</Table.Cell>
          </Table.Row>
        );
      })}
    </Table>
  </>
  );
}

export default ProcessInstanceCount;
