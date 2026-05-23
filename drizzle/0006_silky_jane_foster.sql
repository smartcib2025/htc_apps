CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipientRole` enum('player','coach','head_coach','admin') NOT NULL,
	`notificationType` enum('high_risk_player','upcoming_match','coach_compensation','evaluation_due','checkin_reminder','award_received','system_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedPlayerId` int,
	`relatedCoachId` int,
	`relatedMatchId` int,
	`relatedTransactionId` int,
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`isRead` boolean DEFAULT false,
	`actionUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`searchQuery` varchar(255) NOT NULL,
	`searchType` enum('player','report','coach','match','award') NOT NULL,
	`filters` text,
	`resultsCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_history_id` PRIMARY KEY(`id`)
);
