CREATE TABLE `two_factor_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`email` varchar(320),
	`action` enum('2fa_enabled','2fa_disabled','2fa_verified','2fa_failed','backup_code_used') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failed') NOT NULL,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `two_factor_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `two_factor_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`totpSecret` varchar(255),
	`backupCodes` text,
	`usedBackupCodes` text,
	`enabledAt` timestamp,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `two_factor_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `two_factor_settings_accountId_unique` UNIQUE(`accountId`)
);
