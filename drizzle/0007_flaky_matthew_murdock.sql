CREATE TABLE `access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int,
	`email` varchar(320),
	`username` varchar(100),
	`role` enum('player','coach','head_coach','admin'),
	`loginMethod` varchar(50) NOT NULL,
	`action` enum('login_success','login_failed','logout','login_attempt_failed','account_locked','password_reset_requested','password_reset_completed','email_verified','account_created') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`deviceInfo` text,
	`status` enum('success','failed') NOT NULL,
	`failureReason` varchar(255),
	`sessionId` varchar(255),
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationToken` varchar(255),
	`verificationTokenExpiry` timestamp,
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`lastLoginAt` timestamp,
	`loginAttempts` int NOT NULL DEFAULT 0,
	`isLocked` boolean NOT NULL DEFAULT false,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_logins_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_logins_email_unique` UNIQUE(`email`)
);
