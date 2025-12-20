const path = require('path');
const nock = require('nock');

describe('action test suite', () => {
  const validScenarios = [
    {
      response: 'release.json',
      event_name: 'release'
    }
  ];

  for (const scenario of validScenarios) {
    it(`It posts a comment on pull requests, referenced issues and update labels for (${scenario.response})`, async () => {
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
      process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_EVENT_NAME'] = scenario.event_name;
      process.env['GITHUB_EVENT_PATH'] = path.join(
        __dirname,
        scenario.response
      );

      const api = nock('https://api.github.com')
        .persist()
        .post(
          '/repos/foo/bar/pulls/999/reviews',
          '{"body":"Congratulations! :tada: This was released as part of [_fastlane_ 2.134.1](https://github.com/Codertocat/Hello-World/runs/128620228) :rocket:","event":"COMMENT"}'
        )
        .reply(200)
        .get('/repos/foo/bar/issues/999/labels')
        .reply(200, JSON.parse('[]'))
        .post('/repos/foo/bar/issues/999/labels', '{"labels":["label-to-add"]}')
        .reply(200)
        .get('/repos/foo/bar/pulls/999')
        .reply(200, JSON.parse('{"body":"closes #10"}'))
        .post(
          '/repos/foo/bar/issues/10/comments',
          '{"body":"The pull request #999 that closed this issue was merged and released as part of [_fastlane_ 2.134.1](https://github.com/Codertocat/Hello-World/runs/128620228) :rocket:\\nPlease let us know if the functionality works as expected as a reply here. If it does not, please open a new issue. Thanks!"}'
        )
        .reply(200);

      const main = require('../src/main');
      await main.run();

      expect(api.isDone()).toBeTruthy();
    });
  }
});

describe('action test suite', () => {
  const invalidScenarios = [
    {
      response: 'pull-request-closed.json'
    },
    {
      response: 'action-created.json'
    },
    {
      response: 'release-missing-pr-numbers.json',
      event_name: 'release'
    }
  ];

  for (const scenario of invalidScenarios) {
    it(`It does not post a comment on pull requests, referenced issues and does not update labels for (${scenario.response})`, async () => {
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
      process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_EVENT_PATH'] = path.join(
        __dirname,
        scenario.response
      );
      process.env['GITHUB_EVENT_NAME'] = scenario.event_name;

      const api = nock('https://api.github.com')
        .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
        .reply(200);

      const main = require('../src/main');
      await main.run();

      expect(api.isDone()).not.toBeTruthy();
    });
  }
});
