/**
 * SMS Notification Step
 * 
 * Sends SMS notifications to medical providers
 */

import { Context } from '@temporalio/activity';

export interface SMSParams {
  to: string;
  message: string;
  patientId: string;
  providerId: string;
}

export interface SMSResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  timestamp: number;
}

/**
 * Send SMS notification to provider
 * @param params - SMS parameters including recipient and message
 * @returns Result with sent status and message ID
 */
export async function sendSMS(params: SMSParams): Promise<SMSResult> {
  const { to, message, patientId, providerId } = params;

  console.log(`Sending SMS to ${to} for patient ${patientId}`);
  console.log(`Message: ${message}`);

  try {
    // TODO: Implement actual SMS sending logic using a service like Twilio
    // Example:
    // const client = new Twilio(accountSid, authToken);
    // const result = await client.messages.create({
    //   body: message,
    //   from: '+1234567890', // Your Twilio number
    //   to: to
    // });

    // Placeholder implementation
    const messageId = `SMS-${Date.now()}-${providerId}`;
    
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`SMS sent successfully. Message ID: ${messageId}`);

    return {
      sent: true,
      messageId,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Failed to send SMS: ${error}`);
    
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

/**
 * Send bulk SMS notifications
 * @param recipients - Array of SMS parameters for multiple recipients
 * @returns Array of results
 */
export async function sendBulkSMS(recipients: SMSParams[]): Promise<SMSResult[]> {
  console.log(`Sending bulk SMS to ${recipients.length} recipients`);

  const results = await Promise.all(
    recipients.map(params => sendSMS(params))
  );

  const successCount = results.filter(r => r.sent).length;
  console.log(`Bulk SMS complete: ${successCount}/${recipients.length} sent successfully`);

  return results;
}

/**
 * Verify phone number format
 * @param phoneNumber - Phone number to verify
 * @returns True if valid format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic phone number validation (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}
