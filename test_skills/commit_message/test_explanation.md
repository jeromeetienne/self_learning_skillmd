An AI coding agent loads the skill `commit-message`, reads the staged changes of a git repository, and replies with a commit message.
The user message sometimes gives the GitHub issue of the change and whether the change fixes it. The branch name sometimes holds the issue number, such as `fix/15-delete-invalid-index`.
Code checks several house rules on each commit message. The failures below name the rules.
The score is the percentage of rule checks that pass.
