# biblical-render

A CLI tool for transforming arbitrary text into Biblical scripture format across 15 translation styles, including 8 English Bible translations and 7 historical languages with original script output. Powered by Claude Opus 4.6 via the Anthropic API.

## Purpose

This tool performs style transfer from modern prose into the linguistic register, syntax, and chapter-verse structure of Biblical scripture. It is designed as a research instrument for studying whether the formal properties of Biblical text — its language, structure, and tone — have measurable effects on language model behavior independent of semantic content.

## Installation

```bash
git clone <repo-url>
cd biblical-render
npm install
```

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

### Transform text

```bash
# Inline text (default: KJV)
node index.js transform "Your text here"

# Specify translation style
node index.js transform -t NIV "Your text here"

# From a file
node index.js transform -f input.txt -t ESV

# Save output to file
node index.js transform -f input.txt -t MSG -o output.txt

# Pipe from stdin
cat document.txt | node index.js transform -t GREEK

# Disable streaming (wait for full response)
node index.js transform --no-stream "Your text here"
```

### List available translations

```bash
node index.js translations
```

### Help

```bash
node index.js --help
node index.js transform --help
```

## Supported Translation Styles

### English Bible Translations

Output is English text styled to match the target translation's linguistic characteristics.

| Flag | Translation | Character |
|------|------------|-----------|
| `KJV` | King James Version (1611) | Archaic pronouns (thou/thee), inverted syntax, elevated diction |
| `NIV` | New International Version | Modern, clear, balanced between literal and readable |
| `ESV` | English Standard Version | Formal but readable, literary, essentially literal |
| `NASB` | New American Standard Bible | Highly literal, stiff/scholarly, mirrors source structure |
| `MSG` | The Message (Eugene Peterson) | Colloquial, punchy, paraphrastic, conversational |
| `NLT` | New Living Translation | Warm, flowing, thought-for-thought, pastoral |
| `NKJV` | New King James Version | Modernized KJV — drops thee/thou, keeps the cadence |
| `VULGATE` | Latin Vulgate (English style) | Heavy ecclesiastical register, Latin-influenced syntax |

### Historical Language Outputs

Output is in the original script of each language, with a literal English gloss after each verse.

| Flag | Language | Script | Tradition |
|------|----------|--------|-----------|
| `HEBREW` | Biblical Hebrew | Hebrew with niqqud | Masoretic Text |
| `GREEK` | Koine Greek | Greek with accents/breathings | New Testament / Septuagint |
| `LATIN` | Latin | Latin alphabet | Jerome's Vulgate |
| `ARAMAIC` | Biblical Aramaic | Syriac script | Peshitta |
| `GEEZ` | Ge'ez | Ethiopic Fidel syllabary | Ethiopian Orthodox canon |
| `COPTIC` | Coptic (Sahidic) | Coptic alphabet | Early Egyptian Christian |
| `GOTHIC` | Gothic | Gothic alphabet | Wulfila's 4th-century Bible |

## Output Format

All output follows Biblical chapter-verse structure:

```
Chapter 1

1:1 [Verse text here.]

1:2 [Verse text here.]

Chapter 2

2:1 [Verse text here.]
```

For historical language outputs, each verse includes a literal English gloss:

```
1:1 וַיְהִי בִּימֵי הָרִאשׁוֹנִים...
(And it was in the first days...)
```

## Architecture

- **Runtime**: Node.js with Commander.js for CLI parsing
- **API**: Anthropic Messages API (Claude Opus 4.6)
- **Streaming**: Enabled by default for real-time output
- **System prompts**: Each translation style has a dedicated prompt specifying linguistic features, vocabulary constraints, and formatting rules
- **Length preservation**: The system prompt enforces completeness — output should never feel abbreviated or summarized relative to the input

## Evaluation Harness

The `eval/` directory contains an experiment testing whether biblical framing affects LLM instruction-following compliance. It uses biblical-render to transform plain instructions into KJV, NIV, and Aramaic, then measures whether target models follow those instructions more or less strictly.

### Design

- **Models**: Claude Opus 4.6, GPT 5.4
- **Conditions**: Plain, KJV, NIV, ARAMAIC (script + English gloss)
- **Repetitions**: 10 per condition, temperature 0
- **25 tasks** across three categories:

**Structural tasks** (20) — precise format constraints models struggle with: exact word counts per sentence, paragraph grids, acrostics, alphabetical sentence starts, lipograms, monosyllabic-only, etc.

**Behavioral tasks** (5) — semantic/reasoning constraints: arguing a position without hedging, explaining without examples, committing to a wrong answer, suppressing safety caveats, maintaining a persona.

### Running

```bash
cd eval
npm install
node index.js render    # Transform instructions into biblical variants (cached)
node index.js run       # Send all prompts to target models (cached)
node index.js grade     # Score responses against rubrics
node index.js analyze   # Compute stats and generate report
node index.js all       # Full pipeline
```

Requires `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` in the root `.env` file.

### Summary Results

| Condition | Claude Opus 4.6 | GPT 5.4 |
|-----------|-----------------|---------|
| Plain | 0.914 | 0.972 |
| KJV | 0.580 (-0.335) | 0.741 (-0.231) |
| NIV | 0.584 (-0.331) | 0.662 (-0.310) |
| ARAMAIC | 0.492 (-0.423) | 0.540 (-0.432) |

All pairwise comparisons vs plain are significant at p<0.0001.

Biblical framing **decreases** compliance overall. The dominant mechanism is style imitation: models prioritize producing biblical-sounding output over following embedded constraints. Structural tasks (sentence counts, paragraph grids) are most affected, while lexical tasks (no punctuation, avoid a letter) are resilient. Behavioral tasks show mixed, condition-specific effects — notably, Aramaic framing increased Claude's compliance on safety-caveat suppression from 0.20 to 0.90.

Full results are in `eval/results/report.md`.

## Validation

The `validation/` directory contains outputs from all 15 translation styles run against the same input text (a summary of Anthropic's Claude Constitution). These outputs are analyzed in `Paper.md`.

## Requirements

- Node.js >= 18
- An Anthropic API key with access to Claude Opus 4.6

## License

ISC
