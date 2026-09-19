---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

Follow these rules:

- Preserve every fact, number, name, condition, exception, alternative, sequence, location, and instruction.
- Add no fact, cause, effect, explanation, recommendation, or requirement.
- Preserve the original certainty, permission, possibility, advice, obligation, and optional action.
- Keep modal meanings exact. Do not change “may,” “might,” “should,” “can,” or “must” to another level of certainty.
- Preserve words such as “try,” “if needed,” “when possible,” and “as required.”
- Preserve every condition introduced by “if,” “when,” “unless,” “before,” or “after.”
- Preserve every exception, including exceptions at the end of a sentence.
- Preserve exact scope words such as “each,” “every,” “all,” “only,” “none,” and “at least.”
- Preserve alternatives as alternatives. Use “Alternatively” when separating alternative actions.
- Use one main idea per sentence.
- Keep every sentence to 20 words or fewer. Count the words after writing the rewrite.
- Split long sentences at natural points. Repeat the subject when needed.
- Keep related conditions, actions, limitations, causes, and results connected by meaning after splitting.
- Use active voice when the meaning stays unchanged.
- Do not address the reader directly. Do not use “you,” “your,” or “yourself.”
- Use “the operator,” “the user,” “the system,” or the named component when a subject is required.
- Use simple, precise words.
- Prefer “use,” “before,” “about,” “get,” “make sure,” “extra,” “do,” and “maximum.”
- Replace “approximately” with “about” only when the meaning stays unchanged.
- Replace “numerous” with “many” only when the quantity stays unchanged.
- Preserve meaningful intensity. Do not remove words such as “very,” “extremely,” or “slightly.”
- Do not use vague intensifiers or vague quantities that were not in the source.
- Do not use shortened technical terms in ordinary prose. Expand “API,” “URL,” “JSON,” “SSH,” “repo,” “config,” “dir,” “stdout,” “etc.,” and similar terms.
- Use “application programming interface,” “web address,” “JavaScript Object Notation,” “Secure Shell,” “repository,” “configuration,” “directory,” “standard output,” and “and so on.”
- Write “Coordinated Universal Time” instead of “UTC.”
- Write “morning” or “evening” instead of “a.m.” or “p.m.” when the time remains exact.
- Preserve code identifiers, environment variable names, commands, file names, paths, placeholders, and exact values exactly.
- Do not expand, shorten, translate, or change a literal because it resembles an abbreviation.
- Keep technical terms when a simpler replacement would reduce precision.
- Keep lists, ordering words, page names, file names, and component names.
- Keep the original scope. Do not make a statement more general or more specific.
- Check the final rewrite for omitted information, changed conditions, lost exceptions, changed alternatives, changed numbers, changed modality, changed intensity, changed scope, direct address, shortened terms, refused words, and sentences over 20 words.

Examples:

Source: “If the token expires or an administrator revokes it, the user must run the login command again to get a new token.”

Rewrite: “If the token expires, the user must run the login command again. An administrator can also revoke the token. The user must then run the command again.”

Source: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size through JAVA_OPTS.”

Rewrite: “If the build fails with an out-of-memory error, the operator can try to increase the heap size. The operator uses JAVA_OPTS.”

Source: “Documents published during the day do not appear in search results until the next morning unless the operator starts a manual rebuild from the administration page.”

Rewrite: “Documents published during the day do not appear in search results until the next morning. The exception is a manual rebuild from the administration page.”

Source: “The export is very slow because it runs one separate query per task.”

Rewrite: “The export is very slow. One separate query per task causes the slow export.”

Source: “The on-call engineer can perform the task or grant temporary access to another engineer.”

Rewrite: “The on-call engineer can perform the task. Alternatively, the on-call engineer can grant temporary access to another engineer.”
