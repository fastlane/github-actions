// Matches:
//  (#8324)
//  (#8324,#8325)
//  (#8324, #8325)
//  (#8324,#8325,#8326)
//  (#8324, #8325, #8326)
//  etc.
export function getReferencedPullRequests(releaseBody: string): number[] {
  const lines = releaseBody.split('\n');
  let pullRequestNumbers: number[] = [];
  lines.forEach(line => {
    const regex = /\((#\d+(?:,\s*#\d+)*)\)/;
    const matches = line.match(regex) || [];
    if (matches.length >= 2) {
      const rawPullRequestNumbers = matches[1].split(/,\s*/) || [];
      var numbers = rawPullRequestNumbers.map(rawNumber => Number(rawNumber.replace('#', '')));
      pullRequestNumbers.push(...numbers);
    }
  });
  return [...new Set(pullRequestNumbers)];
}
