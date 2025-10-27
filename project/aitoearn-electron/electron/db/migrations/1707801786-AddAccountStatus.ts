import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountStatus1707801786000 implements MigrationInterface {
  name = 'AddAccountStatus1707801786000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD COLUMN "status" tinyint NOT NULL DEFAULT 0`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "status"`);
  }
}
