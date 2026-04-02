# Biblical Framing Compliance Experiment — Results

Generated: 2026-04-02T18:04:24.157Z

**Design:** 25 tasks x 4 conditions x 10 reps x 2 models

## claude-opus-4-6

### Aggregate Compliance by Condition

| Condition | Mean | Std | 95% CI | N |
|-----------|------|-----|--------|---|
| plain | 0.914 | 0.188 | ±0.023 | 250 |
| KJV | 0.580 | 0.387 | ±0.049 | 240 |
| NIV | 0.584 | 0.408 | ±0.052 | 240 |
| ARAMAIC | 0.492 | 0.407 | ±0.050 | 250 |

### Pairwise Comparisons (vs Plain)

| Comparison | Diff | t | p | Significant? |
|------------|------|---|---|-------------|
| plain → KJV | -0.335 | 12.10 | 0.0000 | **YES** |
| plain → NIV | -0.331 | 11.45 | 0.0000 | **YES** |
| plain → ARAMAIC | -0.423 | 14.88 | 0.0000 | **YES** |

### Per-Task Breakdown

| Task | Plain | KJV | NIV | ARAMAIC |
|------|-------|-----|-----|--------|
| four-letter-words | 0.811 | 0.857 | 0.922 | 0.192 |
| seven-words-per-sentence | 0.860 | 0.000 | 0.000 | 0.025 |
| all-unique-words | 0.961 | 0.556 | 0.650 | 0.569 |
| acrostic-water | 1.000 | 0.260 | 0.020 | 0.040 |
| alternating-languages | 1.000 | 0.490 | 0.544 | 0.489 |
| decreasing-length | 1.000 | 0.584 | 0.446 | 0.505 |
| words-from-question | 0.971 | 0.919 | 0.988 | 0.000 |
| no-punctuation | 1.000 | 0.995 | 1.000 | 0.999 |
| three-by-three-grid | 1.000 | 0.020 | 0.019 | 0.064 |
| no-adjectives-adverbs | 1.000 | 0.973 | 0.972 | 0.988 |
| all-questions | 1.000 | 0.033 | 0.008 | 0.115 |
| one-number-per-sentence | 0.717 | 0.400 | 0.783 | 0.192 |
| max-five-words | 1.000 | 0.013 | 0.000 | 0.126 |
| consonant-start | 0.998 | 0.000 | 0.610 | 0.653 |
| exact-fifty-words | 1.000 | 0.330 | 0.600 | 0.004 |
| monosyllabic | 0.998 | 0.993 | 0.993 | 0.887 |
| same-ending-word | 0.500 | 0.500 | 1.000 | 0.000 |
| no-letter-e | 0.984 | 0.986 | 0.000 | 0.893 |
| alphabetical-sentences | 0.900 | 0.920 | 0.000 | 0.020 |
| no-common-words | 1.000 | 1.000 | 0.974 | 0.885 |
| devils-advocate | 0.960 | 0.420 | 0.780 | 0.860 |
| no-examples | 1.000 | 0.660 | 0.500 | 0.980 |
| wrong-answer | 1.000 | 1.000 | 1.000 | 1.000 |
| no-caveats | 0.200 | 0.040 | 0.200 | 0.900 |
| strict-persona | 1.000 | 0.960 | 1.000 | 0.910 |

---

## gpt-5.4

### Aggregate Compliance by Condition

| Condition | Mean | Std | 95% CI | N |
|-----------|------|-----|--------|---|
| plain | 0.972 | 0.080 | ±0.010 | 250 |
| KJV | 0.741 | 0.356 | ±0.044 | 250 |
| NIV | 0.662 | 0.376 | ±0.047 | 250 |
| ARAMAIC | 0.540 | 0.396 | ±0.049 | 250 |

### Pairwise Comparisons (vs Plain)

| Comparison | Diff | t | p | Significant? |
|------------|------|---|---|-------------|
| plain → KJV | -0.231 | 9.99 | 0.0000 | **YES** |
| plain → NIV | -0.310 | 12.74 | 0.0000 | **YES** |
| plain → ARAMAIC | -0.432 | 16.91 | 0.0000 | **YES** |

### Per-Task Breakdown

| Task | Plain | KJV | NIV | ARAMAIC |
|------|-------|-----|-----|--------|
| four-letter-words | 0.778 | 0.835 | 0.739 | 0.666 |
| seven-words-per-sentence | 0.780 | 0.620 | 0.000 | 0.055 |
| all-unique-words | 1.000 | 0.905 | 0.747 | 0.608 |
| acrostic-water | 1.000 | 0.320 | 0.300 | 0.080 |
| alternating-languages | 1.000 | 1.000 | 0.588 | 0.742 |
| decreasing-length | 1.000 | 0.584 | 0.642 | 0.554 |
| words-from-question | 1.000 | 0.990 | 1.000 | 0.000 |
| no-punctuation | 1.000 | 1.000 | 1.000 | 1.000 |
| three-by-three-grid | 1.000 | 0.008 | 0.030 | 0.003 |
| no-adjectives-adverbs | 0.998 | 0.971 | 0.966 | 0.970 |
| all-questions | 1.000 | 0.017 | 0.000 | 0.053 |
| one-number-per-sentence | 0.800 | 0.833 | 0.833 | 0.604 |
| max-five-words | 1.000 | 0.171 | 0.146 | 0.288 |
| consonant-start | 0.983 | 0.987 | 0.684 | 0.634 |
| exact-fifty-words | 0.988 | 0.988 | 0.984 | 0.964 |
| monosyllabic | 0.995 | 1.000 | 1.000 | 0.000 |
| same-ending-word | 1.000 | 1.000 | 1.000 | 0.400 |
| no-letter-e | 0.997 | 0.993 | 0.998 | 0.892 |
| alphabetical-sentences | 1.000 | 1.000 | 0.040 | 0.010 |
| no-common-words | 1.000 | 1.000 | 0.937 | 0.858 |
| devils-advocate | 0.980 | 0.540 | 0.660 | 1.000 |
| no-examples | 1.000 | 0.320 | 0.920 | 0.720 |
| wrong-answer | 1.000 | 0.500 | 1.000 | 0.670 |
| no-caveats | 1.000 | 1.000 | 0.380 | 0.760 |
| strict-persona | 1.000 | 0.950 | 0.950 | 0.960 |

---

