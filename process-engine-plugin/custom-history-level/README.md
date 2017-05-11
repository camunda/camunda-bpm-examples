# Custom History Level

This example demonstrates how to register custom history levels by implementing a process engine plugin.

This examples adds two history levels:

1. The `custom-variable` history level behaves like the normal full history
   except that only variables with a specific name pattern are saved to
   history. This way you can reduce the number of variables tracked and don't
   pollute the history with auxiliary variables.
2. The `per-process` history level allows you to specify the history level
   per process with the camunda properties. This allows you to disable or
   reduce the history for unimportant processes. And even change the history
   level of new instances by redeploying an adjusted process definition.

**Note**: This is example code and not intended to be used as is in a production setting (especially the `per-process` history level).
It rather highlights the mechanics on how a custom history level can be implemented.
If you are interested in these feature, make sure you understand the code and its limitations or ask for help in the [Camunda forum](https://forum.camunda.org/).

## Show me the important parts!

The process model is composed of one task which adds 4 variables to the process:

![Process Model][1]

```java
public void execute(DelegateExecution execution) throws Exception {
  execution.setVariable("foo", "bar");
  execution.setVariable("hello", "world");
  execution.setVariable("action-id-hist", "important");
  execution.setVariable("camunda-hist", "rocks");
}
```


### Create the Process Engine Plugin

The process engine plugin is used to register the custom history levels in the `preInit`
method. Additionally, in the `postInit` method all registered custom history levels are
added to the `PerProcessHistoryLevel` instance. This way also custom history levels
can be specified per process.

```java
public class CustomHistoryLevelProcessEnginePlugin extends AbstractProcessEnginePlugin {

  public void preInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    List<HistoryLevel> customHistoryLevels = processEngineConfiguration.getCustomHistoryLevels();
    if (customHistoryLevels == null) {
      customHistoryLevels = new ArrayList<HistoryLevel>();
      processEngineConfiguration.setCustomHistoryLevels(customHistoryLevels);
    }
    customHistoryLevels.add(CustomVariableHistoryLevel.getInstance());
    customHistoryLevels.add(PerProcessHistoryLevel.getInstance());
  }

  public void postInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    PerProcessHistoryLevel.getInstance()
      .addHistoryLevels(processEngineConfiguration.getCustomHistoryLevels());
  }

}
```


### Create the `custom-variable` History Level

The idea of the `custom-variable` history level is that only some variables are
saved to history. In this example we use a variable name pattern to distinguish
these variables. Every variable which name ends with `-hist` will be saved to
history; all others are ignored. For the other history events (Process Instance, Activity
Instance) full history is written.

```java
public class CustomVariableHistoryLevel implements HistoryLevel {

  public static final CustomVariableHistoryLevel INSTANCE = new CustomVariableHistoryLevel();

  protected static final List<HistoryEventType> VARIABLE_EVENT_TYPES = new ArrayList<HistoryEventType>();

  static {
    VARIABLE_EVENT_TYPES.add(HistoryEventTypes.VARIABLE_INSTANCE_CREATE);
    VARIABLE_EVENT_TYPES.add(HistoryEventTypes.VARIABLE_INSTANCE_UPDATE);
    VARIABLE_EVENT_TYPES.add(HistoryEventTypes.VARIABLE_INSTANCE_DELETE);
  }

  public static CustomVariableHistoryLevel getInstance() {
    return INSTANCE;
  }

  public int getId() {
    return 11;
  }

  public String getName() {
    return "custom-variable";
  }

  public boolean isHistoryEventProduced(HistoryEventType historyEventType, Object entity) {
    return !VARIABLE_EVENT_TYPES.contains(historyEventType)
      || isVariableEventProduced((VariableInstance) entity);
  }

  protected boolean isVariableEventProduced(VariableInstance variableInstance) {
    return variableInstance == null || variableInstance.getName().endsWith("-hist");
  }

}
```

### Create the `per-process` History Level

Another interesting idea is to use camunda properties to specify a history
level for every process definition separately.

![Camunda Properites][2]

The property is extracted on the creation of a new process instance and a
delegate history level is saved for the instance (see the [source][3] for the
full code).

```java
public boolean isHistoryEventProduced(HistoryEventType historyEventType, Object entity) {
  if (entity == null) {
    return true;
  }
  else if (historyEventType == HistoryEventTypes.PROCESS_INSTANCE_START) {
    setDelegateHistoryLevel((ExecutionEntity) entity);
  }

  return isDelegateHistoryLevelEventProduced(historyEventType, entity);
}
```

### Activate the Custom History Level Engine Plugin

The custom history level engine plugin can be activated in the `camunda.cfg.xml`:

``` xml
<!-- activate bpmn parse listener as process engine plugin -->
<property name="processEnginePlugins">
  <list>
    <bean class="org.camunda.bpm.example.CustomHistoryLevelProcessEnginePlugin" />
  </list>
</property>
```

### Configure Custom History Level

To enable the custom history configure it also in the `camunda.cfg.xml`:

```xml
<property name="history" value="custom-variable" />
```

or

```xml
<property name="history" value="per-process" />
```

## How does it work?

If you are impatient, just have a look at the unit tests [CustomVariableHistoryLevelTest][4] and
[PerProcessVariableHistoryLevelTest][5].

In [CustomVariableHistoryLevelTest][4], it is demonstrated that only the
correct variables are saved to history. In
[PerProcessVariableHistoryLevelTest][5], several processes are deployed with
different camunda properties set to configure the history level for this
process definition. There is also a test where a modified process definition is
redeployed to change the history level of new process instances.

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test.

[1]: src/main/resources/process.png
[2]: src/main/resources/properties.png
[3]: src/main/java/org/camunda/bpm/example/PerProcessHistoryLevel.java
[4]: src/test/java/org/camunda/bpm/example/test/CustomVariableHistoryLevelTest.java
[5]: src/test/java/org/camunda/bpm/example/test/PerProcessVariableHistoryLevelTest.java
