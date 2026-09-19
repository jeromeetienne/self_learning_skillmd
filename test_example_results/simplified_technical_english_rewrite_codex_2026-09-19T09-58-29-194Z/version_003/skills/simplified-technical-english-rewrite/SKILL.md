---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in clear, simple English.

## Preserve the meaning

- Keep every fact, number, condition, limit, qualification, sequence, warning, and instruction.
- Do not add facts, causes, results, examples, warnings, or advice.
- Keep the original certainty. Preserve “can,” “may,” and “must.”
- Express a recommendation without “should,” for example, “is recommended to” or “is required to,” only when the source gives that recommendation or requirement.
- Keep the stated subject of every action.
- Do not assign an action to a different person, system, or component.
- Keep the difference between an actual action and a possible action.
- Keep approximate values and other limits. Do not replace “approximately,” “about,” “at least,” or “at most” with a general word.
- Keep the original order when the order affects meaning.
- Preserve exact commands, placeholders, code, paths, numbers, units, and punctuation when they carry meaning.

Example:

Source: “If the token expires or an administrator revokes it, the user must run the `CODEPLACEHOLDER` command again to obtain a new token.”

Rewrite:

“If the token expires, the user must run the `CODEPLACEHOLDER` command again. This action gets a new token.”

If the source names an administrator, keep the administrator as the subject of the revocation action.

## Sentences and paragraphs

- Put one main idea in each sentence.
- Use no more than 20 words in a sentence. Split a sentence when it contains a condition and a separate action.
- Repeat the subject when a split sentence could cause confusion.
- Put a condition before the action when this order is clear.
- Use short paragraphs.
- Use numbered steps when the source gives an ordered sequence.

Example:

Source: “If the test fails, stop the deployment and report the error.”

Rewrite:

“If the test fails, stop the deployment. Report the error.”

Example:

Source: “If two users edit the same list at the same time, one user can overwrite the other user's changes without noticing.”

Rewrite:

“If two users edit the same list at the same time, one user can overwrite the other user's changes. The user may not notice the change.”

## Words and grammar

- Use common, precise words.
- Prefer the active voice when the meaning stays unchanged.
- Use the present tense for general behaviour.
- Use “before,” “after,” “when,” and “if” for time and conditions.
- Use “must” for a required action.
- Use “can” or “may” for a possible action or result.
- Use “may” instead of “might” when the source expresses possibility.
- Do not address the reader directly. Do not use “you,” “your,” or similar words.
- Name the subject, such as “the operator,” “the user,” or “the application,” when needed.
- Use “get” instead of “obtain.”
- Use “more” instead of “additional.”
- Use “do,” “complete,” or another plain verb instead of “perform.”
- Do not use vague words that remove a source limit.
- Keep “approximately” or “about” when the source gives an approximate value.

Example:

Source: “The limit is approximately 100 requests per minute.”

Rewrite:

“The limit is about 100 requests per minute.”

## Abbreviations

- Do not use an abbreviation unless it is an exact identifier or required code.
- Write the full technical term instead of a general abbreviation.
- Use the full term again when this prevents confusion.
- Keep an abbreviation when it is part of an exact identifier, file name, command, variable name, or required code.
- Do not shorten “application” to “app.”
- Write “Java Virtual Machine” instead of “JVM.”
- Write “JavaScript Object Notation” instead of “JSON.”
- Write “application programming interface” instead of “API.”
- Write “web address” instead of “URL.”
- Write “Coordinated Universal Time” instead of “UTC.”
- Write “Secure Shell” instead of “SSH.”

Example:

Source: “The JVM reads the JSON file.”

Rewrite:

“The Java Virtual Machine reads the JavaScript Object Notation file.”

## Technical names and code

- Preserve the exact names of variables, commands, files, directories, products, and code.
- Do not translate or change a technical identifier.
- Explain an identifier only when the source gives its meaning.
- Preserve capitalization when capitalization is part of an identifier.
- Keep an abbreviation inside an exact identifier, such as `JVM_PATH`.
- Keep required code and placeholders unchanged.

Example:

“`JAVA_OPTS` is an environment variable. If the build fails because of an out-of-memory error, the operator can try to increase the maximum heap size with `JAVA_OPTS`.”

## Final check

Before returning the rewrite, check each sentence and the complete paragraph.

- Every sentence has 20 words or fewer.
- No forbidden abbreviation remains.
- No refused word remains, including “obtain,” “additional,” “perform,” “should,” and “might.”
- The rewrite does not address the reader directly.
- Every fact, number, condition, limit, qualification, sequence, warning, and instruction remains.
- No new fact, cause, result, example, advice, or stronger claim appears.
- Every action has the same subject as the source.
- Every possible action keeps its original uncertainty.
- Every approximate value and other qualification remains.
- Every exact identifier, command, placeholder, number, unit, and code element remains unchanged.
