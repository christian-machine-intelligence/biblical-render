const path = require("path");

module.exports = {
  MODELS: {
    claude: {
      id: "claude-opus-4-6",
      provider: "anthropic",
    },
    gpt: {
      id: "gpt-5.4",
      provider: "openai",
    },
  },

  CONDITIONS: ["plain", "KJV", "NIV", "ARAMAIC"],
  BIBLICAL_CONDITIONS: ["KJV", "NIV", "ARAMAIC"],

  REPS: 10,
  TEMPERATURE: 0,
  MAX_TOKENS: 2048,
  CONCURRENCY: 5,

  PATHS: {
    tasks: path.join(__dirname, "tasks.json"),
    rendered: path.join(__dirname, "results", "rendered"),
    raw: path.join(__dirname, "results", "raw"),
    scores: path.join(__dirname, "results", "scores.csv"),
    summary: path.join(__dirname, "results", "summary.json"),
    report: path.join(__dirname, "results", "report.md"),
  },
};
