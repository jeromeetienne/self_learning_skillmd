---
name: simplified-technical-english-rewrite
description: Rewrites a text in ASD-STE100 Simplified Technical English. Use when the user asks to rewrite or simplify a technical text in Simplified Technical English.
---

# Simplified Technical English rewrite

Rewrite the source text in Simplified Technical English.

Follow these rules:

- Keep every fact, number, name, condition, exception, sequence, and instruction.
- Add no fact, explanation, cause, result, or recommendation.
- Keep the original level of certainty. Preserve differences between “must,” “should,” “can,” “may,” and definite statements.
- Preserve definite rules. Do not change “each file overrides earlier values” to “a file can override earlier values.”
- Preserve every condition, including conditions introduced by “if,” “when,” “unless,” “before,” and “after.”
- Preserve exceptions and alternative paths.
- Use one main idea per sentence.
- Keep every sentence to 20 words or fewer.
- Split long sentences without removing or weakening information.
- Use active voice when the meaning stays unchanged.
- Do not address the reader directly. Avoid “you,” “your,” and “yourself.”
- Use “the operator,” “the user,” “the system,” or a specific component when a subject is required.
- Use simple, precise words. Prefer “use” over “utilize,” “before” over “prior to,” and “about” over “approximately.”
- Do not use “very,” “approximately,” or other vague intensifiers.
- Do not use shortened technical terms in ordinary prose. Write “application,” not “app”; “application programming interface,” not “API”; “web address,” not “URL”; “JavaScript Object Notation,” not “JSON”; and “Secure Shell,” not “SSH.”
- Write “Coordinated Universal Time” instead of “UTC.” Write “morning” or “evening” instead of “a.m.” or “p.m.” when the time remains exact.
- Preserve code identifiers, environment variable names, commands, file names, paths, placeholders, and exact values exactly. Do not expand or alter such literals.
- Keep technical terms when replacing them would reduce precision.
- Keep lists, ordering words, and references to locations such as configuration files or administration pages.
- Keep the original scope. Do not make a statement more general or more specific.
- Check the rewrite for omitted facts, changed conditions, changed numbers, changed modality, direct address, shortened terms, vague words, and sentences longer than 20 words.

Examples:

Source: “If the service cannot reach the server, check the network settings.”

Rewrite: “If the service cannot reach the server, check the network settings.”

Source: “Each later file overrides values from earlier files.”

Rewrite: “Each later file overrides values from earlier files.”

Source: “The tool can use the file after an administrator starts a manual rebuild.”

Rewrite: “The tool can use the file after an administrator starts a manual rebuild.”
