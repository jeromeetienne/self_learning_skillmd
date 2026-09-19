---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source paragraph in Simplified Technical English.

## Preserve meaning

- Keep every fact, number, condition, warning, limitation, instruction, action, and result.
- Keep the original actor, including the reader, user, operator, administrator, or system.
- Keep the original timing, order, scope, degree, uncertainty, and cause.
- Keep each condition attached to the action or result that depends on it.
- Keep every cause and its effect when the source states both.
- Keep exact values exact and approximate values approximate.
- Do not add facts, explanations, reasons, choices, advice, or recommendations.
- Do not change who performs an action.
- Keep the original order when the order affects the result.

## Sentence structure

- Write no more than 20 words in each sentence.
- Use one main action, condition, or result in each sentence.
- Split long sentences at natural points. Keep the original relationships between sentences.
- Use active voice when the source identifies the actor.
- Do not address the reader directly. Name the reader, user, operator, administrator, or system.
- Use “must” for a required action.
- Use “can” for permission or ability.
- Use “is possible” or equivalent wording when the source expresses possibility.
- Do not use “may”, “might”, or “should”.
- Do not turn a conditional action into a general requirement.
- Do not remove a cause because the result is clear without the cause.

## Words and terms

- Use common words, direct grammar, and simple verbs.
- Use one technical term for one thing throughout the rewrite.
- Prefer “use”, “get”, “run”, and “do” when these words keep the source meaning.
- Do not use informal shortened words. Write “application”, not “app”.
- Write abbreviations in full unless they are exact values that must remain unchanged.
- Expand abbreviations such as “API”, “URL”, “UTC”, “repo”, and “config” when they are ordinary text.
- Write “application programming interface”, “uniform resource locator”, “Coordinated Universal Time”, “repository”, and “configuration” when these meanings apply.
- Keep commands, code names, variable names, header names, file names, paths, quoted values, placeholders, and other exact values unchanged.
- Keep numbers, units, times, symbols, and capitalization unchanged unless the source gives an expanded form.
- Do not replace an exact value with an approximate expression.
- Do not replace an approximate expression with an exact value.
- Do not use vague words that change the source meaning, including “very” and “approximately”.

## Final check

Compare the rewrite with the source.

- Check every fact, number, condition, warning, limitation, instruction, action, and result.
- Check every actor, cause, effect, degree, uncertainty, timing, order, and scope.
- Check that conditional actions remain conditional.
- Check that no new information appears.
- Count the words in every sentence and split sentences longer than 20 words.
- Check that no forbidden word or unexpanded abbreviation remains.
- Check that each technical term has the same meaning throughout.

## Examples

Source: “Before you open a pull request, make sure that all unit tests pass locally and that the linter reports no warnings.”

Rewrite: “Before a pull request is opened, all unit tests must pass locally. The linter must report no warnings.”

Source: “If two users edit the same list at the same time, one user may overwrite the other user's changes without noticing the overwrite.”

Rewrite: “If two users edit the same list at the same time, one user can overwrite the other user's changes without noticing the overwrite.”

Source: “The exact version is required because unexpected minor updates caused the failures.”

Rewrite: “Use the exact version. Unexpected minor updates caused the failures.”

Source: “The service rejects more than about 100 requests per minute.”

Rewrite: “The service rejects more than about 100 requests per minute.”
