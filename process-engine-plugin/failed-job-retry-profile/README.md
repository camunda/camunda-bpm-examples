# Job Retry Profile Parse Listener

This example demonstrates how to configure "job retry profile" for each external system as Process Engine Plugin.

Usually there are specific patterns during communication between the process engine and external systems. Let's imagine you want to configure that every time a job fails trying to connect to specific external system (for example CRM system) to retry at least 10 times within duration 5 minutes. This is your right example to do so.

## Show me the important parts!

The process model is composed of four service tasks communicating with two different external systems - CRM and ERP:

![Process Model][1]

* Every ServiceTask contains custom extension property `retryProfile` which defines the profile name of the external system in this case - CRM and ERP.

### Create a Process Engine Plugin Implementation

In order to extend the `org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin` class:

``` java
public class FailedJobRetryProfilePlugin extends AbstractProcessEnginePlugin {

  private Map<String, String> retryProfiles;

  public Map<String, String> getRetryProfiles() {
    return retryProfiles;
  }

  public void setRetryProfiles(Map<String, String> retryProfiles) {
    this.retryProfiles = retryProfiles;
  }

  @Override
  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    List<BpmnParseListener> parseListeners = processEngineConfiguration.getCustomPreBPMNParseListeners();
    if (parseListeners == null) {
      parseListeners = new ArrayList<BpmnParseListener>();
      processEngineConfiguration.setCustomPreBPMNParseListeners(parseListeners);
    }
    FailedJobRetryProfileParseListener failedJobRetryProfileParseListener = new FailedJobRetryProfileParseListener(retryProfiles);
    parseListeners.add(failedJobRetryProfileParseListener);
  }
}
```

### Create a Failed Job Retry Profile Parse Listener Implementation

Extend the `org.camunda.bpm.engine.impl.bpmn.parser.DefaultFailedJobParseListener` class:

``` java
public class FailedJobRetryProfileParseListener extends DefaultFailedJobParseListener {

  private Map<String, String> retryProfiles;

  public FailedJobRetryProfileParseListener(Map<String, String> retryProfiles) {
    super();
    this.retryProfiles = retryProfiles;
  }

  @Override
  public void parseServiceTask(Element serviceTaskElement, ScopeImpl scope, ActivityImpl activity) {
    // each service task is asynchronous
    activity.setAsyncBefore(true);
    parseActivity(serviceTaskElement, activity);
  }

  private Element getProfileElement(Element element) {
    Element extensionElement = element.element("extensionElements");
    if (extensionElement != null) {
      Element propertiesElement = extensionElement.element("properties");
      if (propertiesElement != null) {
        // get list of <camunda:property ...> elements
        List<Element> propertyList = propertiesElement.elements("property");
        for (Element property : propertyList) {
          String name = property.attribute("name");
          if ("retryProfile".equals(name)) {
            return property;
          }
        }
      }
    }
    return null;
  }

  @Override
  protected void setFailedJobRetryTimeCycleValue(Element element, ActivityImpl activity) {
    Element profileElement = getProfileElement(element);
    if (profileElement != null) {
      String retryProfileExpression = null;
      if (retryProfiles != null) {
        String retryProfileName = profileElement.attribute("value");
        retryProfileExpression = retryProfiles.get(retryProfileName);
      } else {
        throw new ProcessEngineException("Something went wrong with the configuration.");
      }

      FailedJobRetryConfiguration configuration = ParseUtil.parseRetryIntervals(retryProfileExpression);
      activity.getProperties().set(FAILED_JOB_CONFIGURATION, configuration);
    } else {
      super.setFailedJobRetryTimeCycleValue(element, activity);
    }
  }
}
```

This listener helps us during the parsing of the bpmn to set the retry value if we have specified attribute for the current task. 

### Activate the Plugin

The BPMN Parse Listener can be activated in the `camunda.cfg.xml`:

``` xml
<property name="processEnginePlugins">
  <list>
    <bean class="org.camunda.bpm.example.FailedJobRetryProfilePlugin">
      <property name="retryProfiles">
        <map>
          <entry key="CRM" value="R5/PT10M" />
          <entry key="ERP" value="R7/PT5M" />
        </map>
      </property>
    </bean>
  </list>
</property>
```

It is important to define the profiles for your external systems. You can use a map as shown and define the names of the profile as keys and the retries as values of the map.

### Configure Extension Properties on Service Task

Configure the `retryProfile` property into the extensionElements.

``` xml
<bpmn:serviceTask id="ServiceTask_1" name="Fetch data from the CRM system " camunda:class="org.camunda.bpm.example.delegate.ServiceTaskOneDelegate">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="retryProfile" value="CRM" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

Using the camunda Modeler, you can configure the service task using the properties panel:

![Configure Service Task using the camunda Modeler][2]


## How does it work?

If you are impatient, just have a look at the [unit test][3].

In this example, the unit test triggers the process engine to deploy and parse the BPMN Process Model.
The Process Engine BPMN Parser parses the process definition. The Failed Job Retry Profile Parse Listener additionally parses the service task
to the BPMN Parser and adds failed job retry configuration according to the defined profile.

After that, the process engine starts the process instance and invokes the `execute()`-method provided by the `Java Delegate`
implementation. When the service task fails, the process engine retries the job according the failed job retry configuration.

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test.

[1]: docs/retry-example.JPG
[2]: docs/extension-property.JPG
[3]: src/test/java/org/camunda/bpm/example/test/FailedJobRetryProfileTest.java
