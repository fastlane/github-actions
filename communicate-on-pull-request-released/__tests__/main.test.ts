const path = require('path');
const nock = require('nock');

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

describe('action test suite', () => {
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
        .persist()
        .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
        .reply(200)
        .delete('repos/foo/bar/issues/20/labels/label-to-remove')
        .reply(200);

      const main = require('../src/main');
      await main.run();

      expect(api.isDone()).not.toBeTruthy();
    });
  }
});
