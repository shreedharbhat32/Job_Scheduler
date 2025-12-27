# High-Throughput Job Scheduler

## Problem Statement
Design and implement a simple yet scalable Job Scheduler capable of executing a large number of scheduled jobs with high accuracy and reliability.

## System Overview
The system supports:
1.  **Job Management**: Create, modify, and view jobs.
2.  **Execution Tracking**: View instance runs of jobs.
3.  **Alerting**: Alert users on job failure (Planned).

The scheduler is designed to support thousands of job executions per second, where each job represents an HTTP POST request to an external API.

## Functional Requirements
-   **High Throughput**: Capable of handling thousands of executions per second.
-   **Job Types**: HTTP POST requests.
-   **Scheduling**: Custom CRON spec including Seconds (`31 10-15 1 * * MON-FRI`).
-   **Semantics**: At-least-once execution.
-   **Persistence**: Track all job executions and history.
-   **Accuracy**: Minimize drift from scheduled time.

## Tech Stack
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose) due to its flexibility with JSON Job Specs and historical log storage.

## Architecture

The project follows a modular architecture with separation of concerns:

-   **Backend/src/api**: Controllers and Routes for exposing APIs.
-   **Backend/src/executor**: Logic for executing the HTTP jobs (Worker processes).
-   **Backend/src/scheduler**: Core logic for parsing CRON specs and triggering jobs.
-   **Backend/src/db**: Database connection and Interface layers.

### System Design Diagram
sequenceDiagram
    participant U as User
    participant A as API Server
    participant D as Database
    participant S as Scheduler
    participant Q as Job Queue
    participant E as Executor
    participant X as External Service

    U->>A: Create Job
    A->>D: Store Job Details
    D-->>A: Job Saved
    A-->>U: Job ID Returned

    S->>D: Check Scheduled Jobs
    D-->>S: Due Jobs List
    S->>Q: Push Job to Queue

    E->>Q: Fetch Job
    Q-->>E: Job Data
    E->>X: Send HTTP Request
    X-->>E: Response Data

    E->>D: Store Execution Result

    U->>A: Request Job Status
    A->>D: Fetch Job Logs
    D-->>A: Status and Logs
    A-->>U: Job Status Response


## Folder Structure
```
Job_Scheduler/
├── Backend/
│   ├── src/
│   │   ├── api/        # API Routes and Controllers
│   │   ├── db/         # Database Connection and Models
│   │   ├── executor/   # Job Execution Logic
│   │   ├── scheduler/  # Scheduling Logic
│   │   └── app.js      # Express Application Setup
│   ├── .env            # Environment Variables
│   ├── index.js        # Entry Point
│   └── package.json    # Dependencies
└── README.md
```

## Getting Started

### Prerequisites
-   Node.js (v14+ recommended)
-   MongoDB (Running locally or URI)

### Installation
1.  Navigate to the Backend directory:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    Update `.env` with your MongoDB URI and DB Name.
    ```env
    MONGOOSE_URI=mongodb://localhost:27017
    DB_NAME=job_scheduler
    ```

### Running the Server
```bash
npm start
# Server runs on Port 5000 by default
```

## API Documentation (Planned)

### 1. Create Job
-   **Endpoint**: `POST /jobs`
-   **Body**:
    ```json
    {
        "schedule": "31 10-15 1 * * MON-FRI",
        "api": "https://api.example.com/webhook",
        "type": "ATLEAST_ONCE"
    }
    ```
-   **Response**: `{ "jobId": "unique_id_123" }`

### 2. Get Job Executions
-   **Endpoint**: `GET /jobs/:jobId/executions`
-   **Description**: Fetch last 5 executions.
-   **Response**:
    ```json
    [
        {
            "timestamp": "2023-10-27T10:00:31Z",
            "status": 200,
            "duration": "120ms"
        }
    ]
    ```

## Observability
-   Basic logging is implemented with console logs.
-   Future enhancements include metric collection (Prometheus) and distributed tracing.

## Deliverables
1.  Source Code
2.  Architecture Diagram (Above)
3.  This README
4.  Sample Dataset (To be added)