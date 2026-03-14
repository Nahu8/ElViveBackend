-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `heroTitle` VARCHAR(191) NULL,
    `heroButton1Text` VARCHAR(191) NULL,
    `heroButton1Link` VARCHAR(191) NULL,
    `heroButton2Text` VARCHAR(191) NULL,
    `heroButton2Link` VARCHAR(191) NULL,
    `heroVideoUrl` TEXT NULL,
    `heroVideoData` LONGBLOB NULL,
    `heroVideoMime` VARCHAR(191) NULL,
    `heroVideoName` VARCHAR(191) NULL,
    `heroVideo2Data` LONGBLOB NULL,
    `heroVideo2Mime` VARCHAR(191) NULL,
    `heroVideo2Name` VARCHAR(191) NULL,
    `heroIconDomData` LONGBLOB NULL,
    `heroIconDomMime` VARCHAR(191) NULL,
    `heroIconDomName` VARCHAR(191) NULL,
    `heroIconMierData` LONGBLOB NULL,
    `heroIconMierMime` VARCHAR(191) NULL,
    `heroIconMierName` VARCHAR(191) NULL,
    `video1Url` VARCHAR(191) NULL,
    `video2Url` VARCHAR(191) NULL,
    `currentTheme` INTEGER NULL,
    `celebrations` JSON NULL,
    `meetingDaysSummary` JSON NULL,
    `ministriesSummary` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `themes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `videoUrl1` VARCHAR(191) NULL,
    `videoUrl2` VARCHAR(191) NULL,
    `iconUrl1` VARCHAR(191) NULL,
    `iconUrl2` VARCHAR(191) NULL,
    `palette1` JSON NULL,
    `palette2` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `socialMedia` JSON NULL,
    `schedules` JSON NULL,
    `departments` JSON NULL,
    `mapEmbed` TEXT NULL,
    `additionalInfo` TEXT NULL,
    `pageContent` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `layouts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `navLinks` JSON NULL,
    `footerBrandTitle` VARCHAR(191) NULL,
    `footerBrandDescription` TEXT NULL,
    `footerFacebookUrl` VARCHAR(191) NULL,
    `footerInstagramUrl` VARCHAR(191) NULL,
    `footerYoutubeUrl` VARCHAR(191) NULL,
    `footerAddress` VARCHAR(191) NULL,
    `footerEmail` VARCHAR(191) NULL,
    `footerPhone` VARCHAR(191) NULL,
    `footerCopyright` VARCHAR(191) NULL,
    `footerPrivacyUrl` VARCHAR(191) NULL,
    `footerTermsUrl` VARCHAR(191) NULL,
    `quickLinks` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_days` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `calendarEvents` JSON NULL,
    `recurringMeetings` JSON NULL,
    `hero` JSON NULL,
    `heroImageData` LONGBLOB NULL,
    `heroImageMime` VARCHAR(191) NULL,
    `heroImageName` VARCHAR(191) NULL,
    `upcomingEvents` JSON NULL,
    `eventCta` JSON NULL,
    `eventSettings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministries_content` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hero` JSON NULL,
    `ministries` JSON NULL,
    `statistics` JSON NULL,
    `process` JSON NULL,
    `testimonials` JSON NULL,
    `faqs` JSON NULL,
    `pageContent` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministry_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `ministry` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_card_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cardIndex` INTEGER NOT NULL,
    `imageData` LONGBLOB NULL,
    `imageMime` VARCHAR(191) NULL,
    `imageName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `meeting_card_images_cardIndex_key`(`cardIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministry_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministryId` VARCHAR(191) NOT NULL,
    `mediaType` VARCHAR(191) NOT NULL,
    `imageData` LONGBLOB NULL,
    `imageMime` VARCHAR(191) NULL,
    `imageName` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ministry_media_ministryId_idx`(`ministryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministry_videos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministryId` VARCHAR(191) NOT NULL,
    `videoData` LONGBLOB NULL,
    `videoMime` VARCHAR(191) NULL,
    `videoName` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ministry_videos_ministryId_idx`(`ministryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ministry_card_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ministryId` VARCHAR(191) NOT NULL,
    `imageData` LONGBLOB NULL,
    `imageMime` VARCHAR(191) NULL,
    `imageName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ministry_card_images_ministryId_key`(`ministryId`),
    INDEX `ministry_card_images_ministryId_idx`(`ministryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` VARCHAR(191) NOT NULL,
    `mediaType` VARCHAR(191) NOT NULL,
    `imageData` LONGBLOB NULL,
    `imageMime` VARCHAR(191) NULL,
    `imageName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_media_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `section_icons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pageKey` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `imageData` LONGBLOB NULL,
    `imageMime` VARCHAR(191) NULL,
    `imageName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `section_icons_pageKey_sectionKey_key`(`pageKey`, `sectionKey`),
    INDEX `section_icons_pageKey_idx`(`pageKey`),
    INDEX `section_icons_sectionKey_idx`(`sectionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
