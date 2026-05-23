CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`username` varchar(100),
	`action` varchar(100) NOT NULL,
	`entity` varchar(100),
	`entityId` int,
	`details` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `awards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('training','match','discipline','improvement','special') NOT NULL DEFAULT 'training',
	`icon` varchar(50) DEFAULT 'star',
	`badgeColor` varchar(20) DEFAULT '#FFD700',
	`criteria` text,
	`autoAward` boolean DEFAULT false,
	`autoCondition` varchar(100),
	`autoThreshold` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `awards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventType` enum('training','match','tournament','meeting','rest','other') NOT NULL DEFAULT 'training',
	`eventDate` date NOT NULL,
	`startTime` varchar(10),
	`endTime` varchar(10),
	`location` varchar(255),
	`playerId` int,
	`coachId` int,
	`isAllPlayers` boolean DEFAULT false,
	`color` varchar(20),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_awards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`awardId` int NOT NULL,
	`awardedBy` int,
	`awardedDate` date NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_awards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('player','coach','head_coach','admin') NOT NULL DEFAULT 'player',
	`playerId` int,
	`coachId` int,
	`displayName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_accounts_username_unique` UNIQUE(`username`)
);
