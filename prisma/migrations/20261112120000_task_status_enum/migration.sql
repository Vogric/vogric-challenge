-- Convert Task.status from a free-form TEXT column to a database enum.
--
-- The application used to cast the raw string to a union type at the edges,
-- which meant an invalid value could only fail in the UI. The enum makes the
-- write itself fail.
--
-- Existing rows are cast through text, so the migration fails loudly instead of
-- silently rewriting data if a legacy row holds a value outside the enum.

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done');

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Task"
  ALTER COLUMN "status" TYPE "TaskStatus"
  USING ("status"::text::"TaskStatus");

ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'todo';
