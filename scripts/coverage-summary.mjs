import { readFileSync } from "node:fs";

const reports = [
  {
    name: "Front-end",
    path: "frontend/coverage/coverage-summary.json",
  },
  {
    name: "Back-end",
    path: "backend/coverage/coverage-summary.json",
  },
];

const metrics = [
  ["statements", "Instructions"],
  ["branches", "Branches"],
  ["functions", "Fonctions"],
  ["lines", "Lignes"],
];

const results = reports.map(({ name, path }) => ({
  name,
  data: JSON.parse(readFileSync(path, "utf8")).total,
}));

function percentage(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

function format(value) {
  return `${value.toFixed(2)} %`;
}

console.log("\n=== RÉSUMÉ DE COUVERTURE MDD ===\n");

for (const result of results) {
  console.log(result.name);

  for (const [key, label] of metrics) {
    console.log(
      `  ${label}: ${format(
        percentage(result.data[key].covered, result.data[key].total),
      )}`,
    );
  }

  console.log();
}

console.log("TOTAL FRONT-END + BACK-END");

for (const [key, label] of metrics) {
  const covered = results.reduce(
    (sum, result) => sum + result.data[key].covered,
    0,
  );

  const total = results.reduce(
    (sum, result) => sum + result.data[key].total,
    0,
  );

  const pct = percentage(covered, total);
  const status = pct >= 70 ? "OK" : "SOUS 70 %";

  console.log(`  ${label}: ${format(pct)} [${status}]`);
}

console.log(
  "\nNote : les tests Playwright ne sont pas inclus dans ces pourcentages.",
);
