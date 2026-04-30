-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_sub_key" ON "users"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "links_short_code_key" ON "links"("short_code");

-- CreateIndex
CREATE INDEX "links_user_id_idx" ON "links"("user_id");

-- CreateIndex
CREATE INDEX "links_expires_at_idx" ON "links"("expires_at");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
