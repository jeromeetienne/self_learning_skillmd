---
name: changelog-entry
description: Adds an entry to the CHANGELOG.md file of a repository, in the Keep a Changelog format, under the Unreleased section. Use when the user asks to update CHANGELOG.md or to record a change in the changelog.
---

# Changelog entry

Add one entry to `CHANGELOG.md`.

1. Open `CHANGELOG.md` at the root of the repository. If the file does not exist, create it with the Keep a Changelog header.
2. Find the `## [Unreleased]` section. If the section does not exist, add it above the most recent version.
3. Put the entry under the correct heading: Added, Changed, Deprecated, Removed, Fixed, or Security.
4. Write the entry as one line that starts with a verb in the past tense.
5. Add the pull request number or the issue number at the end of the line when one exists.
