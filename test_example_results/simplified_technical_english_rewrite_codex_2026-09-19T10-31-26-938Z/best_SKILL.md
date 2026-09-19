---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

Follow these rules:

- Keep every fact, number, name, condition, exception, sequence, location, and instruction.
- Add no fact, reason, result, explanation, or recommendation.
- Keep the original certainty and obligation.
- Express permission with “is permitted to” or “is allowed to.”
- Express advice with “is expected to” or another form that does not weaken the advice.
- Express possibility with “can” or “could” when the meaning stays unchanged.
- Preserve every condition introduced by “if,” “when,” “unless,” “before,” or “after.”
- Preserve every alternative path and exception.
- Preserve definite scope. Keep “each,” “every,” “all,” “only,” and “none.”
- Use one main idea per sentence.
- Keep each sentence to 20 words or fewer.
- Split long sentences at natural points. Repeat the subject when needed.
- Keep a cause, limitation, and result in separate sentences when this improves clarity.
- Use active voice when the meaning stays unchanged.
- Do not address the reader directly. Do not use “you,” “your,” or “yourself.”
- Use “the operator,” “the user,” “the system,” or a named component when a subject is required.
- Use simple, precise words.
- Prefer “use” instead of “utilize,” “before” instead of “prior to,” “get” instead of “obtain,” and “make sure” instead of “ensure.”
- Prefer “extra” instead of “additional,” “do” instead of “perform,” and “maximum” instead of “max.”
- Do not use vague intensifiers.
- Do not use “may,” “might,” or “should” in the rewrite. Use precise alternatives that preserve the original meaning.
- Do not use shortened technical terms in ordinary prose. Expand terms such as “API,” “URL,” “JSON,” “SSH,” “repo,” “config,” “dir,” “stdout,” and “etc.”
- Write “application programming interface,” “web address,” “JavaScript Object Notation,” “Secure Shell,” “repository,” “configuration,” “directory,” “standard output,” and “and so on.”
- Write “Coordinated Universal Time” instead of “UTC.”
- Write “morning” or “evening” instead of “a.m.” or “p.m.” when the time remains exact.
- Preserve code identifiers, environment variable names, commands, file names, paths, placeholders, and exact values exactly.
- Do not expand, shorten, or change a literal only because it resembles an abbreviation.
- Keep technical terms when replacing them would reduce precision.
- Keep lists, ordering words, references, and names of pages or files.
- Keep the original scope. Do not make a statement more general or more specific.
- Check the final rewrite for missing facts, changed conditions, changed numbers, changed certainty, changed scope, direct address, shortened terms, refused words, vague words, and sentences longer than 20 words.

Examples:

Source: “If the application programming interface cannot reach the server, check the network settings.”

Rewrite: “If the application programming interface cannot reach the server, check the network settings.”

Source: “Each later file overrides values from earlier files.”

Rewrite: “Each later file overrides values from earlier files.”

Source: “The export feature is very slow because it runs separate queries.”

Rewrite: “The export feature is slow. Separate queries cause the slow export.”

Source: “If the build fails with an out-of-memory error, the operator can increase the Java Virtual Machine maximum heap size with CODEPLACEHOLDER.”

Rewrite: “If the build fails with an out-of-memory error, the operator can increase the Java Virtual Machine maximum heap size. The operator uses CODEPLACEHOLDER.”

Source: “Documents published during the day do not appear in search results until the next morning unless the operator starts a manual rebuild from the administration page.”

Rewrite: “Documents published during the day do not appear in search results until the next morning. The operator can start a manual rebuild from the administration page.”
