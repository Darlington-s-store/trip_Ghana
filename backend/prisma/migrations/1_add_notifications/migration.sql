-- Add notification preference types
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_CANCELLED' AFTER 'BOOKING';
ALTER TYPE "NotificationType" ADD VALUE 'TRIP_APPROVED' AFTER 'TRIP';
ALTER TYPE "NotificationType" ADD VALUE 'TRIP_REJECTED' AFTER 'TRIP_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'ATTRACTION_APPROVED' AFTER 'ATTRACTION';
ALTER TYPE "NotificationType" ADD VALUE 'ATTRACTION_REJECTED' AFTER 'ATTRACTION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_FAILED' AFTER 'PAYMENT';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_ALERT' AFTER 'SYSTEM';

-- Update notifications table
ALTER TABLE notifications 
  RENAME COLUMN read TO "isRead";

ALTER TABLE notifications
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "relatedId" TEXT;

-- Create notification preferences table
CREATE TABLE "notification_preferences" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "emailBookingConfirmation" BOOLEAN NOT NULL DEFAULT true,
  "emailPaymentAlert" BOOLEAN NOT NULL DEFAULT true,
  "emailMarketingUpdates" BOOLEAN NOT NULL DEFAULT false,
  "emailTripRecommendations" BOOLEAN NOT NULL DEFAULT true,
  "smsBookingConfirmation" BOOLEAN NOT NULL DEFAULT true,
  "smsPaymentAlert" BOOLEAN NOT NULL DEFAULT true,
  "smsPromotions" BOOLEAN NOT NULL DEFAULT false,
  "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "notification_preferences_userId_key" UNIQUE ("userId")
);

-- Add indexes
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
