import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class EmailService {
  /**
   * Dispatches an email to the specified address.
   * Leverages Resend API endpoint or logs output locally in development fallback mode.
   */
  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const apiKey = env.RESEND_API_KEY;
    const from = env.SMTP_FROM;

    if (!apiKey) {
      logger.warn('📧 [EMAIL MOCK FALLBACK] Resend API Key absent.');
      logger.info(`📧 Send To: ${to}`);
      logger.info(`📧 Subject: ${subject}`);
      logger.info(`📧 Content: ${html.substring(0, 100)}...`);
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`❌ Resend email dispatch failed: ${errText}`);
        return false;
      }

      logger.info(`✅ Email successfully sent to ${to} via Resend.`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Exception in Resend Email Service: ${error.message}`);
      return false;
    }
  }

  /**
   * Helper to send Welcome Onboarding Emails.
   */
  static async sendWelcomeEmail(to: string, name: string, role: string): Promise<boolean> {
    const subject = `Welcome to LearnQuest India, ${name}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #d97706; margin-bottom: 4px;">LearnQuest India</h2>
        <span style="font-size: 10px; font-weight: bold; color: #0891b2; text-transform: uppercase;">Game Khelo, Duniya Bachao, Aur Padhai Apne Aap Ho Jayegi</span>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Your profile has been successfully onboarded as a <strong>${role}</strong>!</p>
        <p>Prepare to complete arithmetic adventure missions, master science kingdoms, watch reels, and team up with your clan to protect the world from Shadow Zero.</p>
        <p style="margin-top: 30px;">Happy Learning,<br/>Team LearnQuest India</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
}
