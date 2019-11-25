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
  'resolved'
];

export function getReferencedIssue(
  owner: string,
  repo: string,
  prBody: string
): number | undefined {
  // Searching for issue closing keywords and issue identifier in pull request's description,
  // i.e. `fixes #1234`, `close #444`, `resolved #1`
  var regex = new RegExp(`(${ISSUE_CLOSING_KEYWORDS.join('|')}) #\\d{1,}`, 'i');
  var matched = prBody.match(regex) || [];
  if (matched.length > 0) {
    const issue = matched[0].match(/#\d{1,}/i) || [];
    if (issue.length > 0) {
      const issueNumber = issue[0].replace('#', '');
      return Number(issueNumber);
    }
  }

  // Searching for issue closing keywords and issue URL in pull request's description,
  // i.e. `closes https://github.com/REPOSITORY_OWNER/REPOSITORY_NAME/issues/1234`
  regex = new RegExp(
    `(${ISSUE_CLOSING_KEYWORDS.join(
      '|'
    )}) https:\\/\\/github.com\\/${owner}\\/${repo}\\/issues\\/\\d{1,}`,
    'i'
  );
  matched = prBody.match(regex) || [];
  if (matched.length > 0) {
    const issue = matched[0].split('/').pop();
    if (issue) {
      return Number(issue);
    }
  }

  return undefined;
}
