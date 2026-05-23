CREATE TABLE `coaching_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`sessionDate` date NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`hours` float NOT NULL,
	`sessionType` enum('private','group','camp','match_coaching','other') NOT NULL DEFAULT 'group',
	`content` text,
	`playerIds` text,
	`ratePerHour` float,
	`totalAmount` float,
	`status` enum('pending','approved','paid') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_sessions_id` PRIMARY KEY(`id`)
);
