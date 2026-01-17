// Issue closing keywords: https://help.github.com/en/articles/closing-issues-using-keywords
let ISSUE_CLOSING_KEYWORDS = [
  'close',
  'closes',
  'closed',
  'fix',
  'fixes',
  'fixed',
  'resolve',
  'resolves',
  'resolved',
  'fixed:',
  'fixes:',
  'fix:'
];

export function getReferencedIssue(owner: string, repo: string, prBody: string): number[] {
  if (!prBody || prBody.trim() === '') {
    return [];
  }

  let issueNumbers: number[] = [];

  // Searching for issue closing keywords and issue identifier in pull request's description,
  // i.e. `fixes #1234`, `close #444`, `resolved #1`
  let regex = new RegExp(`(${ISSUE_CLOSING_KEYWORDS.join('|')}) #\\d{1,}`, 'gi');
  let matched = prBody.match(regex);
  if (matched && matched.length > 0) {
    matched.forEach(match => {
      const issueMatch = match.match(/#\d{1,}/i);
      if (issueMatch && issueMatch.length > 0) {
        const issueNumber = issueMatch[0].replace('#', '');
        issueNumbers.push(Number(issueNumber));
      }
    });
  }

  // Searching for issue closing keywords and issue URL in pull request's description,
  // i.e. `closes https://github.com/REPOSITORY_OWNER/REPOSITORY_NAME/issues/1234`
  regex = new RegExp(
    `(${ISSUE_CLOSING_KEYWORDS.join('|')}) https:\\/\\/github.com\\/${owner}\\/${repo}\\/issues\\/\\d{1,}`,
    'gi'
  );
  matched = prBody.match(regex);
  if (matched && matched.length > 0) {
    matched.forEach(match => {
      const issue = match.split('/').pop();
      if (issue) {
        issueNumbers.push(Number(issue));
      }
    });
  }

  return [...new Set(issueNumbers)];
}
