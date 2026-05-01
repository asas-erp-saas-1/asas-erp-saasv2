import { Client } from '@upstash/qstash';

const isConfigured = !!process.env.QSTASH_TOKEN;

// Local mock if missing config
class MockQStash {
  async publishJSON(args: { url: string, body: any, headers?: Record<string, string>, delay?: number | string }) {
    console.log(`[Mock QStash] Publishing to ${args.url}`, args.body);
    // In a real environment, we'd trigger a local fetch or just print
    return { messageId: 'mock-id' };
  }
}

export const qstash = isConfigured
  ? new Client({ token: process.env.QSTASH_TOKEN! })
  : (new MockQStash() as unknown as Client);

export class QueueService {
  /**
   * Dispatches a background job.
   */
  static async dispatch(topic: string, payload: any, options?: { delaySeconds?: number }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/queue/${topic}`;
    
    await qstash.publishJSON({
      url: endpoint,
      body: payload,
      delay: options?.delaySeconds,
    });
  }
}
