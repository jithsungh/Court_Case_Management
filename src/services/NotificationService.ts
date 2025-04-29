
import { Hearing, Case } from "@/services/types";
import { toast } from "@/hooks/use-toast";
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

class NotificationService {
  private static instance: NotificationService;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private notifiedHearings: Set<string> = new Set();

  private constructor() {
    // Private constructor to prevent multiple instances
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setupHearingReminders(hearings: Hearing[], cases: Case[]): void {
    // Clear any existing timers
    this.clearAllTimers();

    const now = new Date();

    hearings.forEach((hearing) => {
      // Skip past hearings
      const hearingDateTime = new Date(`${hearing.date}T${hearing.time}`);
      if (hearingDateTime <= now) return;

      // Find the related case
      const relatedCase = cases.find((c) => c.id === hearing.caseId);
      const caseTitle = relatedCase?.title || `Case #${hearing.caseId}`;

      // Set up one day reminder
      const oneDayBefore = new Date(hearingDateTime);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      if (oneDayBefore > now) {
        const oneDayTimeoutMs = oneDayBefore.getTime() - now.getTime();
        const oneDayTimerId = setTimeout(() => {
          this.showHearingReminder(hearing, caseTitle, "tomorrow");
        }, oneDayTimeoutMs);

        this.timers.set(`${hearing.id}_day`, oneDayTimerId);
      }

      // Set up one hour reminder
      const oneHourBefore = new Date(hearingDateTime);
      oneHourBefore.setHours(oneHourBefore.getHours() - 1);

      if (oneHourBefore > now) {
        const oneHourTimeoutMs = oneHourBefore.getTime() - now.getTime();
        const oneHourTimerId = setTimeout(() => {
          this.showHearingReminder(hearing, caseTitle, "in 1 hour");
        }, oneHourTimeoutMs);

        this.timers.set(`${hearing.id}_hour`, oneHourTimerId);
      }
    });
  }

  private showHearingReminder(
    hearing: Hearing,
    caseTitle: string,
    timeFrame: string
  ): void {
    const notificationId = `${hearing.id}_${timeFrame}`;

    // Prevent duplicate notifications
    if (this.notifiedHearings.has(notificationId)) return;
    this.notifiedHearings.add(notificationId);

    toast({
      title: `Upcoming Hearing ${timeFrame}`,
      description: `${caseTitle} at ${hearing.time} in ${hearing.location}`,
      duration: 10000, // Show for 10 seconds
    });
  }

  private clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  // Method to manually trigger a reminder for testing
  public testReminder(
    hearing: Hearing,
    caseTitle: string,
    timeFrame: string
  ): void {
    this.showHearingReminder(hearing, caseTitle, timeFrame);
  }

  async notifyDefendant(defendantPhone: string, caseData: any) {
    try {
      // Create notification for the defendant
      const notification = {
        type: 'CASE_FILED_AGAINST',
        title: 'Legal Action Notice',
        message: `A new case has been filed against you: ${caseData.title}. Immediate action may be required.`,
        caseId: caseData.id,
        status: 'unread',
        severity: 'high',
        createdAt: new Date(),
        recipientPhone: defendantPhone,
      };

      // Save notification to database
      await addDoc(collection(db, 'notifications'), notification);

      // If the user has push notifications enabled, send a push notification
      const userDoc = await this.getUserByPhone(defendantPhone);
      if (userDoc && userDoc.pushToken) {
        await this.sendPushNotification(userDoc.pushToken, {
          title: notification.title,
          body: notification.message,
          data: {
            type: notification.type,
            caseId: notification.caseId
          }
        });
      }
    } catch (error) {
      console.error('Error sending defendant notification:', error);
    }
  }

  private async sendPushNotification(token: string, payload: { title: string; body: string; data?: any }) {
    // Implementation depends on your push notification service (FCM, etc.)
    try {
      // Add your push notification logic here
      console.log('Sending push notification:', { token, payload });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Updated interface for user document returned from getUserByPhone
  private async getUserByPhone(phone: string): Promise<{ id: string; pushToken?: string } | null> {
    try {
      // Query users collection by phone number
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Return the first matching user
        return {
          ...querySnapshot.docs[0].data(),
          id: querySnapshot.docs[0].id
        } as { id: string; pushToken?: string };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }
}

export default NotificationService;
