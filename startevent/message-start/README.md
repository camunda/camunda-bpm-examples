# Overview

This quickstart demonstrates how to start a process by message. It consists of two process definitions. One that defines a message start event as follows:

![Message Start Process][1]

The other process definition contains a service task that sends a message. This message instantiates the message start event process.

![Instantiating Process][2]

# Run it

1. Checkout the project with Git
2. Read and run the [unit test][3]

[1]: src/main/resources/message_start_process.png
[2]: src/main/resources/instantiating_process.png
[3]: src/test/java/org/camunda/bpm/example/event/message/MessageStartEventTest.java
