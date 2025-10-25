# Marbarze - Medical Escalation Automation System

## Overview

Marbarze is a durable workflow system designed to automate medical escalation processes. The system manages patient escalations through multiple communication channels (SMS, voice calls, push notifications) with configurable retry logic and timeout handling.

## Workflow Description

The medical escalation workflow follows these steps:

### 1. Initial SMS Notification
- Send SMS to the assigned medical provider
- Wait for acknowledgment within a configurable timeout period
- Track delivery and read receipts

### 2. Voice Call Escalation
- If SMS is not acknowledged within the timeout period, initiate a voice call
- Wait for call pickup and acknowledgment
- Log call duration and outcome

### 3. Push Notification
- If voice call is not answered, send a push notification
- Track notification delivery and interaction
- Wait for acknowledgment

### 4. Escalation to Backup Provider
- If primary provider does not respond after all attempts
- Repeat the notification sequence with backup provider(s)
- Continue until acknowledgment is received or escalation chain is exhausted

### 5. Final Alert
- If all escalation attempts fail, trigger a critical alert
- Notify administrative staff and emergency contacts
- Log the escalation failure for review

## Features

- **Durable Execution**: Workflow state persists across failures and restarts
- **Configurable Timeouts**: Customize wait times for each escalation step
- **Multi-Channel Communication**: SMS, voice, and push notifications
- **Retry Logic**: Automatic retries with exponential backoff
- **Audit Trail**: Complete logging of all escalation attempts and outcomes
- **Provider Chain Management**: Define primary and backup provider sequences

## Architecture

The system uses a durable workflow pattern with the following components:

- **Workflow Engine**: Orchestrates the escalation process
- **Step Handlers**: Individual implementations for each communication channel
- **State Management**: Persistent storage of workflow state
- **Event Bus**: Handles asynchronous notifications and callbacks
- **Monitoring**: Real-time tracking and alerting

## Project Structure

```
marbarze/
├── src/
│   ├── workflows/
│   │   └── medicalEscalation.workflow.ts    # Main workflow definition
│   ├── steps/
│   │   ├── sendSMS.step.ts                   # SMS notification step
│   │   ├── makeVoiceCall.step.ts             # Voice call step
│   │   ├── sendPushNotification.step.ts      # Push notification step
│   │   └── escalateToBackup.step.ts          # Backup escalation step
│   ├── types/
│   │   ├── workflow.types.ts                 # Workflow type definitions
│   │   └── provider.types.ts                 # Provider data types
│   └── utils/
│       ├── logger.ts                         # Logging utility
│       └── config.ts                         # Configuration management
├── tests/
│   └── workflows/
│       └── medicalEscalation.test.ts         # Workflow tests
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- TypeScript 5+
- A durable workflow runtime (e.g., Temporal, Durable Task Framework, or similar)

### Installation

```bash
npm install
```

### Configuration

Configure the workflow timeouts and provider settings in `src/utils/config.ts`

### Running the Workflow

```bash
npm run start
```

### Running Tests

```bash
npm test
```

## Usage Example

```typescript
import { startMedicalEscalation } from './workflows/medicalEscalation.workflow';

const escalationParams = {
  patientId: 'P12345',
  condition: 'Critical vitals alert',
  primaryProvider: {
    id: 'DR001',
    name: 'Dr. Smith',
    phone: '+1234567890',
    pushToken: 'token123'
  },
  backupProviders: [
    {
      id: 'DR002',
      name: 'Dr. Jones',
      phone: '+0987654321',
      pushToken: 'token456'
    }
  ],
  timeouts: {
    sms: 300,        // 5 minutes
    voice: 180,      // 3 minutes
    push: 120        // 2 minutes
  }
};

const workflowId = await startMedicalEscalation(escalationParams);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
