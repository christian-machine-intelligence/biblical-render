#!/usr/bin/env node

const { Command } = require("commander");
const program = new Command();
const { renderAll } = require("./render.js");
const { runAll } = require("./run.js");
const { gradeAll } = require("./grade.js");
const { analyzeAll } = require("./analyze.js");
const config = require("./config.js");

program
  .name("biblical-eval")
  .description(
    "Evaluate whether biblical framing affects LLM instruction-following compliance"
  )
  .version("1.0.0");

program
  .command("render")
  .description(
    "Render all task instructions into biblical variants (KJV, NIV, ARAMAIC). One-time step, results are cached."
  )
  .action(async () => {
    console.log("=== Rendering biblical variants ===\n");
    console.log(
      `Tasks: ${require(config.PATHS.tasks).length}, Conditions: ${config.BIBLICAL_CONDITIONS.join(", ")}\n`
    );
    await renderAll();
  });

program
  .command("run")
  .description(
    "Run all prompt variants against target models and save raw responses."
  )
  .action(async () => {
    const tasks = require(config.PATHS.tasks);
    const modelNames = Object.values(config.MODELS)
      .map((m) => m.id)
      .join(", ");
    const totalCalls =
      tasks.length *
      config.CONDITIONS.length *
      config.REPS *
      Object.keys(config.MODELS).length;

    console.log("=== Running experiment ===\n");
    console.log(`Models: ${modelNames}`);
    console.log(`Tasks: ${tasks.length}`);
    console.log(`Conditions: ${config.CONDITIONS.join(", ")}`);
    console.log(`Reps: ${config.REPS}`);
    console.log(`Temperature: ${config.TEMPERATURE}`);
    console.log(`Total API calls: ${totalCalls}`);
    console.log(`Concurrency: ${config.CONCURRENCY}\n`);

    await runAll();
  });

program
  .command("grade")
  .description("Grade all raw responses against task rubrics.")
  .action(() => {
    console.log("=== Grading responses ===\n");
    gradeAll();
  });

program
  .command("analyze")
  .description(
    "Analyze graded scores: compute aggregate stats, pairwise comparisons, and generate report."
  )
  .action(() => {
    console.log("=== Analyzing results ===\n");
    analyzeAll();
  });

program
  .command("all")
  .description("Run the full pipeline: render → run → grade → analyze")
  .action(async () => {
    console.log("=== Full pipeline ===\n");

    console.log("--- Step 1/4: Rendering biblical variants ---\n");
    await renderAll();

    console.log("\n--- Step 2/4: Running experiment ---\n");
    await runAll();

    console.log("\n--- Step 3/4: Grading responses ---\n");
    gradeAll();

    console.log("\n--- Step 4/4: Analyzing results ---\n");
    analyzeAll();

    console.log("\n=== Pipeline complete ===");
  });

program.parse();
