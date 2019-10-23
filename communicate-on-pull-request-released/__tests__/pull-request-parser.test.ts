const validScenarios = [
  {
    prBody: 'The description. Close #444.',
    issueNumber: 444,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'closed #444',
    issueNumber: 444,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'Fix #444.',
    issueNumber: 444,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This pull request fixes #444',
    issueNumber: 444,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This PR fixed #1234',
    issueNumber: 1234,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This pull request resolve #444.',
    issueNumber: 444,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'It resolves #1.',
    issueNumber: 1,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'resolved #33.',
    issueNumber: 33,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This pull request closes #1234.',
    issueNumber: 1234,
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This pull request closes https://github.com/foo/bar/issues/10',
    issueNumber: 10,
    owner: 'foo',
    repo: 'bar'
  }
];

const invalidScenarios = [
  {
    prBody: 'This description does not contain referenced issue.',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'unsupported closing keyword #4444',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: '#4444',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'closes # 4444',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'fixes #abc',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'resolve 1234',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This pull request closes http://github.com/foo/bar/issues/10',
    owner: 'foo',
    repo: 'bar'
  },
  {
    prBody: 'This pull request closes https://github.com/foo/bar/issues/10',
    owner: 'foo',
    repo: 'foo'
  }
];

describe('referenced issue detector from a pull request test suite', () => {
  for (const scenario of validScenarios) {
    const parser = require('../src/pull-request-parser');
    it(`It detects referenced issue for (${scenario.prBody})`, async () => {
      expect(
        parser.getReferencedIssue(
          scenario.owner,
          scenario.repo,
          scenario.prBody
        )
      ).toEqual(scenario.issueNumber);
    });
  }

  for (const scenario of invalidScenarios) {
    it(`It does not detect referenced issue for (${scenario.prBody})`, async () => {
      const parser = require('../src/pull-request-parser');
      expect(
        parser.getReferencedIssue(
          scenario.owner,
          scenario.repo,
          scenario.prBody
        )
      ).toBeUndefined();
    });
  }
});
