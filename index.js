#!/usr/bin/env node

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });
const { program } = require("commander");
const Anthropic = require("@anthropic-ai/sdk").default;
const fs = require("fs");

const TRANSLATIONS = {
  KJV: {
    name: "King James Version (1611)",
    style: `Use the language of the King James Version (1611). This means:
- Archaic English pronouns: "thou", "thee", "thy", "thine", "ye"
- Archaic verb forms: "hath", "doth", "saith", "cometh", "goeth", "shall", "shalt"
- Inverted sentence structures ("And it came to pass that...")
- Formal, elevated diction with Latinate and Anglo-Saxon vocabulary
- Conjunctive openings: "And", "For", "Behold", "Verily"
- Parallelism and repetition for emphasis
- Solemn, majestic, reverent tone throughout`,
  },
  NIV: {
    name: "New International Version",
    style: `Use the language of the New International Version. This means:
- Modern, clear, readable English
- Natural contemporary sentence structures
- Accessible vocabulary while retaining dignity and weight
- Balance between literal accuracy and readability
- Avoids archaic pronouns but keeps a sense of gravity
- Clear paragraph-like flow with direct address`,
  },
  ESV: {
    name: "English Standard Version",
    style: `Use the language of the English Standard Version. This means:
- Essentially literal translation style — formal but readable
- Retains some traditional phrasings ("And behold") while using modern grammar
- More literary and precise than NIV, less archaic than KJV
- Dignified, measured tone
- Preserves Hebrew/Greek sentence structures where natural in English
- Uses "you" not "thou" but maintains elevated register`,
  },
  NASB: {
    name: "New American Standard Bible",
    style: `Use the language of the New American Standard Bible. This means:
- Highly literal, word-for-word translation philosophy
- Sometimes stiff or formal sentence structures that mirror the original languages
- Precise, exacting word choices
- Uses italics conventions for supplied words (indicate these with brackets)
- Formal, scholarly tone
- Longer, more complex sentences reflecting source text structure`,
  },
  MSG: {
    name: "The Message (Eugene Peterson)",
    style: `Use the language of The Message by Eugene Peterson. This means:
- Vivid, colloquial, contemporary American English
- Paraphrastic and dynamic — captures the spirit, not word-for-word
- Surprising, punchy, sometimes irreverent phrasing
- Conversational and accessible, like a storyteller talking to you
- Uses contractions, slang, and idiomatic expressions
- Emotionally direct and visceral`,
  },
  NLT: {
    name: "New Living Translation",
    style: `Use the language of the New Living Translation. This means:
- Thought-for-thought translation philosophy
- Warm, clear, approachable modern English
- Smooth, flowing sentences
- Simplifies complex constructions for readability
- Gentle, pastoral tone
- Accessible to readers with no biblical background`,
  },
  NKJV: {
    name: "New King James Version",
    style: `Use the language of the New King James Version. This means:
- Modernized KJV — removes "thee/thou" but keeps formal, elevated register
- Retains much of the KJV's cadence and sentence structure
- Uses "you" and "your" but keeps dignified, slightly archaic phrasing
- Majestic and reverent tone, somewhat more accessible than KJV
- Preserves KJV word choices where still understandable`,
  },
  VULGATE: {
    name: "Latin Vulgate (Jerome)",
    style: `Use the language style of the Latin Vulgate translated into English. This means:
- Heavy, formal ecclesiastical register
- Latin-influenced syntax and word order
- Long, periodic sentences with subordinate clauses
- Theological precision in word choice
- Solemn, liturgical gravitas
- Occasional Latin terms or phrases where they add weight`,
  },
  ARAMAIC: {
    name: "Biblical Aramaic / Peshitta",
    style: `Render the text in Biblical Aramaic script (Syriac/Aramaic alphabet), as it would appear in the Peshitta or the Aramaic portions of the Hebrew Bible (Daniel 2-7, Ezra 4-7).
- Write the output in actual Aramaic script (the Syriac alphabet), NOT transliteration
- Use the grammar, vocabulary, and idiom of Biblical Aramaic / Classical Syriac
- Follow right-to-left Aramaic text conventions
- Use vocabulary and phrasing consistent with the Peshitta tradition
- After each verse in Aramaic, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Aramaic structure, not polished`,
  },
  HEBREW: {
    name: "Biblical Hebrew (Masoretic)",
    style: `Render the text in Biblical Hebrew as it would appear in the Masoretic Text of the Hebrew Bible (Tanakh).
- Write the output in actual Hebrew script with niqqud (vowel points)
- Use the grammar, vocabulary, and idiom of Biblical Hebrew (not Modern Israeli Hebrew)
- Use classical Biblical verb forms (wayyiqtol narrative, qatal, yiqtol) appropriately
- Follow the paratactic style of Biblical Hebrew narrative (heavy use of וַיְהִי ,וְ)
- Use vocabulary drawn from the Torah, Nevi'im, and Ketuvim
- After each verse in Hebrew, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Hebrew structure, not polished`,
  },
  GREEK: {
    name: "Koine Greek (New Testament)",
    style: `Render the text in Koine Greek as it would appear in the Greek New Testament (similar to the Nestle-Aland/UBS critical text tradition).
- Write the output in actual Greek script with proper accents and breathing marks
- Use the grammar, vocabulary, and idiom of Koine Greek (not Classical Attic or Modern Greek)
- Use characteristic NT constructions: καὶ ἐγένετο, ἀμὴν ἀμὴν λέγω ὑμῖν, ἰδού
- Use appropriate particles (μέν...δέ, γάρ, οὖν, ἀλλά)
- Draw vocabulary from the New Testament corpus
- After each verse in Greek, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Greek structure, not polished`,
  },
  LATIN: {
    name: "Latin (Vulgate text)",
    style: `Render the text in actual Latin as it would appear in Jerome's Vulgate Bible.
- Write the output in Latin, NOT English
- Use the grammar, vocabulary, and idiom of Ecclesiastical/Vulgate Latin
- Use characteristic Vulgate constructions: "et factum est", "ecce", "dixit autem"
- Follow the Vulgate's tendency toward simple paratactic clauses connected by "et" and "autem"
- Draw vocabulary from the Vulgate corpus
- After each verse in Latin, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Latin structure, not polished`,
  },
  GEEZ: {
    name: "Ge'ez (Ethiopic)",
    style: `Render the text in Ge'ez (Classical Ethiopic) as it would appear in the Ethiopian Orthodox Biblical tradition.
- Write the output in actual Ge'ez script (Ethiopic/Fidel syllabary)
- Use the grammar, vocabulary, and idiom of Classical Ge'ez
- Use characteristic Ge'ez narrative constructions and verb forms
- Draw vocabulary from the Ethiopian Biblical canon and liturgical tradition
- After each verse in Ge'ez, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Ge'ez structure, not polished`,
  },
  COPTIC: {
    name: "Coptic (Sahidic)",
    style: `Render the text in Sahidic Coptic as it would appear in early Egyptian Christian Bible translations.
- Write the output in actual Coptic script (the Coptic alphabet, derived from Greek with additional Demotic characters)
- Use the grammar, vocabulary, and idiom of Sahidic Coptic
- Use characteristic Coptic constructions and the bipartite conjugation system
- Draw vocabulary from the Sahidic New Testament tradition
- After each verse in Coptic, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Coptic structure, not polished`,
  },
  GOTHIC: {
    name: "Gothic (Wulfila's Bible)",
    style: `Render the text in Gothic as it would appear in Bishop Wulfila's 4th-century Gothic Bible translation.
- Write the output in the Gothic alphabet (𐌰𐌱𐌲𐌳) or, if script is unavailable, in standard Gothic transliteration
- Use the grammar, vocabulary, and idiom of 4th-century Gothic
- Use characteristic Gothic constructions and verb forms
- Draw vocabulary from the extant Gothic Biblical corpus (primarily the Gospels and Pauline epistles)
- After each verse in Gothic, provide a literal English gloss in parentheses on the next line
- The English gloss should be wooden/literal to show the Gothic structure, not polished`,
  },
};

const TRANSLATION_KEYS = Object.keys(TRANSLATIONS);

function buildSystemPrompt(translationKey) {
  const translation = TRANSLATIONS[translationKey];
  return `You are a textual style-transfer engine. Your task is to take arbitrary input text and render it in the style and format of a Biblical scripture passage, specifically imitating the ${translation.name} translation.

${translation.style}

LENGTH AND COMPLETENESS REQUIREMENTS:
- Do NOT compress, abbreviate, or summarize the input — the output should never feel like a shortened version of the original
- Every detail, clause, and nuance in the original must be fully represented
- Give each idea room to breathe: use the stylistic devices natural to this translation (appositive phrases, doublets, parallelism, restatements) to render the text with the fullness and gravity of scripture
- It is natural for the output to be longer than the input, since Biblical language is expansive — this is expected and desired

FORMAT REQUIREMENTS:
- Structure the output as Biblical chapters and verses
- Use the "Book Chapter:Verse" format (e.g., "1:1", "1:2", etc.)
- Break the text into verse-length segments (typically 1-3 sentences per verse)
- If the text is long enough, break it into multiple chapters
- Each verse should be on its own line, prefixed with its verse number
- Add a chapter heading when starting a new chapter (e.g., "Chapter 1")
- Preserve ALL of the semantic content and meaning of the original text — do not omit, add, or editorialize
- The output should feel like reading an actual passage from a Bible in this translation

OUTPUT ONLY the transformed Biblical text. Do not include any commentary, explanation, or metadata. Do not wrap in markdown code blocks.`;
}

// --- Spinner ---
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function createSpinner(label) {
  let frameIdx = 0;
  let interval = null;
  let startTime = null;
  let stopped = false;

  return {
    start() {
      startTime = Date.now();
      stopped = false;
      interval = setInterval(() => {
        if (stopped) return;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const frame = SPINNER_FRAMES[frameIdx % SPINNER_FRAMES.length];
        process.stderr.write(
          `\r${frame} ${label} \x1b[90m${elapsed}s\x1b[0m  `
        );
        frameIdx++;
      }, 80);
    },
    stop(message) {
      stopped = true;
      if (interval) clearInterval(interval);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stderr.write(`\r\x1b[32m✓\x1b[0m ${message} \x1b[90m(${elapsed}s)\x1b[0m\x1b[K\n`);
    },
    fail(message) {
      stopped = true;
      if (interval) clearInterval(interval);
      process.stderr.write(`\r\x1b[31m✗\x1b[0m ${message}\x1b[K\n`);
    },
  };
}

async function transformText(text, translationKey, options) {
  const client = new Anthropic();
  const systemPrompt = buildSystemPrompt(translationKey);
  const translationName = TRANSLATIONS[translationKey].name;

  const spinner = createSpinner(`Transforming to ${translationName}...`);
  spinner.start();

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Transform the following text into Biblical scripture format:\n\n${text}`,
      },
    ],
    ...(options.stream ? { stream: true } : {}),
  });

  if (options.stream) {
    let result = "";
    let firstToken = true;
    for await (const event of response) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        if (firstToken) {
          spinner.stop(`Rendering in ${translationName}`);
          process.stdout.write("\n");
          firstToken = false;
        }
        process.stdout.write(event.delta.text);
        result += event.delta.text;
      }
    }
    process.stdout.write("\n");
    return result;
  } else {
    const result = response.content[0].text;
    spinner.stop(`Rendered in ${translationName}`);
    console.log("\n" + result);
    return result;
  }
}

const ENGLISH_STYLES = ["KJV", "NIV", "ESV", "NASB", "MSG", "NLT", "NKJV", "VULGATE"];
const ANCIENT_LANGS = ["ARAMAIC", "HEBREW", "GREEK", "LATIN", "GEEZ", "COPTIC", "GOTHIC"];

program
  .name("biblical-style")
  .description(
    "Transform arbitrary text into Biblical scripture format using various translation styles"
  )
  .version("1.0.0")
  .addHelpText(
    "after",
    `
\x1b[1mBIBLICAL STYLE — Text-to-Scripture Transformer\x1b[0m

\x1b[33mExamples:\x1b[0m
  $ biblical-style transform "The quick brown fox jumped over the lazy dog"
  $ biblical-style transform -t NIV "Your text here"
  $ biblical-style transform -f essay.txt -t MSG -o output.txt
  $ cat document.txt | biblical-style transform -t GREEK
  $ biblical-style translations

\x1b[33mEnglish translation styles:\x1b[0m
  KJV       King James Version (1611) — archaic, majestic       [default]
  NIV       New International Version — modern, clear
  ESV       English Standard Version — formal, literary
  NASB      New American Standard Bible — highly literal
  MSG       The Message (Peterson) — colloquial, punchy
  NLT       New Living Translation — warm, accessible
  NKJV      New King James Version — modernized KJV
  VULGATE   Latin Vulgate — ecclesiastical English style

\x1b[33mHistorical language outputs (with English gloss):\x1b[0m
  HEBREW    Biblical Hebrew (Masoretic) — niqqud vocalization
  GREEK     Koine Greek (New Testament) — accents & breathings
  LATIN     Latin (Vulgate text) — Jerome's actual Latin
  ARAMAIC   Biblical Aramaic / Peshitta — Syriac script
  GEEZ      Ge'ez (Ethiopic) — Fidel syllabary
  COPTIC    Coptic (Sahidic) — early Egyptian Christian
  GOTHIC    Gothic (Wulfila's Bible) — 4th-century Germanic

\x1b[33mEnvironment:\x1b[0m
  ANTHROPIC_API_KEY   Required. Set in shell or .env file.

\x1b[33mNotes:\x1b[0m
  Powered by Claude Opus 4.6. Historical language outputs include
  a literal English gloss after each verse for readability.
`
  );

program
  .command("transform")
  .description("Transform input text into Biblical style")
  .argument("[text]", "Text to transform (or use --file / stdin)")
  .option(
    `-t, --translation <style>`,
    `Translation style (run 'translations' to list all)`,
    "KJV"
  )
  .option("-f, --file <path>", "Read input text from a file")
  .option("-o, --output <path>", "Write output to a file")
  .option("-s, --stream", "Stream output in real-time", true)
  .option("--no-stream", "Disable streaming")
  .addHelpText(
    "after",
    `
\x1b[33mExamples:\x1b[0m
  $ biblical-style transform "Hello world"
  $ biblical-style transform -t MSG -f essay.txt
  $ biblical-style transform -t HEBREW "In the beginning" -o hebrew.txt
  $ echo "some text" | biblical-style transform -t KJV
`
  )
  .action(async (text, options) => {
    const translationKey = options.translation.toUpperCase();
    if (!TRANSLATIONS[translationKey]) {
      console.error(
        `\x1b[31mUnknown translation: ${options.translation}\x1b[0m\n`
      );
      console.error(`English styles:    ${ENGLISH_STYLES.join(", ")}`);
      console.error(`Ancient languages: ${ANCIENT_LANGS.join(", ")}`);
      process.exit(1);
    }

    let input = text;

    if (options.file) {
      try {
        input = fs.readFileSync(options.file, "utf-8").trim();
      } catch (err) {
        console.error(`Error reading file: ${err.message}`);
        process.exit(1);
      }
    }

    if (!input) {
      // Read from stdin
      const chunks = [];
      process.stdin.setEncoding("utf-8");
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      input = chunks.join("").trim();
    }

    if (!input) {
      console.error(
        "No input text provided. Pass text as argument, use --file, or pipe via stdin."
      );
      process.exit(1);
    }

    try {
      const result = await transformText(input, translationKey, options);
      if (options.output) {
        fs.writeFileSync(options.output, result, "utf-8");
        console.error(`\x1b[90mOutput written to ${options.output}\x1b[0m`);
      }
    } catch (err) {
      if (err.status === 401) {
        console.error(
          "\x1b[31mAuthentication error.\x1b[0m Set your ANTHROPIC_API_KEY environment variable."
        );
      } else {
        console.error(`\x1b[31mError:\x1b[0m ${err.message}`);
      }
      process.exit(1);
    }
  });

program
  .command("translations")
  .description("List all supported translation styles")
  .action(() => {
    console.log("\n\x1b[1mSupported Translation Styles\x1b[0m\n");
    console.log("\x1b[33m  English Styles:\x1b[0m");
    for (const key of ENGLISH_STYLES) {
      console.log(`    \x1b[1m${key.padEnd(10)}\x1b[0m ${TRANSLATIONS[key].name}`);
    }
    console.log("\n\x1b[33m  Historical Languages:\x1b[0m \x1b[2m(output in original script with English gloss)\x1b[0m");
    for (const key of ANCIENT_LANGS) {
      console.log(`    \x1b[1m${key.padEnd(10)}\x1b[0m ${TRANSLATIONS[key].name}`);
    }
    console.log(
      `\n  \x1b[2mUsage: biblical-style transform -t <STYLE> "your text"\x1b[0m\n`
    );
  });

program.parse();
