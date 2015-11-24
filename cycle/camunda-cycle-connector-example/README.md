# camunda Cycle Connectors

This example demonstrates how to create a new Connector for [camunda Cycle][1]. It contains the implementation of a simple example connector which persists bmpn models in an in-memory map.

![Create Connector Screenshot][2]



## Implementation of a Connector

A Connector must implement the abstract methods of the Connector class:

* `createNode(String parentId, String label, ConnectorNodeType type, String message)`: Creates a new node (e.g. file, folder, etc.). Must return the new ConnectorNode.
* `deleteNode(ConnectorNode node, String message) `: Deletes a given node.
* `getChildren(ConnectorNode parent)`: Returns the children of a given parent node as a List of ConnectorNodes.
* `getContent(ConnectorNode node)`: Get the contents of the given node as an input stream.
* `getContentInformation(ConnectorNode node)`: Returns a ContentInformation for the given connector node.
* `getNode(String id)`: Returns a ConnectorNode to the assigned id.
* `getRoot()`: Returns the root node. The root node must have the label `/`
* `isSupportsCommitMessage()`: Returns a boolean indicating if this connector supports commit messages.
* `needsLogin()`: Returns a boolean indicating if this connector needs login information.
* `updateContent(ConnectorNode node, InputStream newContent, String message)`: Update the content of a given node and return the updated contentInformation.

The implementation of these methods for this example can be found in the [`ExampleConnector.java`][3] class. Additionally, this example includes a custom [`ExampleConnectorNode.java`][4] class, which is capable of storing data in memory.


## Configuration of the Example Connector

The connector of this example stores all files in a single memory based map. In order to display the contents of the map, the root node contains a folder, which is the parent folder of all files in the map. The user can configure the name of this folder when instancing a new connector.

This configuration parameter as well as the other necessary configuration can be done by adding the following snipped to the `connector-configurations.xml` file as described in the [installation guide][5].

```xml
<bean name="exampleConnectorDefinition" class="org.camunda.bpm.cycle.entity.ConnectorConfiguration">
  <property name="name" value="Example Connector"/>
  <property name="connectorClass" value="org.camunda.cycle.example.ExampleConnector"/>
  <property name="loginMode" value="LOGIN_NOT_REQUIRED" />
  <property name="properties">
    <map>
      <entry key="folderName" value="default"></entry>
    </map>
  </property>
</bean>
```


## How to use it?

1. Checkout the project with Git
2. Build the project with maven
3. Deploy the jar file to a cycle distribution (see [installation guide][5])
4. Update the `connector-configurations.xml` file
4. Start Cycle, goto Connectors and add a new Example Connector

[1]: https://docs.camunda.org/manual/webapps/cycle/
[2]: docs/screenshot.png
[3]: src/main/java/org/camunda/cycle/example/ExampleConnector.java
[4]: src/main/java/org/camunda/cycle/example/ExampleConnectorNode.java
[5]: https://docs.camunda.org/manual/installation/cycle/#add-connectors
