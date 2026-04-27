CREATE TABLE `ai_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`reportType` enum('weekly','monthly','tournament') DEFAULT 'weekly',
	`summary` text,
	`strengths` text,
	`weaknesses` text,
	`actionPlan` text,
	`goals` text,
	`performanceIndex` float,
	`readinessIndex` float,
	`peakIndex` float,
	`riskLevel` enum('low','medium','high') DEFAULT 'low',
	`riskType` varchar(100),
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`coachId` int NOT NULL,
	`technique` int,
	`fitness` int,
	`tactics` int,
	`mental` int,
	`discipline` int,
	`matchIQ` int,
	`strengthNote` text,
	`weaknessNote` text,
	`coachComment` text,
	`evalType` enum('weekly','monthly','tournament') DEFAULT 'weekly',
	`evalDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`playerId` int,
	`title` varchar(255),
	`content` text,
	`noteDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`coachRole` enum('coach','head_coach','admin') NOT NULL DEFAULT 'coach',
	`specialty` varchar(255),
	`phone` varchar(20),
	`avatarUrl` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`checkinDate` date NOT NULL,
	`trainingHours` float,
	`fatigue` int,
	`confidence` int,
	`stress` int,
	`injuryStatus` boolean DEFAULT false,
	`injuryDescription` text,
	`strengthFeeling` text,
	`weaknessFeeling` text,
	`nextGoal` text,
	`mode` enum('weekly','monthly','tournament') DEFAULT 'weekly',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`matchDate` date NOT NULL,
	`opponent` varchar(255),
	`tournament` varchar(255),
	`servePercent` float,
	`winners` int,
	`unforcedErrors` int,
	`result` enum('win','loss'),
	`score` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`level` varchar(100),
	`program` varchar(100),
	`coachId` int,
	`avatarUrl` text,
	`dateOfBirth` date,
	`phone` varchar(20),
	`emergencyContact` varchar(255),
	`status` enum('active','inactive','injured') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
