import {getReferencedPullRequests} from '../src/release-parser.js';

describe('release parser test suite', () => {
  const validScenarios = [
    {
      releaseBody: '[action] cocoapods changes (#15490) via XYZ\n[fastlane] revert (#15399, #15407) via ZYX',
      issues: [15490, 15399, 15407]
    },
    {
      releaseBody: '[action] title (#1) via XYZ\n[action] title (#2) via XYZ',
      issues: [1, 2]
    },
    {
      releaseBody: '[action] title (#999) via XYZ',
      issues: [999]
    }
  ];

  const invalidScenarios = [
    {
      releaseBody: 'The description does not contain pull requests references'
    },
    {
      releaseBody: ''
    },
    {
      releaseBody: 'Incorrect syntax reference: # 999, 1100'
    }
  ];

  for (const scenario of validScenarios) {
    it(`It detects the list of pull requests for (${scenario.releaseBody})`, async () => {
      const pullRequests = getReferencedPullRequests(scenario.releaseBody);
      expect(pullRequests).toEqual(scenario.issues);
    });
  }

  for (const scenario of invalidScenarios) {
    it(`It does not detect the list of pull requests for (${scenario.releaseBody})`, async () => {
      const pullRequests = getReferencedPullRequests(scenario.releaseBody);
      expect(pullRequests.length).toBe(0);
    });
  }
});
