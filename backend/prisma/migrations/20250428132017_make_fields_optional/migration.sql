-- AlterTable
ALTER TABLE "StudentApplication" ALTER COLUMN "categoryRank" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AllocatedSeat" ADD CONSTRAINT "AllocatedSeat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentApplication"("applicationNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
