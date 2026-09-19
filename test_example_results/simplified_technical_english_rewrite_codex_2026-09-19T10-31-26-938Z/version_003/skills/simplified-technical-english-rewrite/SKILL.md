---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

Apply these rules:

- Preserve every fact, number, name, condition, exception, alternative, sequence, location, and instruction.
- Add no fact, cause, effect, explanation, recommendation, or requirement.
- Preserve the original certainty, permission, possibility, advice, obligation, and optional actions.
- Keep “must,” “can,” “cannot,” “is permitted to,” and similar meanings exact.
- Preserve optional actions such as “can try to,” “if needed,” and “when possible.”
- Preserve every condition introduced by “if,” “when,” “unless,” “before,” or “after.”
- Preserve exceptions. Do not remove an exception when splitting a sentence.
- Preserve exact scope words such as “each,” “every,” “all,” “only,” “none,” and “at least.”
- Preserve alternatives as alternatives. Do not turn two possible options into two required actions.
- Use one main idea per sentence.
- Limit every sentence to 20 words. Count words after writing the rewrite.
- Split long sentences at natural points. Repeat the subject when necessary.
- Keep the condition, action, and result connected by meaning after splitting.
- Use active voice when the meaning stays unchanged.
- Do not address the reader directly. Do not use “you,” “your,” or “yourself.”
- Use “the operator,” “the user,” “the system,” or the named component when a subject is needed.
- Use simple, precise words.
- Prefer “use,” “before,” “about,” “get,” “make sure,” “extra,” “do,” and “maximum.”
- Do not use vague intensifiers or vague quantities.
- Preserve meaningful intensity. Replace “very slow” with “extremely slow” or another precise equivalent; do not reduce it to “slow.”
- Replace “approximately” with “about” when the value remains unchanged.
- Replace “numerous” with “many” when the quantity remains unchanged.
- Do not use shortened technical terms in ordinary prose. Expand terms such as “API,” “URL,” “JSON,” “SSH,” “repo,” “config,” “dir,” “stdout,” and “etc.”
- Use “application programming interface,” “web address,” “JavaScript Object Notation,” “Secure Shell,” “repository,” “configuration,” “directory,” “standard output,” and “and so on.”
- Write “Coordinated Universal Time” instead of “UTC.”
- Write “morning” or “evening” instead of “a.m.” or “p.m.” when the time remains exact.
- Preserve code identifiers, environment variable names, commands, file names, paths, placeholders, and exact values exactly.
- Do not expand, shorten, or change a literal because it resembles an abbreviation.
- Keep technical terms when a simpler replacement would reduce precision.
- Keep lists, ordering words, references, page names, file names, and component names.
- Check the final rewrite for omitted facts, changed conditions, lost exceptions, changed alternatives, changed numbers, changed modality, changed intensity, changed scope, direct address, shortened terms, refused words, and sentences over 20 words.

Examples:

Source: “If the token expires or an administrator revokes it, the user must run the login command again to get a new token.”

Rewrite: “If the token expires, the user must run the login command again. An administrator can also revoke the token. The user must then run the command again.”

Source: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size through JAVA_OPTS.”

Rewrite: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size. The operator uses JAVA_OPTS.”

Source: “Documents published during the day do not appear in search results until the next morning unless the operator starts a manual rebuild from the administration page.”

Rewrite: “Documents published during the day do not appear in search results until the next morning. A manual rebuild can make the documents appear earlier. The operator starts the rebuild from the administration page.”

Source: “The export is very slow because it runs one separate query per task.”

Rewrite: “The export is extremely slow. One separate query per task causes the slow export.”

Source: “The on-call engineer can perform the task or grant temporary access to another engineer.”

Rewrite: “The on-call engineer can perform the task. Alternatively, the on-call engineer can grant temporary access to another engineer.”
