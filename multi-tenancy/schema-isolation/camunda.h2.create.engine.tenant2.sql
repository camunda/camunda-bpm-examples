create schema TENANT_1;

create table TENANT_2.ACT_GE_PROPERTY (
    NAME_ varchar(64),
    VALUE_ varchar(300),
    REV_ integer,
    primary key (NAME_)
);

insert into TENANT_2.ACT_GE_PROPERTY
values ('schema.version', 'fox', 1);

insert into TENANT_2.ACT_GE_PROPERTY
values ('schema.history', 'create(fox)', 1);

insert into TENANT_2.ACT_GE_PROPERTY
values ('next.dbid', '1', 1);

insert into TENANT_2.ACT_GE_PROPERTY
values ('deployment.lock', '0', 1);

create table TENANT_2.ACT_GE_BYTEARRAY (
    ID_ varchar(64),
    REV_ integer,
    NAME_ varchar(255),
    DEPLOYMENT_ID_ varchar(64),
    BYTES_ longvarbinary,
    GENERATED_ bit,
    primary key (ID_)
);

create table TENANT_2.ACT_RE_DEPLOYMENT (
    ID_ varchar(64),
    NAME_ varchar(255),
    DEPLOY_TIME_ timestamp,
    primary key (ID_)
);

create table TENANT_2.ACT_RU_EXECUTION (
    ID_ varchar(64),
    REV_ integer,
    PROC_INST_ID_ varchar(64),
    BUSINESS_KEY_ varchar(255),
    PARENT_ID_ varchar(64),
    PROC_DEF_ID_ varchar(64),
    SUPER_EXEC_ varchar(64),
    SUPER_CASE_EXEC_ varchar(64),
    CASE_INST_ID_ varchar(64),
    ACT_INST_ID_ varchar(64),
    ACT_ID_ varchar(255),
    IS_ACTIVE_ bit,
    IS_CONCURRENT_ bit,
    IS_SCOPE_ bit,
    IS_EVENT_SCOPE_ bit,
    SUSPENSION_STATE_ integer,
    CACHED_ENT_STATE_ integer,
    primary key (ID_)
);

create table TENANT_2.ACT_RU_JOB (
    ID_ varchar(64) NOT NULL,
    REV_ integer,
    TYPE_ varchar(255) NOT NULL,
    LOCK_EXP_TIME_ timestamp,
    LOCK_OWNER_ varchar(255),
    EXCLUSIVE_ boolean,
    EXECUTION_ID_ varchar(64),
    PROCESS_INSTANCE_ID_ varchar(64),
    PROCESS_DEF_ID_ varchar(64),
    PROCESS_DEF_KEY_ varchar(64),
    RETRIES_ integer,
    EXCEPTION_STACK_ID_ varchar(64),
    EXCEPTION_MSG_ varchar(4000),
    DUEDATE_ timestamp,
    REPEAT_ varchar(255),
    HANDLER_TYPE_ varchar(255),
    HANDLER_CFG_ varchar(4000),
    DEPLOYMENT_ID_ varchar(64),
    SUSPENSION_STATE_ integer,
    JOB_DEF_ID_ varchar(64),
    primary key (ID_)
);

create table TENANT_2.ACT_RU_JOBDEF (
    ID_ varchar(64) NOT NULL,
    REV_ integer,
    PROC_DEF_ID_ varchar(64) NOT NULL,
    PROC_DEF_KEY_ varchar(255) NOT NULL,
    ACT_ID_ varchar(255) NOT NULL,
    JOB_TYPE_ varchar(255) NOT NULL,
    JOB_CONFIGURATION_ varchar(255),
    SUSPENSION_STATE_ integer,
    primary key (ID_)
);

create table TENANT_2.ACT_RE_PROCDEF (
    ID_ varchar(64) NOT NULL,
    REV_ integer,
    CATEGORY_ varchar(255),
    NAME_ varchar(255),
    KEY_ varchar(255) NOT NULL,
    VERSION_ integer NOT NULL,
    DEPLOYMENT_ID_ varchar(64),
    RESOURCE_NAME_ varchar(4000),
    DGRM_RESOURCE_NAME_ varchar(4000),
    HAS_START_FORM_KEY_ bit,
    SUSPENSION_STATE_ integer,
    primary key (ID_)
);

create table TENANT_2.ACT_RU_TASK (
    ID_ varchar(64),
    REV_ integer,
    EXECUTION_ID_ varchar(64),
    PROC_INST_ID_ varchar(64),
    PROC_DEF_ID_ varchar(64),
    CASE_EXECUTION_ID_ varchar(64),
    CASE_INST_ID_ varchar(64),
    CASE_DEF_ID_ varchar(64),
    NAME_ varchar(255),
    PARENT_TASK_ID_ varchar(64),
    DESCRIPTION_ varchar(4000),
    TASK_DEF_KEY_ varchar(255),
    OWNER_ varchar(255),
    ASSIGNEE_ varchar(255),
    DELEGATION_ varchar(64),
    PRIORITY_ integer,
    CREATE_TIME_ timestamp,
    DUE_DATE_ timestamp,
    FOLLOW_UP_DATE_ timestamp,
    SUSPENSION_STATE_ integer,
    primary key (ID_)
);

create table TENANT_2.ACT_RU_IDENTITYLINK (
    ID_ varchar(64),
    REV_ integer,
    GROUP_ID_ varchar(255),
    TYPE_ varchar(255),
    USER_ID_ varchar(255),
    TASK_ID_ varchar(64),
    PROC_DEF_ID_ varchar(64),
    primary key (ID_)
);

create table TENANT_2.ACT_RU_VARIABLE (
    ID_ varchar(64) not null,
    REV_ integer,
    TYPE_ varchar(255) not null,
    NAME_ varchar(255) not null,
    EXECUTION_ID_ varchar(64),
    PROC_INST_ID_ varchar(64),
    CASE_EXECUTION_ID_ varchar(64),
    CASE_INST_ID_ varchar(64),
    TASK_ID_ varchar(64),
    BYTEARRAY_ID_ varchar(64),
    DOUBLE_ double,
    LONG_ bigint,
    TEXT_ varchar(4000),
    TEXT2_ varchar(4000),
    VAR_SCOPE_ varchar(64) not null,
    primary key (ID_)
);

create table TENANT_2.ACT_RU_EVENT_SUBSCR (
    ID_ varchar(64) not null,
    REV_ integer,
    EVENT_TYPE_ varchar(255) not null,
    EVENT_NAME_ varchar(255),
    EXECUTION_ID_ varchar(64),
    PROC_INST_ID_ varchar(64),
    ACTIVITY_ID_ varchar(64),
    CONFIGURATION_ varchar(255),
    CREATED_ timestamp not null,
    primary key (ID_)
);

create table TENANT_2.ACT_RU_INCIDENT (
  ID_ varchar(64) not null,
  REV_ integer not null,
  INCIDENT_TIMESTAMP_ timestamp not null,
  INCIDENT_MSG_ varchar(4000),
  INCIDENT_TYPE_ varchar(255) not null,
  EXECUTION_ID_ varchar(64),
  ACTIVITY_ID_ varchar(255),
  PROC_INST_ID_ varchar(64),
  PROC_DEF_ID_ varchar(64),
  CAUSE_INCIDENT_ID_ varchar(64),
  ROOT_CAUSE_INCIDENT_ID_ varchar(64),
  CONFIGURATION_ varchar(255),
  primary key (ID_)
);

create table TENANT_2.ACT_RU_AUTHORIZATION (
  ID_ varchar(64) not null,
  REV_ integer not null,
  TYPE_ integer not null,
  GROUP_ID_ varchar(255),
  USER_ID_ varchar(255),
  RESOURCE_TYPE_ varchar(255) not null,
  RESOURCE_ID_ varchar(64),
  PERMS_ integer,
  primary key (ID_)
);

create table TENANT_2.ACT_RU_FILTER (
  ID_ varchar(64) not null,
  REV_ integer not null,
  RESOURCE_TYPE_ varchar(255) not null,
  NAME_ varchar(255) not null,
  OWNER_ varchar(255),
  QUERY_ CLOB not null,
  PROPERTIES_ CLOB,
  primary key (ID_)
);


create index TENANT_2.ACT_IDX_EXEC_BUSKEY on TENANT_2.ACT_RU_EXECUTION(BUSINESS_KEY_);
create index TENANT_2.ACT_IDX_TASK_CREATE on TENANT_2.ACT_RU_TASK(CREATE_TIME_);
create index TENANT_2.ACT_IDX_TASK_ASSIGNEE on TENANT_2.ACT_RU_TASK(ASSIGNEE_);
create index TENANT_2.ACT_IDX_IDENT_LNK_USER on TENANT_2.ACT_RU_IDENTITYLINK(USER_ID_);
create index TENANT_2.ACT_IDX_IDENT_LNK_GROUP on TENANT_2.ACT_RU_IDENTITYLINK(GROUP_ID_);
create index TENANT_2.ACT_IDX_EVENT_SUBSCR_CONFIG_ on TENANT_2.ACT_RU_EVENT_SUBSCR(CONFIGURATION_);
create index TENANT_2.ACT_IDX_VARIABLE_TASK_ID on TENANT_2.ACT_RU_VARIABLE(TASK_ID_);
create index TENANT_2.ACT_IDX_ATHRZ_PROCEDEF on TENANT_2.ACT_RU_IDENTITYLINK(PROC_DEF_ID_);
create index TENANT_2.ACT_IDX_INC_CONFIGURATION on TENANT_2.ACT_RU_INCIDENT(CONFIGURATION_);
create index TENANT_2.ACT_IDX_JOB_PROCINST on TENANT_2.ACT_RU_JOB(PROCESS_INSTANCE_ID_);

-- indexes for deadlock problems - https://app.camunda.com/jira/browse/CAM-2567 --
create index TENANT_2.ACT_IDX_INC_CAUSEINCID on TENANT_2.ACT_RU_INCIDENT(CAUSE_INCIDENT_ID_);
create index TENANT_2.ACT_IDX_INC_EXID on TENANT_2.ACT_RU_INCIDENT(EXECUTION_ID_);
create index TENANT_2.ACT_IDX_INC_PROCDEFID on TENANT_2.ACT_RU_INCIDENT(PROC_DEF_ID_);
create index TENANT_2.ACT_IDX_INC_PROCINSTID on TENANT_2.ACT_RU_INCIDENT(PROC_INST_ID_);
create index TENANT_2.ACT_IDX_INC_ROOTCAUSEINCID on TENANT_2.ACT_RU_INCIDENT(ROOT_CAUSE_INCIDENT_ID_);

alter table TENANT_2.ACT_GE_BYTEARRAY
    add constraint TENANT_2.ACT_FK_BYTEARR_DEPL
    foreign key (DEPLOYMENT_ID_)
    references TENANT_2.ACT_RE_DEPLOYMENT;

alter table TENANT_2.ACT_RE_PROCDEF
    add constraint TENANT_2.ACT_UNIQ_PROCDEF
    unique (KEY_,VERSION_);
    
alter table TENANT_2.ACT_RU_EXECUTION
    add constraint TENANT_2.ACT_FK_EXE_PROCINST
    foreign key (PROC_INST_ID_)
    references TENANT_2.ACT_RU_EXECUTION;

alter table TENANT_2.ACT_RU_EXECUTION
    add constraint TENANT_2.ACT_FK_EXE_PARENT
    foreign key (PARENT_ID_)
    references TENANT_2.ACT_RU_EXECUTION;
    
alter table TENANT_2.ACT_RU_EXECUTION
    add constraint TENANT_2.ACT_FK_EXE_SUPER 
    foreign key (SUPER_EXEC_) 
    references TENANT_2.ACT_RU_EXECUTION;
    
alter table TENANT_2.ACT_RU_EXECUTION
    add constraint TENANT_2.ACT_FK_EXE_PROCDEF 
    foreign key (PROC_DEF_ID_) 
    references TENANT_2.ACT_RE_PROCDEF (ID_);
    
alter table TENANT_2.ACT_RU_IDENTITYLINK
    add constraint TENANT_2.ACT_FK_TSKASS_TASK
    foreign key (TASK_ID_)
    references TENANT_2.ACT_RU_TASK;

alter table TENANT_2.ACT_RU_IDENTITYLINK
    add constraint TENANT_2.ACT_FK_ATHRZ_PROCEDEF
    foreign key (PROC_DEF_ID_)
    references TENANT_2.ACT_RE_PROCDEF;

alter table TENANT_2.ACT_RU_TASK
    add constraint TENANT_2.ACT_FK_TASK_EXE
    foreign key (EXECUTION_ID_)
    references TENANT_2.ACT_RU_EXECUTION;

alter table TENANT_2.ACT_RU_TASK
    add constraint TENANT_2.ACT_FK_TASK_PROCINST
    foreign key (PROC_INST_ID_)
    references TENANT_2.ACT_RU_EXECUTION;

alter table TENANT_2.ACT_RU_TASK
  add constraint TENANT_2.ACT_FK_TASK_PROCDEF
  foreign key (PROC_DEF_ID_)
  references TENANT_2.ACT_RE_PROCDEF;

alter table TENANT_2.ACT_RU_VARIABLE
    add constraint TENANT_2.ACT_FK_VAR_EXE
    foreign key (EXECUTION_ID_)
    references TENANT_2.ACT_RU_EXECUTION;

alter table TENANT_2.ACT_RU_VARIABLE
    add constraint TENANT_2.ACT_FK_VAR_PROCINST
    foreign key (PROC_INST_ID_)
    references TENANT_2.ACT_RU_EXECUTION;

alter table TENANT_2.ACT_RU_VARIABLE
    add constraint TENANT_2.ACT_FK_VAR_BYTEARRAY
    foreign key (BYTEARRAY_ID_)
    references TENANT_2.ACT_GE_BYTEARRAY;

alter table TENANT_2.ACT_RU_JOB
    add constraint TENANT_2.ACT_FK_JOB_EXCEPTION
    foreign key (EXCEPTION_STACK_ID_)
    references TENANT_2.ACT_GE_BYTEARRAY;

alter table TENANT_2.ACT_RU_EVENT_SUBSCR
    add constraint TENANT_2.ACT_FK_EVENT_EXEC
    foreign key (EXECUTION_ID_)
    references TENANT_2.ACT_RU_EXECUTION;

alter table TENANT_2.ACT_RU_INCIDENT
    add constraint TENANT_2.ACT_FK_INC_EXE 
    foreign key (EXECUTION_ID_) 
    references TENANT_2.ACT_RU_EXECUTION (ID_);

alter table TENANT_2.ACT_RU_INCIDENT
    add constraint TENANT_2.ACT_FK_INC_PROCINST 
    foreign key (PROC_INST_ID_) 
    references TENANT_2.ACT_RU_EXECUTION (ID_);

alter table TENANT_2.ACT_RU_INCIDENT
    add constraint TENANT_2.ACT_FK_INC_PROCDEF 
    foreign key (PROC_DEF_ID_) 
    references TENANT_2.ACT_RE_PROCDEF (ID_);  

alter table TENANT_2.ACT_RU_INCIDENT
    add constraint TENANT_2.ACT_FK_INC_CAUSE 
    foreign key (CAUSE_INCIDENT_ID_) 
    references TENANT_2.ACT_RU_INCIDENT (ID_);

alter table TENANT_2.ACT_RU_INCIDENT
    add constraint TENANT_2.ACT_FK_INC_RCAUSE 
    foreign key (ROOT_CAUSE_INCIDENT_ID_) 
    references TENANT_2.ACT_RU_INCIDENT (ID_);

alter table TENANT_2.ACT_RU_AUTHORIZATION
    add constraint TENANT_2.ACT_UNIQ_AUTH_USER
    unique (TYPE_, USER_ID_,RESOURCE_TYPE_,RESOURCE_ID_);

alter table TENANT_2.ACT_RU_AUTHORIZATION
    add constraint TENANT_2.ACT_UNIQ_AUTH_GROUP
    unique (TYPE_, GROUP_ID_,RESOURCE_TYPE_,RESOURCE_ID_);

alter table TENANT_2.ACT_RU_VARIABLE
    add constraint TENANT_2.ACT_UNIQ_VARIABLE
    unique (VAR_SCOPE_, NAME_);
    
    
--- CMMN

-- create case definition table --

create table TENANT_2.ACT_RE_CASE_DEF (
    ID_ varchar(64) NOT NULL,
    REV_ integer,
    CATEGORY_ varchar(255),
    NAME_ varchar(255),
    KEY_ varchar(255) NOT NULL,
    VERSION_ integer NOT NULL,
    DEPLOYMENT_ID_ varchar(64),
    RESOURCE_NAME_ varchar(4000),
    DGRM_RESOURCE_NAME_ varchar(4000),
    primary key (ID_)
);

-- create case execution table --

create table TENANT_2.ACT_RU_CASE_EXECUTION (
    ID_ varchar(64) NOT NULL,
    REV_ integer,
    CASE_INST_ID_ varchar(64),
    SUPER_CASE_EXEC_ varchar(64),
    BUSINESS_KEY_ varchar(255),
    PARENT_ID_ varchar(64),
    CASE_DEF_ID_ varchar(64),
    ACT_ID_ varchar(255),
    PREV_STATE_ integer,
    CURRENT_STATE_ integer,
    primary key (ID_)
);

-- create case sentry part table --

create table TENANT_2.ACT_RU_CASE_SENTRY_PART (
    ID_ varchar(64) NOT NULL,
    REV_ integer,
    CASE_INST_ID_ varchar(64),
    CASE_EXEC_ID_ varchar(64),
    SENTRY_ID_ varchar(255),
    TYPE_ varchar(255),
    SOURCE_CASE_EXEC_ID_ varchar(64),
    STANDARD_EVENT_ varchar(255),
    SATISFIED_ bit,
    primary key (ID_)
);

-- create unique constraint on ACT_RE_CASE_DEF --
alter table TENANT_2.ACT_RE_CASE_DEF
    add constraint TENANT_2.ACT_UNIQ_CASE_DEF
    unique (KEY_,VERSION_);

-- create index on business key --
create index TENANT_2.ACT_IDX_CASE_EXEC_BUSKEY on TENANT_2.ACT_RU_CASE_EXECUTION(BUSINESS_KEY_);

-- create foreign key constraints on ACT_RU_CASE_EXECUTION --
alter table TENANT_2.ACT_RU_CASE_EXECUTION
    add constraint TENANT_2.ACT_FK_CASE_EXE_CASE_INST
    foreign key (CASE_INST_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

alter table TENANT_2.ACT_RU_CASE_EXECUTION
    add constraint TENANT_2.ACT_FK_CASE_EXE_PARENT
    foreign key (PARENT_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

alter table TENANT_2.ACT_RU_CASE_EXECUTION
    add constraint TENANT_2.ACT_FK_CASE_EXE_CASE_DEF
    foreign key (CASE_DEF_ID_)
    references TENANT_2.ACT_RE_CASE_DEF;

-- create foreign key constraints on ACT_RU_VARIABLE --
alter table TENANT_2.ACT_RU_VARIABLE
    add constraint TENANT_2.ACT_FK_VAR_CASE_EXE
    foreign key (CASE_EXECUTION_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

alter table TENANT_2.ACT_RU_VARIABLE
    add constraint TENANT_2.ACT_FK_VAR_CASE_INST
    foreign key (CASE_INST_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

-- create foreign key constraints on ACT_RU_TASK --
alter table TENANT_2.ACT_RU_TASK
    add constraint TENANT_2.ACT_FK_TASK_CASE_EXE
    foreign key (CASE_EXECUTION_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

alter table TENANT_2.ACT_RU_TASK
  add constraint TENANT_2.ACT_FK_TASK_CASE_DEF
  foreign key (CASE_DEF_ID_)
  references TENANT_2.ACT_RE_CASE_DEF;

-- create foreign key constraints on ACT_RU_CASE_SENTRY_PART --
alter table TENANT_2.ACT_RU_CASE_SENTRY_PART
    add constraint TENANT_2.ACT_FK_CASE_SENTRY_CASE_INST
    foreign key (CASE_INST_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

alter table TENANT_2.ACT_RU_CASE_SENTRY_PART
    add constraint TENANT_2.ACT_FK_CASE_SENTRY_CASE_EXEC
    foreign key (CASE_EXEC_ID_)
    references TENANT_2.ACT_RU_CASE_EXECUTION;

-- User Management
    
create table TENANT_2.ACT_ID_GROUP (
    ID_ varchar(64),
    REV_ integer,
    NAME_ varchar(255),
    TYPE_ varchar(255),
    primary key (ID_)
);

create table TENANT_2.ACT_ID_MEMBERSHIP (
    USER_ID_ varchar(64),
    GROUP_ID_ varchar(64),
    primary key (USER_ID_, GROUP_ID_)
);

create table TENANT_2.ACT_ID_USER (
    ID_ varchar(64),
    REV_ integer,
    FIRST_ varchar(255),
    LAST_ varchar(255),
    EMAIL_ varchar(255),
    PWD_ varchar(255),
    PICTURE_ID_ varchar(64),
    primary key (ID_)
);

create table TENANT_2.ACT_ID_INFO (
    ID_ varchar(64),
    REV_ integer,
    USER_ID_ varchar(64),
    TYPE_ varchar(64),
    KEY_ varchar(255),
    VALUE_ varchar(255),
    PASSWORD_ longvarbinary,
    PARENT_ID_ varchar(255),
    primary key (ID_)
);

alter table TENANT_2.ACT_ID_MEMBERSHIP
    add constraint TENANT_2.ACT_FK_MEMB_GROUP
    foreign key (GROUP_ID_)
    references TENANT_2.ACT_ID_GROUP;

alter table TENANT_2.ACT_ID_MEMBERSHIP
    add constraint TENANT_2.ACT_FK_MEMB_USER
    foreign key (USER_ID_)
    references TENANT_2.ACT_ID_USER;
