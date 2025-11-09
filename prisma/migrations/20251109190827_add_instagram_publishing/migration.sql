-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "instagramAccessToken" TEXT,
ADD COLUMN     "instagramBusinessId" TEXT,
ADD COLUMN     "instagramLastPublishedAt" TIMESTAMP(3),
ADD COLUMN     "instagramTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "instagramPostId" TEXT,
ADD COLUMN     "instagramPublishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3);
