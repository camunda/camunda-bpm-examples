# Task Assignment Email

This quickstart contains a process with only one usertask. When the usertask is assigned, an email will be sent to the assignee:

Subject: Task assigned: Do something

Body: Please complete: [LINK TO USERTASK FORM]

## Why should I care?

Sometimes process participants don't want to watch their task list all day. In those cases, a push notification via email may be convenient.

## Show me the important parts!

You don't want to see my important parts, but here's what's interesting for developers:

When the user task is assigned, an event listener is triggered: org.camunda.bpm.quickstart.TaskAssignmentListener

This listener will retrieve the email address of the user that has been assigned and then send the email notification.

## How to use it?

1. Set Properties according to your mail server in TaskAssignmentListener
2. Set an email address for User 'demo' using camunda BPM User Management
3. Build the project with maven
4. Deploy the project to your server (tested in the camunda BPM distribution for JBoss)
5. Start the Process "Task Assignment Email" from camunda Tasklist
6. Watch your inbox!

Alternatively to steps 2 to 5, you can also run the Test Case TaskAssignmentEmailTest (please set your email address in the the test class before you execute it).
