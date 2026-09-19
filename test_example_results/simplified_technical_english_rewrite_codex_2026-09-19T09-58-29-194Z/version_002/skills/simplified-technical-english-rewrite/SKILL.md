---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in clear, simple English.

## Meaning

- Keep every fact, number, condition, limit, sequence, warning, and instruction.
- Do not add facts, causes, results, examples, or advice.
- Keep the original certainty. Preserve “can,” “may,” “must,” and other expressions of possibility or requirement.
- Keep the difference between an action and a possible action.
- Keep the stated subject of every action.
- Do not change which person, system, or component performs an action.
- Keep qualifications such as “about,” “at least,” “at most,” and “normally.”
- Keep the source's order when order affects meaning.

Example:

Source: “If the test fails, stop the deployment and report the error.”

Rewrite:

“If the test fails, stop the deployment. Report the error.”

## Sentences and paragraphs

- Put one main idea in each sentence.
- Use no more than 20 words in a sentence. Prefer 18 words or fewer.
- Split a sentence at a condition, sequence, or separate action.
- Put a condition before the action when this order is clear.
- Use short paragraphs.
- Use numbered steps for an ordered sequence.
- Repeat the subject when a split sentence could create confusion.

Example:

Source: “If two users edit the same list at the same time, one user can overwrite the other user's changes without noticing.”

Rewrite:

“If two users edit the same list at the same time, one user can overwrite the other user's changes. The user may not notice the change.”

## Words and grammar

- Use common words.
- Prefer the active voice when the source meaning stays unchanged.
- Use the present tense for general behaviour.
- Use “before,” “after,” “when,” and “if” for time and conditions.
- Use “must” for a required action.
- Use “can” or “may” for a possible action or result.
- Do not address the reader directly. Do not use “you,” “your,” or similar forms.
- Name the subject, such as “the operator,” “the user,” or “the application.”
- Use “get” instead of “obtain.”
- Use “more” instead of “additional.”
- Use “do,” “complete,” or another plain verb instead of “perform.”
- Use “may” instead of “might” when the source expresses possibility.
- Do not use “should.” Preserve a recommendation with wording such as “is recommended to” only when the source gives a recommendation.
- Do not use vague words that remove a source limit.
- Keep words such as “about” when the source gives an approximate value.
- Use exact values and units from the source.

Example:

Source: “The limit is approximately 100 requests per minute.”

Rewrite:

“The limit is about 100 requests per minute.”

## Abbreviations

- Do not use abbreviations in the rewrite.
- Write the full term when the source uses an abbreviation that is not an exact identifier.
- Use the full term again when this prevents confusion.
- Keep an abbreviation only when it is part of an exact identifier, file name, command, variable name, or required code.
- Write “Java Virtual Machine,” “JavaScript Object Notation,” “application programming interface,” “web address,” “Coordinated Universal Time,” and “Secure Shell.”
- Do not shorten “application” to “app.”

Example:

Source: “The JVM reads the JSON file.”

Rewrite:

“The Java Virtual Machine reads the JavaScript Object Notation file.”

## Technical names and code

- Preserve exact names of variables, commands, files, directories, products, and code.
- Do not translate or change a technical identifier.
- Explain an identifier only when the source gives its meaning.
- Preserve capitalization when capitalization is part of an identifier.
- Preserve code, paths, placeholders, numbers, and punctuation that carry meaning.

Example:

“`JAVA_OPTS` is an environment variable. If the build fails because of an out-of-memory error, the operator can try to increase the maximum heap size with `JAVA_OPTS`.”

## Final check

Before returning the rewrite, check every sentence.

- The sentence has no more than 20 words.
- The sentence has no forbidden abbreviation.
- The sentence does not address the reader directly.
- Every fact, number, condition, limit, qualification, and instruction remains.
- No new fact or stronger claim appears.
- Every action has the same subject as the source.
- Every possible action keeps its original uncertainty.
- Every sequence keeps its original order.
