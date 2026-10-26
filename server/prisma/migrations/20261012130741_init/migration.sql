-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST', 'EMPLOYEE', 'KIOSK');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'OVERSTAY', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('PENDING', 'NOTIFIED', 'PICKED_UP', 'REFUNDED', 'LOST');

-- CreateEnum
CREATE TYPE "NotifChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'SOCKET');

-- CreateEnum
CREATE TYPE "NotifStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "photoUrl" TEXT,
    "hostId" TEXT NOT NULL,
    "preregToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchListHit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'EXPECTED',
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "badgeCode" TEXT,
    "notes" TEXT,
    "checkedInById" TEXT,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "visitorId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "roomId" TEXT,
    "notes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "amenities" TEXT[],
    "isActive" BOOLEAN NOT NULL,
    "photoUrl" TEXT,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBooking" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bookedByUserId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "released" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "trackingNo" TEXT,
    "description" TEXT,
    "recipientId" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'PENDING',
    "arrivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickedUpAt" TIMESTAMP(3),
    "pickedUpSig" TEXT,
    "notes" TEXT,
    "loggedById" TEXT NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdaSignature" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentVersion" TEXT NOT NULL,
    "ipAddress" TEXT,
    "signature" TEXT NOT NULL,

    CONSTRAINT "NdaSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchList" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idNumber" TEXT,
    "company" TEXT,
    "reason" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WatchList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotifChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "Status" "NotifStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "floor" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_preregToken_key" ON "Visitor"("preregToken");

-- CreateIndex
CREATE INDEX "Visitor_hostId_idx" ON "Visitor"("hostId");

-- CreateIndex
CREATE INDEX "Visitor_email_idx" ON "Visitor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VisitLog_badgeCode_key" ON "VisitLog"("badgeCode");

-- CreateIndex
CREATE INDEX "VisitLog_visitorId_idx" ON "VisitLog"("visitorId");

-- CreateIndex
CREATE INDEX "VisitLog_checkedInAt_idx" ON "VisitLog"("checkedInAt");

-- CreateIndex
CREATE INDEX "VisitLog_status_idx" ON "VisitLog"("status");

-- CreateIndex
CREATE INDEX "Appointment_hostId_startsAt_idx" ON "Appointment"("hostId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_roomId_startsAt_idx" ON "Appointment"("roomId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE INDEX "RoomBooking_roomId_startsAt_idx" ON "RoomBooking"("roomId", "startsAt");

-- CreateIndex
CREATE INDEX "Package_recipientId_status_idx" ON "Package"("recipientId", "status");

-- CreateIndex
CREATE INDEX "Package_arrivedAt_idx" ON "Package"("arrivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NdaSignature_visitorId_key" ON "NdaSignature"("visitorId");

-- CreateIndex
CREATE INDEX "WatchList_fullName_idx" ON "WatchList"("fullName");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeBase_category_idx" ON "KnowledgeBase"("category");

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaSignature" ADD CONSTRAINT "NdaSignature_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
