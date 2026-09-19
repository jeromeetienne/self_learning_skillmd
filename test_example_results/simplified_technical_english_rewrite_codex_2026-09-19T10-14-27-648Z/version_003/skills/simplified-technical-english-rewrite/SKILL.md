---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source paragraph in Simplified Technical English.

## Preserve the source

- Keep every fact, number, condition, warning, limitation, action, and result.
- Keep the source meaning, including timing, order, scope, degree, uncertainty, and cause.
- Keep each condition with the action or result that depends on it.
- Keep each cause and its result. Do not remove an explanation because the result is already clear.
- Keep approximate values approximate. Keep exact values exact.
- Keep the original actor. Do not change a reader, user, operator, or system into another person.
- Do not add facts, reasons, explanations, choices, advice, or recommendations.
- Keep the original order when the order affects the result.

## Sentence rules

- Write sentences of 20 words or fewer.
- Give each sentence one main action, condition, or result.
- Split long sentences at natural points, but keep the original relationships.
- Use active voice when the source identifies the actor.
- Do not address the reader directly. Name the reader, user, operator, administrator, or system.
- Use “must” for a required action.
- Use “can” for permission or ability.
- Express possibility or uncertainty with wording that preserves that meaning, such as “is possible”.
- Do not use “should”, “might”, “may”, or “very”.
- Do not turn a conditional action into a general requirement.

## Word and term rules

- Use common words and direct grammar.
- Use one term for one thing throughout the rewrite.
- Prefer simple verbs, such as “use”, “get”, “run”, and “do”.
- Write an abbreviation in full unless it is a code name, command, variable name, file name, path, or other exact value.
- Keep code names, commands, variable names, header names, file names, paths, quoted values, and placeholders unchanged.
- Keep numbers, units, times, symbols, and capitalization unchanged unless expansion is required.
- Do not shorten technical words. Write “application”, not “app”.
- Do not replace an exact value with an approximate expression.
- Do not replace an approximate expression with an exact value.

## Final check

Compare the rewrite with the source.

- Check every fact, number, condition, warning, limitation, action, and result.
- Check every actor, cause, effect, degree, uncertainty, timing, order, and scope.
- Check that no new information appears.
- Count the words in every sentence. Split every sentence longer than 20 words.
- Check that no forbidden shortened word or unexpanded abbreviation remains.
- Check that each technical term has the same meaning throughout.

## Examples

Source: “If the token expires or an administrator revokes the token, the user must run the login command again to obtain a new token.”

Rewrite: “If the token expires, the user must run the login command again. The user gets a new token. The same rule applies if an administrator revokes the token.”

Source: “If the build fails with an out-of-memory error, the user can increase the Java Virtual Machine maximum heap size with the JAVA_OPTS environment variable.”

Rewrite: “If an out-of-memory error stops the build, the user can increase the Java Virtual Machine maximum heap size. The user does this with JAVA_OPTS.”

Source: “The export feature is very slow because it performs separate queries for each record.”

Rewrite: “The export feature has a long run time. Separate queries for each record cause the long run time.”

Source: “The exact version is required because unexpected minor updates caused the failures.”

Rewrite: “Use the exact version. Unexpected minor updates caused the failures.”

Source: “The service rejects more than about 100 requests per minute.”

Rewrite: “The service rejects more than about 100 requests per minute.”
