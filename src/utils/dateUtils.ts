
import { Timestamp } from "firebase/firestore";
import { format, isValid, isSameDay as isSameDayFns, isAfter, isBefore, addDays, isFuture, isPast, isToday, isTomorrow, isThisWeek, isWithinInterval } from "date-fns";

/**
 * Formats a Firestore Timestamp to a readable date string
 */
export const formatTimestamp = (timestamp: Timestamp | undefined | null, formatString: string = "MMM d, yyyy"): string => {
  if (!timestamp) return "N/A";
  
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
      
    return isValid(date) ? format(date, formatString) : "Invalid date";
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid date";
  }
};

/**
 * Formats a Firestore Timestamp to a readable date and time string
 */
export const formatTimestampWithTime = (
  timestamp: Timestamp | undefined | null, 
  formatString: string = "MMM d, yyyy 'at' h:mm a"
): string => {
  return formatTimestamp(timestamp, formatString);
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (timestamp: Timestamp | undefined | null): boolean => {
  if (!timestamp) return false;
  
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
      
    return isValid(date) ? isPast(date) : false;
  } catch (error) {
    return false;
  }
};

/**
 * Convert a Timestamp to a JavaScript Date object
 */
export const timestampToDate = (timestamp: Timestamp | unknown | null): Date | null => {
  if (!timestamp) return null;
  
  try {
    return timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp as any);
  } catch (error) {
    console.error("Error converting timestamp to date:", error);
    return null;
  }
};

/**
 * Create a new Firestore Timestamp from a Date object or current time
 */
export const createTimestamp = (date?: Date): Timestamp => {
  return date ? Timestamp.fromDate(date) : Timestamp.now();
};

/**
 * Format timestamp for display in a user-friendly format
 */
export const formatTimestampForDisplay = (timestamp: Timestamp | unknown | null, formatString: string = "MMM d, yyyy"): string => {
  return formatTimestamp(timestamp as Timestamp, formatString);
};

/**
 * Compare two timestamps to see if they represent the same day
 */
export const areSameDay = (timestamp1: Timestamp | null | undefined, timestamp2: Timestamp | null | undefined): boolean => {
  if (!timestamp1 || !timestamp2) return false;
  
  try {
    const date1 = timestamp1 instanceof Timestamp ? timestamp1.toDate() : new Date(timestamp1 as any);
    const date2 = timestamp2 instanceof Timestamp ? timestamp2.toDate() : new Date(timestamp2 as any);
    
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  } catch (error) {
    return false;
  }
};

/**
 * Check if a hearing is today
 */
export const isHearingToday = (timestamp: Timestamp | null | undefined): boolean => {
  if (!timestamp) return false;
  
  try {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as any);
    return isToday(date);
  } catch (error) {
    return false;
  }
};

/**
 * Check if a hearing is tomorrow
 */
export const isHearingTomorrow = (timestamp: Timestamp | null | undefined): boolean => {
  if (!timestamp) return false;
  
  try {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as any);
    return isTomorrow(date);
  } catch (error) {
    return false;
  }
};

/**
 * Check if a hearing is in this week
 */
export const isHearingThisWeek = (timestamp: Timestamp | null | undefined): boolean => {
  if (!timestamp) return false;
  
  try {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as any);
    return isThisWeek(date) && !isToday(date) && !isTomorrow(date);
  } catch (error) {
    return false;
  }
};

/**
 * Group hearings by time proximity (today, tomorrow, this week, future)
 */
export const groupHearingsByTime = (hearings: any[]) => {
  const today: any[] = [];
  const tomorrow: any[] = [];
  const thisWeek: any[] = [];
  const future: any[] = [];
  const past: any[] = [];

  hearings.forEach(hearing => {
    if (!hearing.date) return;
    
    try {
      const hearingDate = hearing.date instanceof Timestamp 
        ? hearing.date.toDate() 
        : new Date(hearing.date);
        
      if (isPast(hearingDate) && !isToday(hearingDate)) {
        past.push(hearing);
      } else if (isToday(hearingDate)) {
        today.push(hearing);
      } else if (isTomorrow(hearingDate)) {
        tomorrow.push(hearing);
      } else if (isThisWeek(hearingDate)) {
        thisWeek.push(hearing);
      } else {
        future.push(hearing);
      }
    } catch (error) {
      console.error("Error grouping hearing:", error);
    }
  });

  return { today, tomorrow, thisWeek, future, past };
};

/**
 * Sort hearings by date
 */
export const sortHearingsByDate = (hearings: any[], ascending: boolean = true): any[] => {
  return [...hearings].sort((a, b) => {
    const dateA = a.date ? (timestampToDate(a.date)?.getTime() || 0) : 0;
    const dateB = b.date ? (timestampToDate(b.date)?.getTime() || 0) : 0;
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Check if a hearing is upcoming (today or in the future)
 */
export const isUpcomingHearing = (hearing: any): boolean => {
  if (!hearing || !hearing.date) return false;
  
  try {
    const hearingDate = hearing.date instanceof Timestamp 
      ? hearing.date.toDate() 
      : new Date(hearing.date);
    
    // Today's date with time set to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return hearingDate >= today;
  } catch (error) {
    return false;
  }
};

/**
 * Format a date range between two timestamps
 */
export const formatDateRange = (
  startTimestamp: Timestamp | null | undefined,
  endTimestamp: Timestamp | null | undefined,
  formatString: string = "MMM d"
): string => {
  if (!startTimestamp || !endTimestamp) return "N/A";
  
  try {
    const startDate = startTimestamp instanceof Timestamp 
      ? startTimestamp.toDate() 
      : new Date(startTimestamp as any);
    
    const endDate = endTimestamp instanceof Timestamp 
      ? endTimestamp.toDate() 
      : new Date(endTimestamp as any);
    
    if (!isValid(startDate) || !isValid(endDate)) return "Invalid date range";
    
    return `${format(startDate, formatString)} - ${format(endDate, formatString)}`;
  } catch (error) {
    return "Invalid date range";
  }
};
