---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in clear, simple English.

## Meaning

- Keep every fact, number, condition, limit, sequence, warning, and instruction.
- Do not add facts, causes, results, examples, or advice.
- Keep the original level of certainty. Keep words such as “can,” “may,” “must,” and “should.”
- Keep the difference between an action and a possible action.
- State who performs each action when the source states who performs it.
- Do not change the source of an action. For example, logs written to standard output can be collected and forwarded by a log agent. The log agent does not write the logs.

## Sentence and paragraph rules

- Use one main idea in each sentence.
- Use no more than 20 words in a sentence.
- Split long sentences at conditions, sequences, or separate actions.
- Put a condition before the action when this order is clear.
- Use short paragraphs.
- Use numbered steps for a sequence.

Example:

Source: “If the test fails, stop the deployment and report the error.”

Rewrite:

“If the test fails, stop the deployment. Report the error.”

## Words and grammar

- Use common words.
- Use the active voice when the source meaning stays unchanged.
- Use the present tense for general behaviour.
- Use “before,” “after,” “when,” and “if” to show time and conditions.
- Use “must” for a required action.
- Use “can” for a possible action or result.
- Do not speak directly to the reader. Do not use “you,” “your,” or similar forms.
- Write “the operator,” “the user,” “the application,” or another exact subject when needed.
- Do not use vague words such as “very” or “approximately.”
- Use exact values and units from the source.
- Do not replace a precise limit with a general word.

Example:

Source: “You can try to increase the maximum heap size.”

Rewrite:

“The operator can try to increase the maximum heap size.”

## Abbreviations

- Do not use abbreviations in the rewrite.
- Write the full term the first time.
- Use the full term again when this prevents confusion.
- Keep an abbreviation only when it is part of an exact identifier, file name, command, variable name, or required code.
- Do not shorten “application” to “app.”
- Write “application programming interface,” “web address,” “Coordinated Universal Time,” “before noon,” and “Secure Shell” instead of common abbreviations.

## Technical names and code

- Preserve exact names of variables, commands, files, directories, products, and code.
- Do not translate or change a technical identifier.
- Explain what an identifier means only when the source gives that meaning.
- Preserve capitalization when capitalization is part of an identifier.
- Preserve code, paths, placeholders, numbers, and punctuation that carry meaning.

Example:

“`JAVA_OPTS` is an environment variable. If the build fails because of an out-of-memory error, the operator can try to increase the maximum heap size with `JAVA_OPTS`.”

## Final check

Before returning the rewrite, check each sentence.

- The sentence has no more than 20 words.
- The sentence contains no forbidden abbreviation.
- The sentence does not address the reader directly.
- Every source fact, number, condition, limit, and instruction remains.
- No new fact or stronger claim appears.
- Each action has the same subject as the source.
- Each possible action keeps its original uncertainty.
