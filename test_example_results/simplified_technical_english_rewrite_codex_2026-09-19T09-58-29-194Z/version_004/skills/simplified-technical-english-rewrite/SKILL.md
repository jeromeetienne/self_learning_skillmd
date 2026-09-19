---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in clear, simple English.

## Preserve the meaning

- Keep every fact, number, condition, limit, qualification, sequence, warning, and instruction.
- Do not add a fact, cause, result, example, warning, or recommendation.
- Keep the original certainty. Preserve “can,” “may,” “must,” and other words that show possibility or requirement.
- Replace “should” only when necessary. Use “must” for a requirement and “is recommended to” for a recommendation.
- Keep the subject of every action. Do not give an action to a different person, system, or component.
- Keep the difference between an actual action and a possible action.
- Keep qualifications such as “approximately,” “about,” “normally,” “at least,” and “at most.”
- Keep the original order when the order affects meaning.
- Preserve exact commands, placeholders, identifiers, paths, numbers, units, and code.

Example:

Source: “If the token expires or an administrator revokes it, the user must run the `CODEPLACEHOLDER` command again to obtain a new token.”

Rewrite:

“If the token expires, the user must run the `CODEPLACEHOLDER` command again. This action gets a new token. If an administrator revokes the token, the user must run the command again.”

## Sentences and paragraphs

- Put one main idea in each sentence.
- Use no more than 20 words in a sentence.
- Split a sentence at a condition, sequence, or separate action.
- Repeat the subject after a sentence split when the subject could be unclear.
- Put a condition before the action when this order is clear.
- Use short paragraphs.
- Use numbered steps when the source gives an ordered sequence.

Example:

Source: “If two users edit the same list at the same time, one user can overwrite the other user's changes without noticing.”

Rewrite:

“If two users edit the same list at the same time, one user can overwrite the other user's changes. The user may not notice the change.”

Example:

Source: “All other engineers who need to inspect a server should ask the on-call engineer to perform the task or grant temporary access for a maximum of 4 hours.”

Rewrite:

“All other engineers who need to inspect a server must ask the on-call engineer to do the task. The on-call engineer can grant temporary access for a maximum of 4 hours.”

## Words and grammar

- Use common, precise words.
- Prefer the active voice when the meaning stays unchanged.
- Use the present tense for general behaviour.
- Use “before,” “after,” “when,” and “if” for time and conditions.
- Use “must” for a required action.
- Use “can” or “may” for a possible action or result.
- Use “may” instead of “might” when the source expresses possibility.
- Do not address the reader directly. Do not use “you,” “your,” or similar forms.
- Name the subject, such as “the operator,” “the user,” or “the application,” when needed.
- Use “get” instead of “obtain.”
- Use “more” instead of “additional.”
- Use “do” or “complete” instead of “perform.”
- Do not use vague words that remove a source limit.
- Keep approximate values and other qualifications.

Example:

Source: “The limit is approximately 100 requests per minute.”

Rewrite:

“The limit is about 100 requests per minute.”

## Abbreviations

- Do not use an abbreviation unless it is part of an exact identifier, file name, command, variable name, or required code.
- Write the full technical term instead of a general abbreviation.
- Write the full term again when this prevents confusion.
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

- Preserve exact names of variables, commands, files, directories, products, and code.
- Do not translate or change a technical identifier.
- Explain an identifier only when the source gives its meaning.
- Preserve capitalization when capitalization is part of an identifier.
- Keep abbreviations inside exact identifiers.
- Preserve code, paths, placeholders, numbers, units, and punctuation that carry meaning.

Example:

“`JAVA_OPTS` is an environment variable. If the build fails because of an out-of-memory error, the operator can try to increase the maximum heap size with `JAVA_OPTS`.”

## Final check

Before returning the rewrite, check the complete text.

- Each sentence has no more than 20 words.
- No forbidden abbreviation remains outside an exact identifier or required code.
- No refused word remains, including “obtain,” “additional,” “perform,” “should,” and “might.”
- The rewrite does not address the reader directly.
- Every fact, number, condition, limit, qualification, sequence, warning, and instruction remains.
- No new fact, cause, result, advice, or stronger claim appears.
- Every action has the same subject as the source.
- Every possible action keeps its original uncertainty.
- Every exact identifier, command, placeholder, number, unit, and code element remains unchanged.
