import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1707791500000 implements MigrationInterface {
  name = 'InitialMigration1707791500000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create user table
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "phone" varchar NOT NULL,
        "loginTime" datetime NOT NULL,
        "createTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updateTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);

    // Create account table
    await queryRunner.query(`
      CREATE TABLE "account" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" varchar NOT NULL,
        "type" varchar NOT NULL,
        "loginCookie" varchar NOT NULL,
        "token" varchar,
        "loginTime" datetime,
        "uid" varchar NOT NULL,
        "account" varchar NOT NULL,
        "avatar" varchar NOT NULL,
        "nickname" varchar NOT NULL,
        "fansCount" integer NOT NULL DEFAULT 0,
        "readCount" integer NOT NULL DEFAULT 0,
        "likeCount" integer NOT NULL DEFAULT 0,
        "collectCount" integer NOT NULL DEFAULT 0,
        "forwardCount" integer NOT NULL DEFAULT 0,
        "commentCount" integer NOT NULL DEFAULT 0,
        "lastStatsTime" datetime,
        "workCount" integer NOT NULL DEFAULT 0,
        "income" bigint NOT NULL DEFAULT 0,
        "createTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updateTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_account_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
      )
    `);

    // Create pubRecord table
    await queryRunner.query(`
      CREATE TABLE "pubRecord" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" varchar NOT NULL,
        "type" varchar NOT NULL,
        "title" varchar,
        "desc" varchar NOT NULL,
        "videoPath" varchar NOT NULL,
        "coverPath" varchar NOT NULL,
        "publishTime" datetime NOT NULL,
        "status" tinyint NOT NULL DEFAULT 0,
        "createTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updateTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_pubRecord_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
      )
    `);

    // Create video table
    await queryRunner.query(`
      CREATE TABLE "video" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" varchar NOT NULL,
        "pubRecordId" integer NOT NULL,
        "accountId" integer NOT NULL,
        "title" varchar,
        "desc" varchar,
        "videoPath" varchar,
        "coverPath" varchar,
        "lastStatsTime" datetime,
        "dataId" varchar,
        "type" varchar NOT NULL,
        "publishTime" datetime,
        "otherInfo" json,
        "failMsg" varchar,
        "status" tinyint NOT NULL DEFAULT 0,
        "readCount" integer NOT NULL DEFAULT 0,
        "likeCount" integer NOT NULL DEFAULT 0,
        "collectCount" integer NOT NULL DEFAULT 0,
        "forwardCount" integer NOT NULL DEFAULT 0,
        "commentCount" integer NOT NULL DEFAULT 0,
        "income" bigint NOT NULL DEFAULT 0,
        "createTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updateTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_video_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_video_pubRecord" FOREIGN KEY ("pubRecordId") REFERENCES "pubRecord" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_video_account" FOREIGN KEY ("accountId") REFERENCES "account" ("id") ON DELETE CASCADE
      )
    `);

    // Create account_stats table
    await queryRunner.query(`
      CREATE TABLE "account_stats" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" varchar NOT NULL,
        "accountId" integer NOT NULL,
        "type" varchar NOT NULL,
        "readCount" integer NOT NULL DEFAULT 0,
        "likeCount" integer NOT NULL DEFAULT 0,
        "collectCount" integer NOT NULL DEFAULT 0,
        "forwardCount" integer NOT NULL DEFAULT 0,
        "commentCount" integer NOT NULL DEFAULT 0,
        "fansCount" integer NOT NULL DEFAULT 0,
        "income" bigint NOT NULL DEFAULT 0,
        "createTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updateTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_account_stats_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_account_stats_account" FOREIGN KEY ("accountId") REFERENCES "account" ("id") ON DELETE CASCADE
      )
    `);

    // Create video_stats table
    await queryRunner.query(`
      CREATE TABLE "video_stats" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" varchar NOT NULL,
        "videoId" integer NOT NULL,
        "accountId" integer NOT NULL,
        "type" varchar NOT NULL,
        "readCount" integer NOT NULL DEFAULT 0,
        "likeCount" integer NOT NULL DEFAULT 0,
        "collectCount" integer NOT NULL DEFAULT 0,
        "forwardCount" integer NOT NULL DEFAULT 0,
        "commentCount" integer NOT NULL DEFAULT 0,
        "income" bigint NOT NULL DEFAULT 0,
        "createTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updateTime" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_video_stats_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_video_stats_video" FOREIGN KEY ("videoId") REFERENCES "video" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_video_stats_account" FOREIGN KEY ("accountId") REFERENCES "account" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to handle foreign key constraints
    await queryRunner.query(`DROP TABLE "video_stats"`);
    await queryRunner.query(`DROP TABLE "account_stats"`);
    await queryRunner.query(`DROP TABLE "video"`);
    await queryRunner.query(`DROP TABLE "pubRecord"`);
    await queryRunner.query(`DROP TABLE "account"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
