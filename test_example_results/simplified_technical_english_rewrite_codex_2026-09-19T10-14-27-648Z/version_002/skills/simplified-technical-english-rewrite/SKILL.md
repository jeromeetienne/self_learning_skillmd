---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

## Meaning

- Keep every fact, number, condition, warning, limitation, and instruction.
- Keep the original meaning, including degree, uncertainty, timing, order, and scope.
- Do not add facts, causes, explanations, choices, or recommendations.
- Keep every condition attached to the correct action. Do not turn a conditional action into a general requirement.
- Keep cause and effect. State the cause and the resulting effect when the source states both.
- Keep words that show degree. For example, preserve “very slow” with wording that shows the same high degree.
- Keep approximate values approximate. Do not change “more than about 100” to “more than 100”.
- Keep the original order when order affects the result.

## Sentences

- Use sentences with no more than 20 words.
- Use one sentence for one main action, condition, or result.
- Split long conditional sentences into separate sentences when this preserves the relationship.
- Use active voice when the actor is known.
- Name the person, operator, administrator, user, or system. Do not address the reader directly.
- Use “must” for a required action.
- Use “can” for permission or ability.
- Use “may” only when the source expresses possibility or uncertainty.
- Use “cannot” for a prohibited or impossible action.

## Words

- Use common words and direct grammar.
- Use one technical term for one thing throughout the rewrite.
- Replace complex words with simple words when the meaning stays the same.
- Prefer “get” to “obtain”, “more” to “additional”, and “runs” or “does” to “performs”.
- Do not use vague words that change the meaning, such as “approximately” when the source gives an exact value.
- Do not use informal shortened words. Write “application”, not “app”.
- Write abbreviations in full when the abbreviation is not part of a code name.
- Write “JavaScript Object Notation” for JSON, “standard output” for stdout, “minutes” for min, “ante meridiem” for a.m., and “administrator” for admin when the meaning permits.
- Keep commands, code names, variable names, header names, file names, paths, placeholders, and quoted values unchanged.
- Keep numbers, units, times, and symbols unchanged unless the source gives an expanded form.
- Do not change a unit or time expression while expanding an abbreviation.

## Final check

After writing, compare the rewrite with the source.

- Confirm that every fact, number, condition, warning, limitation, and instruction remains.
- Confirm that every cause, result, degree, uncertainty, and approximate value remains.
- Confirm that no new information appears.
- Confirm that every sentence has 20 words or fewer.
- Confirm that no forbidden abbreviation or vague word appears.

## Examples

Source: “If the token expires or an administrator revokes the token, the user must run the login command again to obtain a new token.”

Rewrite: “If the token expires, the user must run the login command again. The user gets a new token.”

Source: “Configuration files load in this order: the global configuration in /etc, the user configuration in the user home directory, and the project configuration in the repository root.”

Rewrite: “Configuration files load in this order. First, the global configuration in /etc loads. Next, the user configuration loads. Last, the project configuration loads.”

Source: “If the build fails because of an out-of-memory error, the JAVA_OPTS environment variable can increase the Java Virtual Machine maximum heap size.”

Rewrite: “If an out-of-memory error stops the build, JAVA_OPTS can increase the Java Virtual Machine maximum heap size.”

Source: “The service rejects more than about 100 requests per minute.”

Rewrite: “The service rejects more than about 100 requests per minute.”

Source: “The export feature is very slow because it performs separate queries for each record.”

Rewrite: “The export feature has a very long run time. Separate queries for each record cause the long run time.”

Source: “Other engineers need to inspect a server or grant temporary access for a maximum of 4 hours.”

Rewrite: “Other engineers must ask the on-call engineer for help. They must do this to inspect a server or grant temporary access. Temporary access can last for a maximum of 4 hours.”
