-- CreateTable
CREATE TABLE "rsls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xmlContent" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rsls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rsls_userId_idx" ON "rsls"("userId");

-- AddForeignKey
ALTER TABLE "rsls" ADD CONSTRAINT "rsls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
