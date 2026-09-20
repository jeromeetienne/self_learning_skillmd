An AI coding agent sees the name and the description of each skill, and chooses the skill to load for each user message, or no skill.
The skill `release-notes` writes release notes for the people who use a product, from the commits between two versions.
Four other skills compete with it, and their descriptions do not change:
- `changelog-entry`: adds an entry to the CHANGELOG.md file, under the Unreleased section.
- `pull-request-description`: writes the title and the description of a pull request.
- `announcement-post`: writes a short public social media post that announces a launch.
- `migration-guide`: writes an upgrade guide for a breaking change.
The score is the percentage of user messages for which the agent chooses the expected skill: `release-notes` for its messages, and never `release-notes` for the other messages.
