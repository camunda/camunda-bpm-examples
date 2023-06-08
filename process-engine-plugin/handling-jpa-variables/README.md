# JPA serializer 

This example demonstrates how to configure a JPA serializer as a Process Engine plugin.


## Show me the important parts!



### Create a Process Engine Plugin implementation

Extend the `org.camunda.bpm.engine.impl.cfg.AbstractProcessEnginePlugin` class:

``` java
public class JPAVariablesSerializerPlugin extends AbstractProcessEnginePlugin {

  @Override
  public void postInit(ProcessEngineConfigurationImpl processEngineConfiguration) {
    EntityManagerFactory jpaEntityManagerFactory = Persistence.createEntityManagerFactory("activiti-jpa-pu");
    processEngineConfiguration.getSessionFactories().put(EntityManagerSession.class,
        new EntityManagerSessionFactory(jpaEntityManagerFactory, true, true));

    VariableSerializers variableSerializers = processEngineConfiguration.getVariableSerializers();
    int index = variableSerializers.getSerializerIndexByName(ValueType.BYTES.getName());
    if (index > -1) {
      variableSerializers.addSerializer(new JPAVariableSerializer(), index);
    } else {
      variableSerializers.addSerializer(new JPAVariableSerializer());
    }
  }
}
```

The `persistenceUnitName` passed to the `EntityManagerFactory` is defined in a [`persistance.xml`][1] file following the JPA standards.
Add a `sessionFactory` with the key `EntityManagerSession.class` and retrieve the initialized `variableSerializers`.
If there is a serializer for `ValueType.BYTES` values, replace it with the custom `JPAVariableSerializer`. Otherwise, add the JPA serializer to the list.

### Create a serializer implementation

Extend the `org.camunda.bpm.engine.impl.variable.serializer.AbstractTypedValueSerializer` class:

``` java
public class JPAVariableSerializer extends AbstractTypedValueSerializer<ObjectValue> {

  public static final String NAME = "jpa";

  private JPAEntityMappings mappings;

  public JPAVariableSerializer() {
    super(ValueType.OBJECT);
    mappings = new JPAEntityMappings();
  }

  public String getName() {
    return NAME;
  }

  protected boolean canWriteValue(TypedValue value) {
    if (isDeserializedObjectValue(value) || value instanceof UntypedValueImpl) {
      return value.getValue() == null || mappings.isJPAEntity(value.getValue());
    }
    else {
      return false;
    }
  }

  protected boolean isDeserializedObjectValue(TypedValue value) {
    return value instanceof ObjectValue && ((ObjectValue) value).isDeserialized();
  }

  public ObjectValue convertToTypedValue(UntypedValueImpl untypedValue) {
    return Variables.objectValue(untypedValue.getValue(), untypedValue.isTransient()).create();
  }

  public void writeValue(ObjectValue objectValue, ValueFields valueFields) {
    EntityManagerSession entityManagerSession = Context
      .getCommandContext()
      .getSession(EntityManagerSession.class);
    if (entityManagerSession == null) {
      throw new ProcessEngineException("Cannot set JPA variable: " + EntityManagerSession.class + " not configured");
    } else {
      // Before we set the value we must flush all pending changes from the entitymanager
      // If we don't do this, in some cases the primary key will not yet be set in the object
      // which will cause exceptions down the road.
      entityManagerSession.flush();
    }

    Object value = objectValue.getValue();
    if (value != null) {
      String className = mappings.getJPAClassString(value);
      String idString = mappings.getJPAIdString(value);
      valueFields.setTextValue(className);
      valueFields.setTextValue2(idString);
    } else {
      valueFields.setTextValue(null);
      valueFields.setTextValue2(null);
    }
  }

  public ObjectValue readValue(ValueFields valueFields, boolean deserializeObjectValue, boolean asTransientValue) {
    if (valueFields.getTextValue() != null && valueFields.getTextValue2() != null) {
      Object jpaEntity = mappings.getJPAEntity(valueFields.getTextValue(), valueFields.getTextValue2());
      return Variables.objectValue(jpaEntity).setTransient(asTransientValue).create();
    }
    return Variables.objectValue(null).setTransient(asTransientValue).create();
  }
}
```

Besides the `JPAVariableSerializer`, implementations of `EntityMetaData`, `JPAEntityMappings`, `JPAEntityScanner`,
and `EntityManagerSession` classes can be found in the [source folder][2].

### Activate the plugin

The process engine plugin can be activated in the `camunda.cfg.xml`:

``` xml
<property name="processEnginePlugins">
  <list>
    <bean class="org.camunda.bpm.example.jpa.variables.serializer.JPAVariablesSerializerPlugin" />
  </list>
</property>
```

## How does it work?

There is a [unit test][3] demonstrating an example usage of the JPA serializer.

In this example, the process engine registers the JPA serializer via the process engine configuration.
The unit test triggers the process engine to deploy a BPMN Process Model.
Two Customer JPA entities are persisted and passed as variables when starting a process instance.
When the variables are retrieved from the process engine, the JPA serializer ensures to fetch the entities from the JPA.

## How to use it?

1. Checkout the project with Git
2. Inspect the sources and run the unit test in your IDE or with Maven: `mvn clean verify`
3. All test cases should pass.



[1]: src/test/resources/META-INF/persistence.xml
[2]: src/main/java/org/camunda/bpm/example/jpa/variables/serializer
[3]: src/test/java/org/camunda/bpm/example/test/JPAVariableTest.java
