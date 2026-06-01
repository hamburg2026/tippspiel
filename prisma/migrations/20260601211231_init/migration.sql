-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "teamId" INTEGER,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WcGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WcTeam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "flag" TEXT NOT NULL DEFAULT '',
    "groupId" INTEGER NOT NULL,
    CONSTRAINT "WcTeam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WcGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stage" TEXT NOT NULL,
    "groupId" INTEGER,
    "homeTeam" TEXT,
    "awayTeam" TEXT,
    "homePlaceholder" TEXT,
    "awayPlaceholder" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "matchDate" TEXT,
    "matchDay" INTEGER,
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WcGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "points" INTEGER,
    CONSTRAINT "Tip_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tip_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "exactScore" INTEGER NOT NULL DEFAULT 3,
    "exactDiff" INTEGER NOT NULL DEFAULT 2,
    "tendency" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WcGroup_name_key" ON "WcGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tip_playerId_matchId_key" ON "Tip"("playerId", "matchId");
