---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source in clear, simple English. Apply the rules below in order.

## Preserve the meaning

- Keep every fact, number, condition, limit, qualification, warning, sequence, and instruction.
- Do not add a fact, cause, result, example, warning, recommendation, or stronger claim.
- Preserve the original certainty. Keep “can,” “may,” and “must” when they express the source meaning.
- Express a source recommendation as “is recommended to.” Express a source requirement as “must.”
- Keep the subject of every action. Do not assign an action to another person, system, or component.
- Keep the difference between an actual action and a possible action.
- Keep qualifications such as “about,” “approximately,” “normally,” “at least,” and “at most.”
- Keep the original order when order affects meaning.
- Preserve exact commands, identifiers, paths, placeholders, numbers, units, and code.

Example:

Source: “If the token expires or an administrator revokes it, the user must run the `CODEPLACEHOLDER` command again to obtain a new token.”

Rewrite:

“If the token expires, the user must run the `CODEPLACEHOLDER` command again. This action gets a new token. If an administrator revokes the token, the user must run the command again.”

## Sentences and paragraphs

- Put one main idea in each sentence.
- Use no more than 20 words in each sentence.
- Prefer 18 words or fewer when possible.
- Split sentences at conditions, sequences, and separate actions.
- Repeat the subject after a split when the subject could be unclear.
- Put a condition before the action when this order is clear.
- Use short paragraphs.
- Use numbered steps for an ordered sequence.
- Keep separate conditions separate when combining them could change the meaning.

Example:

Source: “If two users edit the same list at the same time, one user can overwrite the other user's changes without noticing.”

Rewrite:

“If two users edit the same list at the same time, one user can overwrite the other user's changes. The user may not notice the change.”

## Words and grammar

- Use common, precise words.
- Prefer the active voice when the meaning stays unchanged.
- Use the present tense for general behaviour.
- Use “before,” “after,” “when,” and “if” for time and conditions.
- Use “must” for a requirement.
- Use “can” or “may” for possibility.
- Use “may” for source possibility expressed with “might.”
- Do not address the reader directly. Do not use “you” or “your.”
- Name the subject when needed, such as “the operator,” “the user,” or “the application.”
- Use “get” instead of “obtain.”
- Use “more” instead of “additional.”
- Use “do” or “complete” instead of “perform.”
- Use “is recommended to” for a recommendation.
- Do not replace a precise limit with a vague word.
- Keep every source qualification, including approximate values.

Example:

Source: “The limit is approximately 100 requests per minute.”

Rewrite:

“The limit is about 100 requests per minute.”

## Abbreviations

- Do not use a general abbreviation in the rewrite.
- Write the full technical term for a general abbreviation.
- Use the full term again when this prevents confusion.
- Keep an abbreviation only inside an exact identifier, file name, command, variable name, or required code.
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
- Preserve identifier capitalization.
- Keep abbreviations inside exact identifiers.
- Preserve code, paths, placeholders, numbers, units, and meaningful punctuation.
- Explain an identifier only when the source gives its meaning.

Example:

“`JAVA_OPTS` is an environment variable. If the build fails because of an out-of-memory error, the operator can try to increase the maximum heap size with `JAVA_OPTS`.”

## Final check

Before returning the rewrite, check the complete text.

- Each sentence contains no more than 20 words.
- No general abbreviation remains outside an exact identifier or required code.
- “obtain,” “additional,” “perform,” “should,” and “might” do not remain.
- The rewrite does not address the reader directly.
- Every fact, number, condition, limit, qualification, sequence, warning, and instruction remains.
- No new fact, cause, result, advice, or stronger claim appears.
- Each action has the same subject as the source.
- Each possible action keeps its original uncertainty.
- Each exact identifier, command, placeholder, path, number, unit, and code element remains unchanged.
