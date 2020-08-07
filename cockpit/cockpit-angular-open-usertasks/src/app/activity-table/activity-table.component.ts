import { Component, OnInit, Input } from '@angular/core';
import { get } from "../../utils/request"


@Component({
  selector: 'custom-activity-table',
  templateUrl: './activity-table.component.html',
  styleUrls: ['./activity-table.component.css']
})
export class ActivityTableComponent implements OnInit {
  userOperationMap: any;
  hasOperations: Boolean;

  @Input() processDefinitionId: string;

  @Input()
  set activityId(activityId: string) {
    this._activityId = activityId;
    // make a rest call
    this.getUserOperations();
  }
  get activityId(): string { return this._activityId; }
  _activityId: string;


  private getUserOperations() {
    this.hasOperations = false;

    const args = { maxResults: 500, processDefinitionId: this.processDefinitionId };
    if (this.activityId) {
      args['taskDefinitionKey'] = this.activityId;
    }
    get("%API%/engine/%ENGINE%/task", args)
      .then(async res => {
        const json = await res.json();
        const operationMap = {};
        json.forEach(task => {
          this.hasOperations = true;
          const assignee = task.assignee || 'unassigned';

          const operationPerUser = operationMap[assignee] || {};
          operationPerUser[task.taskDefinitionKey] = operationPerUser[task.taskDefinitionKey] || 0;
          operationPerUser[task.taskDefinitionKey]++;
          operationMap[assignee] = operationPerUser;
        });

        this.userOperationMap = operationMap;
      })
  }

  constructor() { }

  ngOnInit() {
    this.getUserOperations();
  }

}
