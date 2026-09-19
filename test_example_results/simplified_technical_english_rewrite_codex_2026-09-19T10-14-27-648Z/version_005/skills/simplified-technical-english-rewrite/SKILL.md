---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source paragraph in Simplified Technical English. Preserve the source meaning exactly.

## Meaning and structure

- Keep every fact, number, condition, warning, limitation, instruction, action, result, cause, and effect.
- Keep the original actor. Do not change a user, reader, operator, administrator, or system into another actor.
- Keep timing, order, scope, degree, uncertainty, and relationships between events.
- Keep each condition with the action or result that depends on the condition.
- Keep each stated cause with its result. Do not omit a cause because the result is clear.
- Keep exact values exact. Keep approximate values approximate.
- Do not add facts, explanations, reasons, choices, advice, or recommendations.
- Keep the original order when order affects the result.
- Do not change a required action into a permission, possibility, or recommendation.
- Do not change a permission or possibility into a requirement.

## Sentence rules

- Use no more than 20 words in each sentence.
- Use one main action, condition, or result in each sentence.
- Split a conditional sentence when it has multiple actions or conditions.
- Repeat the condition when necessary to keep its meaning clear.
- Use active voice when the source identifies the actor.
- Do not address the reader directly. Name the reader, user, operator, administrator, or system.
- Use “must” for a required action.
- Use “can” for permission or ability.
- Use “is possible” or equivalent wording for possibility or uncertainty.
- Do not use “should”, “might”, or “may” unless the source uses the same meaning.
- Do not turn a conditional action into a general requirement.
- Keep cause-and-effect wording explicit.

## Word and term rules

- Use common words, direct grammar, and simple verbs.
- Use one technical term for one thing throughout the rewrite.
- Prefer “use”, “get”, “run”, and “do” when these words keep the source meaning.
- Do not use “perform” or “additional”. Use a simpler word with the same meaning.
- Do not use informal shortened words. Write “application”, not “app”.
- Expand ordinary abbreviations in prose. Write “application programming interface”, “uniform resource locator”, “Coordinated Universal Time”, “repository”, and “configuration”.
- Expand ordinary time abbreviations. Write “ante meridiem” instead of “a.m.” when that meaning applies.
- Write “and so on” instead of an abbreviated form meaning “and so on”.
- Keep commands, code names, variable names, header names, file names, paths, quoted values, placeholders, and other exact values unchanged.
- Keep numbers, units, symbols, and capitalization unchanged unless the source provides an expanded form.
- Do not replace an exact value with an approximate value.
- Do not replace an approximate value with an exact value.
- Preserve wording that shows degree, uncertainty, or limitation.

## Final check

Compare the rewrite with the source.

- Check every fact, number, condition, warning, limitation, instruction, action, result, cause, and effect.
- Check every actor, degree, uncertainty, timing, order, and scope.
- Check that conditional actions remain conditional.
- Check that causes remain connected to their results.
- Check that no new information appears.
- Count the words in every sentence. Split every sentence longer than 20 words.
- Check that ordinary abbreviations are expanded.
- Check that no prohibited shortened word appears.
- Check that each technical term has one meaning throughout.

## Examples

Source: “If the token expires or an administrator revokes it, the user must run the login command again to get a new token.”

Rewrite: “If the token expires, the user must run the login command again. The user gets a new token. The same rule applies if an administrator revokes the token.”

Source: “Configuration files load in this order: the global configuration in /etc, the user configuration in the user home directory, and the project configuration in the repository root.”

Rewrite: “Configuration files load in this order. First, the global configuration in /etc loads. Next, the user configuration loads. Last, the project configuration loads.”

Source: “If the build fails with an out-of-memory error, the user can increase the maximum heap size of the Java virtual machine through the JAVA_OPTS environment variable.”

Rewrite: “If an out-of-memory error stops the build, the user can increase the Java Virtual Machine maximum heap size. The user can use JAVA_OPTS.”

Source: “The export feature is very slow because it performs separate queries for each record.”

Rewrite: “The export feature has a very long run time. Separate queries for each record cause the long run time.”

Source: “The translator must translate each value and leave the keys unchanged because the application uses the keys to find each string.”

Rewrite: “The translator must translate each value. The translator must leave the keys unchanged. The application uses the keys to find each string.”

Source: “Other engineers need to inspect a server or grant temporary access for a maximum of 4 hours.”

Rewrite: “Other engineers need to inspect a server or grant temporary access. Temporary access has a maximum duration of 4 hours.”
