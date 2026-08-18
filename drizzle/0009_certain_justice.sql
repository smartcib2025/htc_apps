CREATE TABLE `academies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`domain` varchar(255),
	`logoUrl` text,
	`primaryColor` varchar(20) DEFAULT '#001A4D',
	`accentColor` varchar(20) DEFAULT '#FFC107',
	`subscriptionPlan` enum('free','pro','enterprise') NOT NULL DEFAULT 'pro',
	`subscriptionStatus` enum('active','past_due','canceled','trialing') NOT NULL DEFAULT 'active',
	`maxPlayers` int NOT NULL DEFAULT 50,
	`maxCoaches` int NOT NULL DEFAULT 10,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`trialEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academies_id` PRIMARY KEY(`id`),
	CONSTRAINT `academies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `academy_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('tenant_admin','coach','player') NOT NULL DEFAULT 'player',
	`title` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exportType` enum('ical','pdf','csv') NOT NULL,
	`eventIds` text,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`downloadUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendar_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`participantId` int NOT NULL,
	`participantType` enum('player','coach','admin') NOT NULL,
	`status` enum('confirmed','pending','declined','no_response') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`reminderType` enum('email','push','sms') NOT NULL,
	`minutesBefore` int NOT NULL DEFAULT 15,
	`sent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_reminders_id` PRIMARY KEY(`id`)
);
