/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.cycle.example;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.camunda.bpm.cycle.connector.Connector;
import org.camunda.bpm.cycle.connector.ConnectorNode;
import org.camunda.bpm.cycle.connector.ConnectorNodeType;
import org.camunda.bpm.cycle.connector.ContentInformation;
import org.camunda.bpm.cycle.entity.ConnectorConfiguration;

/**
 * An example connector implementation which persists BPMN files to a
 * simple memory based map.
 *
 */
public class ExampleConnector extends Connector {

  protected ExampleConnectorNode rootNode;
  protected ExampleConnectorNode folder;

  protected Map<String, ExampleConnectorNode> nodes = new HashMap<String, ExampleConnectorNode>();

  public void init(ConnectorConfiguration config) {
    super.init(config);
    rootNode = new ExampleConnectorNode("/", getId(), ConnectorNodeType.FOLDER);
    folder = new ExampleConnectorNode(config.getProperties().get("folderName"), getId(), ConnectorNodeType.FOLDER);
  }

  public ConnectorNode createNode(String parentId, String label, ConnectorNodeType type, String message) {
    ExampleConnectorNode newNode = new ExampleConnectorNode(label, getId());
    nodes.put(label, newNode);
    return newNode;
  }

  public void deleteNode(ConnectorNode node, String message) {
    nodes.remove(node.getLabel());
  }

  public List<ConnectorNode> getChildren(ConnectorNode parent) {
    if(parent.getId().equals(folder.getId())) {
      return new ArrayList<ConnectorNode>(nodes.values());
    }
    else if(parent.getId().equals(rootNode.getId())) {
      return Collections.<ConnectorNode>singletonList(folder);
    }
    else {
      return Collections.emptyList();
    }
  }

  public InputStream getContent(ConnectorNode node) {
    ExampleConnectorNode exampleConnectorNode = nodes.get(node.getId());
    ByteArrayInputStream inputStream = null;
    if(exampleConnectorNode == null) {
      inputStream = new ByteArrayInputStream(new byte[0]);
    }
    else {
      byte[] content = exampleConnectorNode.getContent();
      if(content == null) {
        content = new byte[0];
      }
      inputStream = new ByteArrayInputStream(content);
    }
    return inputStream;
  }

  public ContentInformation getContentInformation(ConnectorNode node) {
    ExampleConnectorNode exampleConnectorNode = nodes.get(node.getId());
    if(exampleConnectorNode == null) {
      return ContentInformation.notFound();
    }
    else {
      return new ContentInformation(true, exampleConnectorNode.getLastModified());
    }
  }

  public ConnectorNode getNode(String id) {
    return nodes.get(id);
  }

  public ConnectorNode getRoot() {
    return rootNode;
  }

  public boolean isSupportsCommitMessage() {
    return false;
  }

  public boolean needsLogin() {
    return false;
  }

  public ContentInformation updateContent(ConnectorNode node, InputStream newContent, String message) throws Exception {
    ExampleConnectorNode exampleConnectorNode = nodes.get(node.getId());
    if(exampleConnectorNode == null) {
      throw new RuntimeException("Node with id "+node.getId()+" not found.");
    }
    else {
      ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
      byte[] buffer = new byte[1024];
      int bytesRead = 0;
      while((bytesRead = newContent.read(buffer, 0, buffer.length))> 0) {
        byteArrayOutputStream.write(buffer, 0, bytesRead);
      }
      exampleConnectorNode.setContent(byteArrayOutputStream.toByteArray());
      return getContentInformation(exampleConnectorNode);
    }
  }

}
