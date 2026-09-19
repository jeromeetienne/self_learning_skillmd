///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	HarnessTypes — the harnesses, their fixed models, and the groups of test cases, for every test skill
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The names of the harnesses that a test skill can run. */
export const HARNESS_NAMES = ['claude', 'codex'] as const;

/** The name of one harness that a test skill can run. */
export type HarnessName = typeof HARNESS_NAMES[number];

/** The only model that each harness runs: Claude Code runs only Sonnet, and Codex runs only Luna. */
export const HARNESS_MODEL_NAMES: Record<HarnessName, string> = {
	claude: 'claude-sonnet-5',
	codex: 'gpt-5.6-luna',
};

/** The names of the two groups of test cases. */
export const SPLIT_NAMES = ['optimization', 'final_check'] as const;

/** The name of one group of test cases: `optimization` for the OPRO loop, `final_check` for the final version. */
export type SplitName = typeof SPLIT_NAMES[number];
