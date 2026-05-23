CREATE TABLE `integration_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academyId` int,
	`googleCalendarEnabled` boolean DEFAULT false,
	`googleCalendarToken` text,
	`lineNotificationsEnabled` boolean DEFAULT false,
	`lineChannelAccessToken` text,
	`lineGroupId` varchar(255),
	`paymentGatewayEnabled` boolean DEFAULT false,
	`paymentProvider` enum('stripe','omise','paypal') DEFAULT 'stripe',
	`paymentApiKey` text,
	`paymentSecretKey` text,
	`webhookUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`amount` float NOT NULL,
	`currency` varchar(10) DEFAULT 'THB',
	`transactionType` enum('coaching_compensation','bonus','refund') NOT NULL DEFAULT 'coaching_compensation',
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`transactionId` varchar(255),
	`month` varchar(7),
	`approvedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`statisticDate` date NOT NULL,
	`performanceScore` float,
	`readinessScore` float,
	`injuryRiskScore` float,
	`burnoutRiskScore` float,
	`plateauRiskScore` float,
	`trainingHours` float,
	`matchesPlayed` int,
	`winPercentage` float,
	`averageServeSpeed` float,
	`breakPointConversion` float,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_statistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`uploadedBy` int NOT NULL,
	`playerId` int,
	`coachId` int,
	`matchId` int,
	`duration` int,
	`uploadDate` date NOT NULL,
	`category` enum('training','match','technique','analysis','other') NOT NULL DEFAULT 'training',
	`tags` text,
	`isPublic` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`createdBy` int NOT NULL,
	`timestamp` int NOT NULL,
	`annotationType` enum('line','circle','rectangle','text','arrow') NOT NULL DEFAULT 'text',
	`content` text,
	`color` varchar(20) DEFAULT '#FF0000',
	`x` float,
	`y` float,
	`width` float,
	`height` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_annotations_id` PRIMARY KEY(`id`)
);
