# Camunda External Task Client (Java) Example

In this tutorial you will learn how to use the External Task client for Java.

In a nutshell you will be guided through the following steps:
* Starting the Camunda Platform Runtime
* Modeling and Deploying a process with the Camunda Modeler
* Bootstrapping the External Task client
* Monitor the process in Camunda Cockpit

## Prerequisites
* [Java JDK 8+](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
* [Apache Maven](https://maven.apache.org/download.cgi)
* [Camunda Modeler](https://camunda.com/download/modeler/)
* [Camunda Platform Runtime](https://camunda.com/download/)
* Camunda External Task Client

First, make sure you have downloaded and installed all the necessary prerequisites, 
and the running platform is [compatible](https://docs.camunda.org/manual/user-guide/ext-client/compatibility-matrix/) with the client version.

## Start the Camunda Platform Runtime
* Microsoft Windows users need to run the `start-camunda.bat` file
* Users of Unix based operating systems need to run the `start-camunda.sh` file

## Deploy a Process

Next, we want to deploy a model to the Camunda Platform Runtime with the following steps:

* Download the BPMN 2.0 XML of that model [here](./dataformat-demo.bpmn).
* Open the model in the Camunda Modeler.
* Click on the "Deploy" icon ![Camunda Modeler – Deploy Button](./img/deploy-icon.png).
* Select "Deploy Current Diagram". 
* Select a deployment name of your choice.

To complete the deployment, click on the "Deploy" button.
Your model is now ready to be executed by the **Camunda Platform Process Engine**.
Start an instance of it in [Camunda Tasklist](http://localhost:8080/camunda/app/tasklist) and 
choose the data format to use in the new user task on the left hand side.

## Monitor the Process in Camunda Cockpit
Open [Camunda Cockpit](http://localhost:8080/camunda/app/cockpit) click in the top navigation on "Processes" and then
on the process "Dataformat demo". You should see the process with the activity instances.

## Set Up a Project
In this step we will set up the External Task client.

You can create a new Maven project using your IDE, or run the following command:

```sh
mvn archetype:generate \
    -DgroupId=org.camunda.bpm \
    -DartifactId=dataformat \
    -DarchetypeArtifactId=maven-archetype-quickstart \
    -DinteractiveMode=false
```

Add the `camunda-external-task-client` dependency to the project's `pom.xml`:
```xml
<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-external-task-client</artifactId>
  <version>${version}</version>
</dependency>
```

Create a main class and add the following lines:
```java
  public static void main(String... args) throws JAXBException {
    ExternalTaskClient client = ExternalTaskClient.create()
        .baseUrl("http://localhost:8080/engine-rest/")
        .asyncResponseTimeout(10000)
        .disableBackoffStrategy()
        .disableAutoFetching()
        .maxTasks(1)
        .build();
    
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    
    Marshaller customerMarshaller = JAXBContext.newInstance(Customer.class).createMarshaller();
    customerMarshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
    
    TopicSubscriptionBuilder xmlSubscriptionBuilder = client.subscribe("xmlCustomerCreation")
      .lockDuration(20000)
      .handler((externalTask, externalTaskService) -> {
        Customer customer = createCustomerFromVariables(externalTask);
        try {
          StringWriter stringWriter = new StringWriter();
          customerMarshaller.marshal(customer, stringWriter);
          String customerXml = stringWriter.toString();
          VariableMap variables = Variables.createVariables().putValue("customer", ClientValues.xmlValue(customerXml));
          externalTaskService.complete(externalTask, variables);
        } catch (JAXBException e) {
          e.printStackTrace();
        }
      });
    
    TopicSubscriptionBuilder jsonSubscriptionBuilder = client.subscribe("jsonCustomerCreation")
      .lockDuration(20000)
      .handler((externalTask, externlTaskService) -> {
        Customer customer = createCustomerFromVariables(externalTask);
        try {
          String customerJson = objectMapper.writeValueAsString(customer);
          VariableMap variables = Variables.createVariables().putValue("customer", ClientValues.jsonValue(customerJson));
          externlTaskService.complete(externalTask, variables);
        } catch (JsonProcessingException e) {
          e.printStackTrace();
        }
        
      });
    
    TopicSubscriptionBuilder readSubscrptionBuilder = client.subscribe("customerReading")
      .lockDuration(20000)
      .handler((externalTask, externalTaskService) -> {
        String dataformat = externalTask.getVariable("dataFormat");
        if ("json".equals(dataformat)) {
          JsonValue jsonCustomer = externalTask.getVariableTyped("customer");
          System.out.println("Customer json: " + jsonCustomer.getValue());
        } else if ("xml".equals(dataformat)) {
          XmlValue xmlCustomer = externalTask.getVariableTyped("customer");
          System.out.println("Customer xml: " + xmlCustomer.getValue());
        }
        externalTaskService.complete(externalTask);
      });
    
    client.start();
    xmlSubscriptionBuilder.open();
    jsonSubscriptionBuilder.open();
    readSubscrptionBuilder.open();
  }

  private static Customer createCustomerFromVariables(ExternalTask externalTask) {
    Customer customer = new Customer();
    customer.setFirstName(externalTask.getVariable("firstname"));
    customer.setLastName(externalTask.getVariable("lastname"));
    customer.setGender(externalTask.getVariable("gender"));
    Long age = externalTask.getVariable("age");
    customer.setAge(age.intValue());
    customer.setIsValid(externalTask.getVariable("isValid"));
    customer.setValidationDate(externalTask.getVariable("validationDate"));
    return customer;
  }
```

Create a `Customer` class and add the following lines:
```java
@XmlRootElement
public class Customer {

  private String firstName;
  private String lastName;
  private String gender;
  private Integer age;
  private Boolean isValid;
  private Date validationDate;


  public String getFirstName() {
    return firstName;
  }
  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }
  public String getLastName() {
    return lastName;
  }
  public void setLastName(String lastName) {
    this.lastName = lastName;
  }
  public String getGender() {
    return gender;
  }
  public void setGender(String gender) {
    this.gender = gender;
  }
  public Integer getAge() {
    return age;
  }
  public void setAge(Integer age) {
    this.age = age;
  }
  public Boolean getIsValid() {
    return isValid;
  }
  public void setIsValid(Boolean isValid) {
    this.isValid = isValid;
  }
  public Date getValidationDate() {
    return validationDate;
  }
  public void setValidationDate(Date validationDate) {
    this.validationDate = validationDate;
  }
}
```

Now, just run your application. The client starts to continuously fetch and lock for External Task instances.

If you chose to create XML in the process instance, you should see a similar result in your console window:
```sh
Customer xml: <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<customer>
    <age>33</age>
    <firstName>first</firstName>
    <gender>female</gender>
    <isValid>true</isValid>
    <lastName>last</lastName>
    <validationDate>2021-09-15T00:00:00+02:00</validationDate>
</customer>
```

If you chose to create JSON in the process instance, you should see a similar result in your console window:
```sh
Customer json: {"firstName":"first","lastName":"last","gender":"female","age":33,"isValid":true,"validationDate":"2021-09-14T22:00:00.000+00:00"}
```
