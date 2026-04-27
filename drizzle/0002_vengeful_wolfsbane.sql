CREATE TABLE `academy_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_settings_settingKey_unique` UNIQUE(`settingKey`)
);
