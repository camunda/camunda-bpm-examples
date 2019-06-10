package org.camunda.bpm.spring.boot.example.webapp.controller;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProcessController {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    @GetMapping("/process/start/{processKey}")
    public ResponseEntity startProcess(@PathVariable("processKey") String processKey) {
        String processInstanceId = runtimeService.startProcessInstanceByKey(processKey).getProcessInstanceId();
        logger.info("started instance with id: {}", processInstanceId);

        Task task = taskService.createTaskQuery().processInstanceId(processInstanceId).singleResult();
        taskService.complete(task.getId());
        logger.info("completed task: {}", task);

        return ResponseEntity.ok(HttpStatus.OK);
    }

}
