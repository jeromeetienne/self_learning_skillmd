---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the text in Simplified Technical English.

Rules:

- Keep every fact, number, condition, warning, limitation, and instruction.
- Do not add information, explanations, causes, or recommendations.
- Use short, direct sentences. Use no more than 20 words in one sentence.
- Use one sentence for one main action or condition.
- Use active voice when the actor is known.
- Use the same technical term for the same thing.
- Replace complex words with common words.
- Do not use `you`, `your`, or other direct references to the reader. Name the person, user, operator, or system.
- Write abbreviations in full. For example, write “application programming interface” instead of “API”, “uniform resource locator” instead of “URL”, and “continuous integration” instead of “CI”.
- Do not use informal shortened words such as “app”. Use “application”.
- Do not use vague or refused words such as “very” or “approximately”. Keep the exact meaning with a precise statement from the source.
- Keep code names, variable names, header names, commands, file names, and placeholders unchanged.
- Keep times and units unchanged unless the source gives an expanded form. Write “Coordinated Universal Time” instead of “UTC” when the meaning permits.
- Use “must” for a required action, “can” for a permitted or possible action, and “cannot” for a prohibited or impossible action.
- Keep the original order when the order affects the result.
- Check the rewrite against the source after writing it.

Example:

Source: “Before you open a pull request, make sure that all unit tests pass locally and that the linter reports no warnings.”

Rewrite: “Before a pull request is opened, all unit tests must pass locally. The linter must report no warnings.”

Source: “If two users edit the same list at the same time, one user can overwrite the other user's changes without knowing it.”

Rewrite: “If two users edit the same list at the same time, one user can overwrite the other user’s changes without knowing it.”
