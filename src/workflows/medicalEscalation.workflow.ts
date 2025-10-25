/**
 * Medical Escalation Workflow
 * 
 * This durable workflow manages the escalation of medical alerts through multiple channels.
 * It handles SMS, voice calls, and push notifications with configurable timeouts and retry logic.
 */

import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';
import {
  EscalationParams,
  EscalationResult,
  NotificationStatus,
  Provider
} from '../types/workflow.types';

// Configure activity options
const { sendSMS, makeVoiceCall, sendPushNotification, logEscalation } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

/**
 * Main medical escalation workflow
 * @param params - Escalation parameters including patient info and provider details
 * @returns EscalationResult with status and details
 */
export async function medicalEscalationWorkflow(
  params: EscalationParams
): Promise<EscalationResult> {
  const {
    patientId,
    condition,
    primaryProvider,
    backupProviders = [],
    timeouts = {
      sms: 300,    // 5 minutes
      voice: 180,  // 3 minutes
      push: 120    // 2 minutes
    }
  } = params;

  console.log(`Starting medical escalation for patient ${patientId}`);
  
  // Try primary provider first
  const primaryResult = await escalateToProvider(
    primaryProvider,
    patientId,
    condition,
    timeouts
  );

  if (primaryResult.acknowledged) {
    await logEscalation({
      patientId,
      providerId: primaryProvider.id,
      status: 'acknowledged',
      timestamp: Date.now(),
      method: primaryResult.method
    });

    return {
      success: true,
      providerId: primaryProvider.id,
      providerName: primaryProvider.name,
      acknowledgedAt: primaryResult.acknowledgedAt,
      method: primaryResult.method,
      attempts: primaryResult.attempts
    };
  }

  // If primary provider didn't respond, try backup providers
  for (const backupProvider of backupProviders) {
    console.log(`Escalating to backup provider: ${backupProvider.name}`);
    
    const backupResult = await escalateToProvider(
      backupProvider,
      patientId,
      condition,
      timeouts
    );

    if (backupResult.acknowledged) {
      await logEscalation({
        patientId,
        providerId: backupProvider.id,
        status: 'acknowledged',
        timestamp: Date.now(),
        method: backupResult.method
      });

      return {
        success: true,
        providerId: backupProvider.id,
        providerName: backupProvider.name,
        acknowledgedAt: backupResult.acknowledgedAt,
        method: backupResult.method,
        attempts: backupResult.attempts
      };
    }
  }

  // All providers failed to respond
  await logEscalation({
    patientId,
    providerId: 'SYSTEM',
    status: 'failed',
    timestamp: Date.now(),
    method: 'none'
  });

  return {
    success: false,
    error: 'All escalation attempts failed',
    attempts: (backupProviders.length + 1) * 3 // All providers, all methods
  };
}

/**
 * Escalate to a specific provider through multiple channels
 */
async function escalateToProvider(
  provider: Provider,
  patientId: string,
  condition: string,
  timeouts: { sms: number; voice: number; push: number }
): Promise<{
  acknowledged: boolean;
  acknowledgedAt?: number;
  method?: string;
  attempts: number;
}> {
  let attempts = 0;

  // Step 1: Try SMS
  console.log(`Sending SMS to ${provider.name}`);
  attempts++;
  
  const smsResult = await sendSMS({
    to: provider.phone,
    message: `URGENT: Patient ${patientId} - ${condition}. Please acknowledge.`,
    patientId,
    providerId: provider.id
  });

  if (smsResult.sent) {
    // Wait for acknowledgment
    const smsAck = await waitForAcknowledgment(provider.id, timeouts.sms);
    if (smsAck) {
      return {
        acknowledged: true,
        acknowledgedAt: Date.now(),
        method: 'SMS',
        attempts
      };
    }
  }

  // Step 2: Try voice call
  console.log(`Making voice call to ${provider.name}`);
  attempts++;
  
  const voiceResult = await makeVoiceCall({
    to: provider.phone,
    message: `Urgent medical alert for patient ${patientId}. Condition: ${condition}. Press 1 to acknowledge.`,
    patientId,
    providerId: provider.id
  });

  if (voiceResult.connected) {
    const voiceAck = await waitForAcknowledgment(provider.id, timeouts.voice);
    if (voiceAck) {
      return {
        acknowledged: true,
        acknowledgedAt: Date.now(),
        method: 'Voice',
        attempts
      };
    }
  }

  // Step 3: Try push notification
  if (provider.pushToken) {
    console.log(`Sending push notification to ${provider.name}`);
    attempts++;
    
    const pushResult = await sendPushNotification({
      token: provider.pushToken,
      title: 'Urgent Medical Alert',
      body: `Patient ${patientId} - ${condition}`,
      data: {
        patientId,
        providerId: provider.id,
        condition
      }
    });

    if (pushResult.sent) {
      const pushAck = await waitForAcknowledgment(provider.id, timeouts.push);
      if (pushAck) {
        return {
          acknowledged: true,
          acknowledgedAt: Date.now(),
          method: 'Push',
          attempts
        };
      }
    }
  }

  return {
    acknowledged: false,
    attempts
  };
}

/**
 * Wait for acknowledgment from provider
 * In a real implementation, this would listen for signals from external systems
 */
async function waitForAcknowledgment(
  providerId: string,
  timeoutSeconds: number
): Promise<boolean> {
  // Convert seconds to milliseconds
  const timeoutMs = timeoutSeconds * 1000;
  
  // In a real implementation, use Temporal signals to receive acknowledgments
  // For now, we'll simulate with a sleep
  // TODO: Replace with actual signal handling
  await sleep(timeoutMs);
  
  // Placeholder: In production, check if acknowledgment signal was received
  return false;
}

/**
 * Signal handler for receiving acknowledgments
 * This would be called when a provider acknowledges through any channel
 */
export async function acknowledgeEscalation(providerId: string): Promise<void> {
  // TODO: Implement signal handling to wake up waitForAcknowledgment
  console.log(`Received acknowledgment from provider ${providerId}`);
}
