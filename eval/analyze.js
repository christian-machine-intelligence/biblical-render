const fs = require("fs");
const config = require("./config.js");

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i]));
    return obj;
  });
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function ci95(arr) {
  const se = stddev(arr) / Math.sqrt(arr.length);
  return 1.96 * se;
}

// Welch's t-test (unequal variances)
function welchTTest(a, b) {
  const n1 = a.length;
  const n2 = b.length;
  if (n1 < 2 || n2 < 2) return { t: 0, p: 1 };

  const m1 = mean(a);
  const m2 = mean(b);
  const v1 = a.reduce((s, x) => s + (x - m1) ** 2, 0) / (n1 - 1);
  const v2 = b.reduce((s, x) => s + (x - m2) ** 2, 0) / (n2 - 1);

  const se = Math.sqrt(v1 / n1 + v2 / n2);
  if (se === 0) return { t: 0, p: 1 };

  const t = (m1 - m2) / se;

  // Welch-Satterthwaite degrees of freedom
  const num = (v1 / n1 + v2 / n2) ** 2;
  const den =
    (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1);
  const df = num / den;

  // Approximate p-value using the t-distribution
  // Using a simple approximation for two-tailed test
  const absT = Math.abs(t);
  const p = approxTwoTailedP(absT, df);

  return { t, df, p, diff: m2 - m1 };
}

// Rough p-value approximation using normal distribution for large df
function approxTwoTailedP(t, df) {
  // For df > 30, normal approximation is reasonable
  // Using Abramowitz and Stegun approximation for normal CDF
  if (df > 1000) df = 1000;
  const x = t * (1 - 1 / (4 * df)) / Math.sqrt(1 + t * t / (2 * df));
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const tt = 1 / (1 + p * absX);
  const y =
    1 -
    ((((a5 * tt + a4) * tt + a3) * tt + a2) * tt + a1) *
      tt *
      Math.exp(-absX * absX / 2);
  const cdf = 0.5 * (1 + sign * y);
  return 2 * (1 - cdf);
}

function analyzeAll() {
  if (!fs.existsSync(config.PATHS.scores)) {
    console.error("No scores.csv found. Run grading first.");
    return;
  }

  const rows = parseCSV(fs.readFileSync(config.PATHS.scores, "utf-8"));
  const validRows = rows.filter((r) => r.score !== "NA");

  // Group scores by model × condition
  const grouped = {};
  for (const row of validRows) {
    const key = `${row.model}__${row.condition}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(parseFloat(row.score));
  }

  // Group by model × task × condition (for per-task analysis)
  const perTask = {};
  for (const row of validRows) {
    const key = `${row.model}__${row.task}__${row.condition}`;
    if (!perTask[key]) perTask[key] = [];
    perTask[key].push(parseFloat(row.score));
  }

  const models = Object.keys(config.MODELS);
  const conditions = config.CONDITIONS;

  // --- Summary stats ---
  const summary = {};
  for (const model of models) {
    summary[model] = {};
    for (const cond of conditions) {
      const scores = grouped[`${model}__${cond}`] || [];
      summary[model][cond] = {
        mean: mean(scores),
        std: stddev(scores),
        ci95: ci95(scores),
        n: scores.length,
      };
    }

    // Pairwise comparisons: plain vs each biblical condition
    summary[model].comparisons = {};
    const plainScores = grouped[`${model}__plain`] || [];
    for (const cond of config.BIBLICAL_CONDITIONS) {
      const condScores = grouped[`${model}__${cond}`] || [];
      if (plainScores.length < 2 || condScores.length < 2) {
        summary[model].comparisons[`plain_vs_${cond}`] = {
          diff: null, t: null, df: null, p: null, significant: null,
          note: "Insufficient data",
        };
        continue;
      }
      const test = welchTTest(plainScores, condScores);
      summary[model].comparisons[`plain_vs_${cond}`] = {
        diff: test.diff,
        t: test.t,
        df: test.df,
        p: test.p,
        significant: test.p < 0.05,
      };
    }
  }

  fs.writeFileSync(
    config.PATHS.summary,
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  // --- Per-task breakdown ---
  const tasks = JSON.parse(fs.readFileSync(config.PATHS.tasks, "utf-8"));
  const taskBreakdown = {};
  for (const model of models) {
    taskBreakdown[model] = {};
    for (const task of tasks) {
      taskBreakdown[model][task.id] = {};
      for (const cond of conditions) {
        const scores = perTask[`${model}__${task.id}__${cond}`] || [];
        taskBreakdown[model][task.id][cond] = {
          mean: mean(scores),
          n: scores.length,
        };
      }
    }
  }

  // --- Generate report ---
  let report = "# Biblical Framing Compliance Experiment — Results\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `**Design:** ${tasks.length} tasks x ${conditions.length} conditions x ${config.REPS} reps x ${models.length} models\n\n`;

  for (const model of models) {
    report += `## ${config.MODELS[model].id}\n\n`;
    report += "### Aggregate Compliance by Condition\n\n";
    report += "| Condition | Mean | Std | 95% CI | N |\n";
    report += "|-----------|------|-----|--------|---|\n";

    for (const cond of conditions) {
      const s = summary[model][cond];
      report += `| ${cond} | ${s.mean.toFixed(3)} | ${s.std.toFixed(3)} | ±${s.ci95.toFixed(3)} | ${s.n} |\n`;
    }

    report += "\n### Pairwise Comparisons (vs Plain)\n\n";
    report += "| Comparison | Diff | t | p | Significant? |\n";
    report += "|------------|------|---|---|-------------|\n";

    for (const cond of config.BIBLICAL_CONDITIONS) {
      const c = summary[model].comparisons[`plain_vs_${cond}`];
      if (c.diff === null) {
        report += `| plain → ${cond} | — | — | — | Insufficient data |\n`;
        continue;
      }
      const sig = c.significant ? "**YES**" : "no";
      report += `| plain → ${cond} | ${c.diff >= 0 ? "+" : ""}${c.diff.toFixed(3)} | ${c.t.toFixed(2)} | ${c.p.toFixed(4)} | ${sig} |\n`;
    }

    report += "\n### Per-Task Breakdown\n\n";
    report += "| Task | Plain | KJV | NIV | ARAMAIC |\n";
    report += "|------|-------|-----|-----|--------|\n";

    for (const task of tasks) {
      const tb = taskBreakdown[model][task.id];
      report += `| ${task.id} | ${tb.plain?.mean?.toFixed(3) || "—"} | ${tb.KJV?.mean?.toFixed(3) || "—"} | ${tb.NIV?.mean?.toFixed(3) || "—"} | ${tb.ARAMAIC?.mean?.toFixed(3) || "—"} |\n`;
    }

    report += "\n---\n\n";
  }

  fs.writeFileSync(config.PATHS.report, report, "utf-8");

  // Console summary
  console.log("\n=== RESULTS SUMMARY ===\n");
  for (const model of models) {
    console.log(`${config.MODELS[model].id}:`);
    for (const cond of conditions) {
      const s = summary[model][cond];
      console.log(
        `  ${cond.padEnd(10)} mean=${s.mean.toFixed(3)}  std=${s.std.toFixed(3)}  n=${s.n}`
      );
    }
    for (const cond of config.BIBLICAL_CONDITIONS) {
      const c = summary[model].comparisons[`plain_vs_${cond}`];
      if (c.diff === null) {
        console.log(`  plain→${cond}: insufficient data`);
        continue;
      }
      console.log(
        `  plain→${cond}: diff=${c.diff >= 0 ? "+" : ""}${c.diff.toFixed(3)}  p=${c.p.toFixed(4)}  ${c.significant ? "SIGNIFICANT" : ""}`
      );
    }
    console.log();
  }

  console.log(`Full report: ${config.PATHS.report}`);
  console.log(`Summary JSON: ${config.PATHS.summary}`);
}

module.exports = { analyzeAll };
