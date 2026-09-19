---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

Preserve the source exactly in meaning:

- Keep every fact, number, name, condition, exception, alternative, sequence, limit, location, and instruction.
- Add no fact, cause, effect, explanation, recommendation, or requirement.
- Keep the original certainty, permission, possibility, advice, obligation, and optional action.
- Preserve modal words such as “can,” “could,” “may,” “might,” “should,” and “must” when they carry the source meaning.
- Preserve words such as “try,” “if needed,” “when possible,” and “as required.”
- Keep conditions introduced by “if,” “when,” “unless,” “before,” and “after.”
- Keep exceptions, including exceptions at the end of a sentence.
- Keep exact scope words such as “each,” “every,” “all,” “only,” “none,” and “at least.”
- Keep alternatives as alternatives. Do not turn one permitted option into two required actions.
- Use “Alternatively” when separate sentences could make alternative actions appear cumulative.
- Keep causes, limitations, and effects. If splitting them, state every relationship explicitly.
- Keep meaningful intensity, including “very,” “extremely,” and “slightly.”
- Keep the original scope. Do not make a statement broader or narrower.

Write the rewrite clearly:

- Put one main idea in each sentence.
- Keep every sentence at 20 words or fewer.
- Split long sentences at natural points.
- When splitting, repeat the subject, condition, limitation, action, or result when necessary.
- Keep a condition beside the action or result that the condition controls.
- Use active voice when the meaning remains unchanged.
- Do not address the reader directly. Do not use “you,” “your,” or “yourself.”
- Use “the operator,” “the user,” “the system,” or the named component when a subject is needed.
- Use simple, precise words. Prefer “use,” “before,” “about,” “get,” “make sure,” “extra,” “do,” and “maximum.”
- Replace “approximately” with “about” only when the meaning stays unchanged.
- Replace “numerous” with “many” only when the quantity stays unchanged.
- Do not add vague intensifiers or vague quantities.
- Do not use shortened technical terms in ordinary prose. Expand terms such as “API,” “URL,” “JSON,” “SSH,” “repo,” “config,” “dir,” “stdout,” and “etc.”
- Use “application programming interface,” “web address,” “JavaScript Object Notation,” “Secure Shell,” “repository,” “configuration,” “directory,” “standard output,” and “and so on.”
- Write “Coordinated Universal Time” instead of “UTC.”
- Write “morning” or “evening” instead of “a.m.” or “p.m.” when the time remains exact.
- Preserve code identifiers, environment variable names, commands, file names, paths, placeholders, and exact values character for character.
- Do not expand, shorten, translate, or change a literal because it resembles an abbreviation.
- Keep technical terms when a simpler word would reduce precision.
- Keep lists, ordering words, page names, file names, and component names.

Before returning the rewrite, check every sentence for length. Then compare the rewrite with the source for omitted facts, changed conditions, lost exceptions, changed alternatives, changed numbers, changed modality, changed intensity, changed scope, direct address, shortened terms, vague words, and altered literals.

Examples:

Source: “If the token expires or an administrator revokes it, the user must run the login command again to get a new token.”

Rewrite: “If the token expires, the user must run the login command again. An administrator can also revoke the token. The user must then run the command again.”

Source: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size through JAVA_OPTS.”

Rewrite: “If the build fails with an out-of-memory error, the operator can try to increase the Java Virtual Machine maximum heap size. The operator can do this through JAVA_OPTS.”

Source: “Documents published during the day do not appear in search results until the next morning unless the operator starts a manual rebuild from the administration page.”

Rewrite: “Documents published during the day do not appear in search results until the next morning. Unless this delay is acceptable, the operator can start a manual rebuild from the administration page. The rebuild can make the documents appear earlier.”

Source: “The export is very slow because it runs one separate query per task.”

Rewrite: “The export is very slow. One separate query per task causes the slow export.”

Source: “The on-call engineer can perform the task or grant temporary access to another engineer.”

Rewrite: “The on-call engineer can perform the task. Alternatively, the on-call engineer can grant temporary access to another engineer.”
