import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WC_GROUPS: { name: string; teams: { name: string; flag: string }[] }[] =
  [
    {
      name: "A",
      teams: [
        { name: "Mexiko", flag: "🇲🇽" },
        { name: "Südkorea", flag: "🇰🇷" },
        { name: "Südafrika", flag: "🇿🇦" },
        { name: "Tschechien", flag: "🇨🇿" },
      ],
    },
    {
      name: "B",
      teams: [
        { name: "Kanada", flag: "🇨🇦" },
        { name: "Schweiz", flag: "🇨🇭" },
        { name: "Katar", flag: "🇶🇦" },
        { name: "Bosnien-Herzegowina", flag: "🇧🇦" },
      ],
    },
    {
      name: "C",
      teams: [
        { name: "Brasilien", flag: "🇧🇷" },
        { name: "Marokko", flag: "🇲🇦" },
        { name: "Haiti", flag: "🇭🇹" },
        { name: "Schottland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
      ],
    },
    {
      name: "D",
      teams: [
        { name: "USA", flag: "🇺🇸" },
        { name: "Paraguay", flag: "🇵🇾" },
        { name: "Australien", flag: "🇦🇺" },
        { name: "Türkei", flag: "🇹🇷" },
      ],
    },
    {
      name: "E",
      teams: [
        { name: "Deutschland", flag: "🇩🇪" },
        { name: "Elfenbeinküste", flag: "🇨🇮" },
        { name: "Ecuador", flag: "🇪🇨" },
        { name: "Curaçao", flag: "🇨🇼" },
      ],
    },
    {
      name: "F",
      teams: [
        { name: "Niederlande", flag: "🇳🇱" },
        { name: "Japan", flag: "🇯🇵" },
        { name: "Schweden", flag: "🇸🇪" },
        { name: "Tunesien", flag: "🇹🇳" },
      ],
    },
    {
      name: "G",
      teams: [
        { name: "Belgien", flag: "🇧🇪" },
        { name: "Ägypten", flag: "🇪🇬" },
        { name: "Iran", flag: "🇮🇷" },
        { name: "Neuseeland", flag: "🇳🇿" },
      ],
    },
    {
      name: "H",
      teams: [
        { name: "Spanien", flag: "🇪🇸" },
        { name: "Kap Verde", flag: "🇨🇻" },
        { name: "Saudi-Arabien", flag: "🇸🇦" },
        { name: "Uruguay", flag: "🇺🇾" },
      ],
    },
    {
      name: "I",
      teams: [
        { name: "Frankreich", flag: "🇫🇷" },
        { name: "Senegal", flag: "🇸🇳" },
        { name: "Irak", flag: "🇮🇶" },
        { name: "Norwegen", flag: "🇳🇴" },
      ],
    },
    {
      name: "J",
      teams: [
        { name: "Argentinien", flag: "🇦🇷" },
        { name: "Algerien", flag: "🇩🇿" },
        { name: "Österreich", flag: "🇦🇹" },
        { name: "Jordanien", flag: "🇯🇴" },
      ],
    },
    {
      name: "K",
      teams: [
        { name: "Portugal", flag: "🇵🇹" },
        { name: "Kongo DR", flag: "🇨🇩" },
        { name: "Usbekistan", flag: "🇺🇿" },
        { name: "Kolumbien", flag: "🇨🇴" },
      ],
    },
    {
      name: "L",
      teams: [
        { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
        { name: "Kroatien", flag: "🇭🇷" },
        { name: "Ghana", flag: "🇬🇭" },
        { name: "Panama", flag: "🇵🇦" },
      ],
    },
  ];

// Round-robin matchup indices for a group of 4: [home, away]
const ROUND_ROBIN_PAIRS: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

const KNOCKOUT_MATCHES = [
  // Round of 32 (16 matches) – placeholders based on typical FIFA bracket
  { stage: "R32", homePlaceholder: "1. Gruppe A", awayPlaceholder: "2. Gruppe B", matchDay: 1 },
  { stage: "R32", homePlaceholder: "1. Gruppe C", awayPlaceholder: "2. Gruppe D", matchDay: 1 },
  { stage: "R32", homePlaceholder: "1. Gruppe E", awayPlaceholder: "2. Gruppe F", matchDay: 2 },
  { stage: "R32", homePlaceholder: "1. Gruppe G", awayPlaceholder: "2. Gruppe H", matchDay: 2 },
  { stage: "R32", homePlaceholder: "1. Gruppe I", awayPlaceholder: "2. Gruppe J", matchDay: 3 },
  { stage: "R32", homePlaceholder: "1. Gruppe K", awayPlaceholder: "2. Gruppe L", matchDay: 3 },
  { stage: "R32", homePlaceholder: "1. Gruppe B", awayPlaceholder: "3. Bester", matchDay: 4 },
  { stage: "R32", homePlaceholder: "1. Gruppe D", awayPlaceholder: "3. Bester", matchDay: 4 },
  { stage: "R32", homePlaceholder: "1. Gruppe F", awayPlaceholder: "3. Bester", matchDay: 5 },
  { stage: "R32", homePlaceholder: "1. Gruppe H", awayPlaceholder: "3. Bester", matchDay: 5 },
  { stage: "R32", homePlaceholder: "1. Gruppe J", awayPlaceholder: "3. Bester", matchDay: 6 },
  { stage: "R32", homePlaceholder: "1. Gruppe L", awayPlaceholder: "3. Bester", matchDay: 6 },
  { stage: "R32", homePlaceholder: "2. Gruppe A", awayPlaceholder: "3. Bester", matchDay: 7 },
  { stage: "R32", homePlaceholder: "2. Gruppe C", awayPlaceholder: "3. Bester", matchDay: 7 },
  { stage: "R32", homePlaceholder: "2. Gruppe E", awayPlaceholder: "3. Bester", matchDay: 8 },
  { stage: "R32", homePlaceholder: "2. Gruppe G", awayPlaceholder: "3. Bester", matchDay: 8 },
  // Round of 16 (8 matches)
  { stage: "R16", homePlaceholder: "Sieger R32-1", awayPlaceholder: "Sieger R32-2", matchDay: 1 },
  { stage: "R16", homePlaceholder: "Sieger R32-3", awayPlaceholder: "Sieger R32-4", matchDay: 1 },
  { stage: "R16", homePlaceholder: "Sieger R32-5", awayPlaceholder: "Sieger R32-6", matchDay: 2 },
  { stage: "R16", homePlaceholder: "Sieger R32-7", awayPlaceholder: "Sieger R32-8", matchDay: 2 },
  { stage: "R16", homePlaceholder: "Sieger R32-9", awayPlaceholder: "Sieger R32-10", matchDay: 3 },
  { stage: "R16", homePlaceholder: "Sieger R32-11", awayPlaceholder: "Sieger R32-12", matchDay: 3 },
  { stage: "R16", homePlaceholder: "Sieger R32-13", awayPlaceholder: "Sieger R32-14", matchDay: 4 },
  { stage: "R16", homePlaceholder: "Sieger R32-15", awayPlaceholder: "Sieger R32-16", matchDay: 4 },
  // Quarterfinals (4 matches)
  { stage: "QF", homePlaceholder: "Sieger R16-1", awayPlaceholder: "Sieger R16-2", matchDay: 1 },
  { stage: "QF", homePlaceholder: "Sieger R16-3", awayPlaceholder: "Sieger R16-4", matchDay: 1 },
  { stage: "QF", homePlaceholder: "Sieger R16-5", awayPlaceholder: "Sieger R16-6", matchDay: 2 },
  { stage: "QF", homePlaceholder: "Sieger R16-7", awayPlaceholder: "Sieger R16-8", matchDay: 2 },
  // Semifinals (2 matches)
  { stage: "SF", homePlaceholder: "Sieger VF-1", awayPlaceholder: "Sieger VF-2", matchDay: 1 },
  { stage: "SF", homePlaceholder: "Sieger VF-3", awayPlaceholder: "Sieger VF-4", matchDay: 2 },
  // Third place + Final
  { stage: "THIRD", homePlaceholder: "Verlierer HF-1", awayPlaceholder: "Verlierer HF-2", matchDay: 1 },
  { stage: "FINAL", homePlaceholder: "Sieger HF-1", awayPlaceholder: "Sieger HF-2", matchDay: 1 },
];

async function main() {
  // Default scoring config
  await prisma.scoringConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, exactScore: 3, exactDiff: 2, tendency: 1 },
  });

  // App config
  await prisma.appConfig.upsert({
    where: { key: "adminPassword" },
    update: {},
    create: { key: "adminPassword", value: "admin123" },
  });

  await prisma.appConfig.upsert({
    where: { key: "tournamentName" },
    update: {},
    create: { key: "tournamentName", value: "WM 2026" },
  });

  // Create groups and teams
  for (const groupData of WC_GROUPS) {
    const group = await prisma.wcGroup.upsert({
      where: { name: groupData.name },
      update: {},
      create: { name: groupData.name },
    });

    for (const teamData of groupData.teams) {
      const existing = await prisma.wcTeam.findFirst({
        where: { groupId: group.id, name: teamData.name },
      });
      if (!existing) {
        await prisma.wcTeam.create({
          data: { name: teamData.name, flag: teamData.flag, groupId: group.id },
        });
      }
    }

    // Create group stage matches
    const teams = groupData.teams;
    for (const [hi, ai] of ROUND_ROBIN_PAIRS) {
      const existing = await prisma.match.findFirst({
        where: {
          groupId: group.id,
          homeTeam: teams[hi].name,
          awayTeam: teams[ai].name,
        },
      });
      if (!existing) {
        await prisma.match.create({
          data: {
            stage: "GROUP",
            groupId: group.id,
            homeTeam: teams[hi].name,
            awayTeam: teams[ai].name,
          },
        });
      }
    }
  }

  // Create knockout matches
  for (const m of KNOCKOUT_MATCHES) {
    const existing = await prisma.match.findFirst({
      where: {
        stage: m.stage,
        homePlaceholder: m.homePlaceholder,
        awayPlaceholder: m.awayPlaceholder,
      },
    });
    if (!existing) {
      await prisma.match.create({
        data: {
          stage: m.stage,
          homePlaceholder: m.homePlaceholder,
          awayPlaceholder: m.awayPlaceholder,
          matchDay: m.matchDay,
        },
      });
    }
  }

  // Demo players & teams
  const team1 = await prisma.team.upsert({
    where: { name: "Team Alpha" },
    update: {},
    create: { name: "Team Alpha" },
  });
  const team2 = await prisma.team.upsert({
    where: { name: "Team Beta" },
    update: {},
    create: { name: "Team Beta" },
  });

  await prisma.player.upsert({
    where: { name: "Max" },
    update: {},
    create: { name: "Max", teamId: team1.id },
  });
  await prisma.player.upsert({
    where: { name: "Moritz" },
    update: {},
    create: { name: "Moritz", teamId: team1.id },
  });
  await prisma.player.upsert({
    where: { name: "Lisa" },
    update: {},
    create: { name: "Lisa", teamId: team2.id },
  });
  await prisma.player.upsert({
    where: { name: "Anna" },
    update: {},
    create: { name: "Anna", teamId: team2.id },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
