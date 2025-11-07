# Contributing to the D&D Compendium

Thank you for your interest in contributing to our D&D campaign compendium! This guide explains how you can suggest edits and improvements.

## Two Ways to Contribute

### 1. Suggest an Edit (No Login Required)

The easiest way to contribute! On any character, location, group, or asset page, you'll see a **"Suggest an Edit"** button at the top.

**How it works:**

1. Click the "Suggest an Edit" button
2. Fill out the form with your suggested changes
3. Submit
4. Your suggestion is automatically submitted as a pull request for review
5. The maintainers will review and merge if appropriate

**What you can edit:**
- ✅ Character pages
- ✅ Location pages  
- ✅ Group/faction pages
- ✅ Assets and resources

**What you cannot edit:**
- ❌ Journal entries (these are private session notes)
- ❌ TODO lists
- ❌ Private notes
- ❌ Templates

**Tips for good suggestions:**
- Be specific about what you're changing and why
- Keep edits focused on a single topic
- If fixing a typo, you can leave the "content" field blank and just describe it
- If adding/updating content, paste or type the new version in the content field

**Moderation:**
All suggestions go through a review process before being published. The maintainers will:
- Review your changes for accuracy
- Check that they fit the campaign lore
- Merge if appropriate or provide feedback

**Rate limits:**
To prevent spam, you can submit up to 5 suggestions per hour. If you need to make many changes, consider using the GitHub method below.

### 2. Edit on GitHub (Login Required)

If you have a GitHub account, you can edit files directly using GitHub's web editor.

**How it works:**

1. Click the "Edit on GitHub" button on any page
2. Log in to GitHub (if not already logged in)
3. Make your changes in the editor
4. GitHub will automatically fork the repository if you're not a collaborator
5. Submit a pull request with your changes

**Advantages:**
- No rate limits
- Full access to GitHub's editing features (preview, syntax highlighting, etc.)
- Can make multiple edits in a single PR
- Easier for complex changes

**For collaborators:**
If you're a repository collaborator, you can commit directly to branches and create pull requests without forking.

## Contribution Guidelines

### Content Guidelines

**Characters:**
- Include basic info: race, class, affiliations
- Add a brief description of the character's role
- Link to related locations, groups, or other characters
- Use the `#wiki` tag to publish

**Locations:**
- Describe the setting and atmosphere
- Note important NPCs or factions present
- Include navigation links to parent/child locations
- Use the `#wiki` tag to publish

**Groups/Factions:**
- Explain the group's purpose and goals
- List key members with links to their pages
- Describe relationships with other factions
- Use the `#wiki` tag to publish

### Formatting Guidelines

**Markdown basics:**
```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

- Bullet point
- Another point

1. Numbered list
2. Second item

[Link text](https://example.com)
```

**Linking to other pages:**
Use double brackets for internal links:
```markdown
[[Character Name]]
[[Location Name]]
```

**Images:**
```markdown
![[image-filename.png]]
```

**Info boxes:**
Use the `<block>` tag for character/location info:
```markdown
<block>
![[character-image.png]]
Race: Half-Elf
Class: Wizard
Affiliation: [[Enchanters' Guild]]
</block>
```

### Publishing Content

To publish a page, add the `#wiki` tag:

```markdown
# My Character

Character description here...

#wiki
```

Without the `#wiki` tag, the page won't be published to the website.

## What Happens After You Submit

1. **Automatic Pull Request**: Your submission creates a PR in GitHub
2. **Review**: Maintainers review your changes
3. **Feedback**: If needed, maintainers may ask questions or request changes
4. **Merge**: Once approved, changes are merged to the main branch
5. **Publish**: The website automatically rebuilds and your changes go live (usually within 2-5 minutes)

## Getting Help

**Questions about the campaign lore?**
- Check existing pages for similar content
- Ask in the pull request comments

**Technical issues?**
- "Suggest an Edit" button not appearing? Make sure you're on an editable page
- Form not submitting? Check your internet connection and try again
- Still having issues? Open an issue on GitHub

**Want to contribute more?**
If you'd like to become a regular contributor:
1. Make a few successful contributions
2. Reach out to the repository owner
3. You may be invited as a collaborator

## Code of Conduct

- Be respectful and constructive
- Focus on improving the compendium
- Don't submit spam or irrelevant content
- Respect the campaign's established lore
- Keep discussions on-topic

## Privacy

**Anonymous submissions:**
- We collect: your suggested changes, optional name, IP address (for rate limiting)
- We don't collect: email, personal info beyond what you choose to include
- Your GitHub username appears on the PR if you use "Edit on GitHub"

**Data retention:**
- Submitted content becomes part of the public repository
- Pull requests are publicly visible on GitHub
- Rate limit data is kept for 2 hours then deleted

## Thank You!

Your contributions help make this compendium better for everyone. Whether you're fixing a typo or adding rich lore details, we appreciate your help! 🎲
