---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

Apply these requirements:

- Preserve all facts, numbers, names, conditions, exceptions, alternatives, sequences, locations, limits, and instructions.
- Add no fact, reason, result, explanation, recommendation, or requirement.
- Keep the original meaning, scope, certainty, permission, possibility, advice, obligation, and optional action.
- Keep modal words such as “can,” “could,” “may,” “might,” “should,” and “must” when they express the source meaning.
- Preserve words that show optional action, including “try,” “if needed,” “when possible,” and “as required.”
- Preserve conditions introduced by “if,” “when,” “unless,” “before,” and “after.”
- Preserve exceptions, including exceptions at the end of a sentence.
- Preserve exact scope words such as “each,” “every,” “all,” “only,” “none,” and “at least.”
- Keep alternatives as alternatives. If the source gives one of two possible actions, do not require both actions.
- Use “Alternatively” when separate sentences could otherwise appear to require both alternatives.
- Use one main idea per sentence.
- Keep every sentence at 20 words or fewer. Count the words in the completed rewrite.
- Split long sentences at natural points. Repeat the subject, condition, limitation, and required action when needed.
- When splitting a sentence, keep each condition with the action or result that the condition controls.
- Do not replace an optional instruction with a definite statement.
- Do not replace a cause with a sequence, exception, recommendation, or unrelated statement.
- Use active voice when the meaning remains unchanged.
- Do not address the reader directly. Do not use “you,” “your,” or “yourself.”
- Use “the operator,” “the user,” “the system,” or the named component when a subject is required.
- Use simple, precise words. Prefer “use,” “before,” “about,” “get,” “make sure,” “extra,” “do,” and “maximum.”
- Replace “approximately” with “about” only when the meaning stays unchanged.
- Replace “numerous” with “many” only when the quantity stays unchanged.
- Keep meaningful intensity. Preserve words such as “very,” “extremely,” and “slightly” when they affect the meaning.
- Do not add vague intensifiers or vague quantities.
- Do not use shortened technical terms in ordinary prose. Expand terms such as “API,” “URL,” “JSON,” “SSH,” “repo,” “config,” “dir,” “stdout,” and “etc.”
- Use “application programming interface,” “web address,” “JavaScript Object Notation,” “Secure Shell,” “repository,” “configuration,” “directory,” “standard output,” and “and so on.”
- Write “Coordinated Universal Time” instead of “UTC.”
- Write “morning” or “evening” instead of “a.m.” or “p.m.” when the time remains exact.
- Preserve code identifiers, environment variable names, commands, file names, paths, placeholders, and exact values exactly.
- Do not expand, shorten, translate, or change a literal because it resembles an abbreviation.
- Keep technical terms when a simpler replacement would reduce precision.
- Keep lists, ordering words, references, page names, file names, and component names.
- Keep the original scope. Do not make a statement more general or more specific.

Before returning the rewrite, verify all of the following:

- Every source fact, number, condition, exception, alternative, sequence, location, and instruction remains.
- No cause, result, explanation, recommendation, or requirement was added.
- Modality, optional action, intensity, scope, and certainty remain unchanged.
- No alternative action became an additional required action.
- No sentence has more than 20 words.
- No direct address, refused abbreviation, or new vague word appears.
- Every literal remains unchanged.

Examples:

Source: “If the token expires or an administrator revokes it, the user must run the login command again to get a new token.”

Rewrite: “If the token expires, the user must run the login command again. An administrator can also revoke the token. In that case, the user must run the command again.”

Source: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size through JAVA_OPTS.”

Rewrite: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size. The operator does this through JAVA_OPTS.”

Source: “Documents published during the day do not appear in search results until the next morning unless the operator starts a manual rebuild from the administration page.”

Rewrite: “Documents published during the day do not appear in search results until the next morning. The operator can start a manual rebuild from the administration page. This can make the documents appear earlier.”

Source: “The export is very slow because it runs one separate query per task.”

Rewrite: “The export is very slow. It runs one separate query per task. The separate query causes the slow export.”

Source: “The on-call engineer can perform the task or grant temporary access to another engineer.”

Rewrite: “The on-call engineer can perform the task. Alternatively, the on-call engineer can grant temporary access to another engineer.”
