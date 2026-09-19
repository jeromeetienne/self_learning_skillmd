import type { SkillPartName } from './opro_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproSkillFile — reads and replaces the description or the body of a SKILL.md file
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** A `SKILL.md` file: the frontmatter between two `---` lines, then the body. */
const SKILL_FILE_REG_EXP = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

/** The maximum number of characters of a description, from the Agent Skills specification. */
const DESCRIPTION_MAXIMUM_LENGTH = 1024;

/** Reads and replaces the part of a `SKILL.md` file that the OPRO loop improves. */
export class OproSkillFile {
	/**
	 * Reads one part of a `SKILL.md` file.
	 *
	 * @param skillText The text of the `SKILL.md` file.
	 * @param skillPartName The part to read.
	 * @returns The text of the part, without the quotes of a quoted description.
	 */
	static readPart(skillText: string, skillPartName: SkillPartName): string {
		const { frontmatterText, bodyText } = OproSkillFile._split(skillText);
		if (skillPartName === 'body') {
			return bodyText.trim();
		}
		const descriptionMatch = /^description:\s*(.*)$/m.exec(frontmatterText);
		if (descriptionMatch === null) {
			throw new Error('the SKILL.md file has no description');
		}
		const descriptionText = (descriptionMatch[1] ?? '').trim();
		if (descriptionText.startsWith('"') === true) {
			return JSON.parse(descriptionText) as string;
		}
		return descriptionText;
	}

	/**
	 * Replaces one part of a `SKILL.md` file. A description is written as one line in double quotes, so that a colon
	 * in the description never breaks the YAML of the frontmatter.
	 *
	 * @param skillText The text of the `SKILL.md` file.
	 * @param skillPartName The part to replace.
	 * @param partText The new text of the part.
	 * @returns The text of the new `SKILL.md` file.
	 */
	static replacePart(skillText: string, skillPartName: SkillPartName, partText: string): string {
		const { frontmatterText, bodyText } = OproSkillFile._split(skillText);
		if (skillPartName === 'body') {
			return `---\n${frontmatterText}\n---\n\n${partText.trim()}\n`;
		}
		const descriptionText = partText.replace(/\s+/g, ' ').trim().slice(0, DESCRIPTION_MAXIMUM_LENGTH);
		const newFrontmatterText = frontmatterText.replace(/^description:.*$/m, () => {
			return `description: ${JSON.stringify(descriptionText)}`;
		});
		return `---\n${newFrontmatterText}\n---\n${bodyText}`;
	}

	/**
	 * Cleans the answer of the proposer: the text between `<new_version>` and `</new_version>`, or else the content of
	 * the first fenced code block, or else the whole answer. A frontmatter that the proposer added to a body, and a
	 * `description:` key that it added to a description, are removed.
	 *
	 * @param finalText The answer of the proposer.
	 * @param skillPartName The part that the proposer wrote.
	 * @returns The text of the part.
	 */
	static readProposedPart(finalText: string, skillPartName: SkillPartName): string {
		const tagMatch = /<new_version>([\s\S]*?)<\/new_version>/.exec(finalText);
		const fenceMatch = /```[^\n]*\n([\s\S]*?)\n```/.exec(finalText);
		let partText = finalText;
		if (tagMatch !== null) {
			partText = tagMatch[1] ?? '';
		} else if (fenceMatch !== null) {
			partText = fenceMatch[1] ?? '';
		}
		partText = partText.trim();
		if (skillPartName === 'body') {
			const skillMatch = SKILL_FILE_REG_EXP.exec(partText);
			if (skillMatch !== null) {
				partText = (skillMatch[2] ?? '').trim();
			}
			return partText;
		}
		partText = partText.replace(/^description:\s*/, '');
		if (partText.startsWith('"') === true && partText.endsWith('"') === true) {
			try {
				partText = JSON.parse(partText) as string;
			} catch {
				partText = partText.slice(1, -1);
			}
		}
		return partText.trim();
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Splits a `SKILL.md` file into its frontmatter and its body.
	 *
	 * @param skillText The text of the `SKILL.md` file.
	 * @returns The frontmatter, without the `---` lines, and the body.
	 */
	static _split(skillText: string): {
		frontmatterText: string,
		bodyText: string,
	} {
		const skillMatch = SKILL_FILE_REG_EXP.exec(skillText);
		if (skillMatch === null) {
			throw new Error('the SKILL.md file has no frontmatter between two --- lines');
		}
		return {
			frontmatterText: skillMatch[1] ?? '',
			bodyText: skillMatch[2] ?? '',
		};
	}
}
