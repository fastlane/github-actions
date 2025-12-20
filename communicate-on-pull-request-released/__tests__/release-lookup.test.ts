const nock = require('nock');
const path = require('path');

describe('release lookup via GitHub Releases API', () => {
  it('uses listReleases when version is found and performs all side effects', async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_VERSION'] = '3.0.0';
    process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
    process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_NAME'] = 'workflow_dispatch';
    delete process.env['GITHUB_EVENT_PATH'];

    const releases = [
      {name: '2.9.9 Improvements'},
      {
        name: '3.0.0 Improvements',
        // Keep a single PR reference to avoid triggering extra, unmocked calls
        body: '[action] something (#999) via Bot',
        html_url: 'https://github.com/foo/bar/releases/tag/3.0.0',
        tag_name: '3.0.0'
      }
    ];

    const api = nock('https://api.github.com')
      .get('/repos/foo/bar/releases')
      .query({per_page: 100})
      .reply(200, releases)
      .post(
        '/repos/foo/bar/pulls/999/reviews',
        JSON.stringify({
          body:
            'Congratulations! :tada: This was released as part of [_fastlane_ 3.0.0](https://github.com/foo/bar/releases/tag/3.0.0) :rocket:',
          event: 'COMMENT'
        })
      )
      .reply(200)
      .get('/repos/foo/bar/issues/999/labels')
      .reply(200, [])
      .post(
        '/repos/foo/bar/issues/999/labels',
        JSON.stringify({labels: ['label-to-add']})
      )
      .reply(200)
      .get('/repos/foo/bar/pulls/999')
      .reply(200, {body: 'closes #10'})
      .post(
        '/repos/foo/bar/issues/10/comments',
        JSON.stringify({
          body:
            'The pull request #999 that closed this issue was merged and released as part of [_fastlane_ 3.0.0](https://github.com/foo/bar/releases/tag/3.0.0) :rocket:\nPlease let us know if the functionality works as expected as a reply here. If it does not, please open a new issue. Thanks!'
        })
      )
      .reply(200);

    const main = require('../src/main');
    await main.run();

    expect(api.isDone()).toBeTruthy();
  });

  it('exits early when version is not found in listReleases and no payload fallback is available', async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_VERSION'] = '9.9.9';
    process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
    process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_NAME'] = 'push';
    delete process.env['GITHUB_EVENT_PATH'];

    const releases = [
      {name: '1.0.0 Improvements'},
      {name: '3.0.0 Improvements'}
    ];

    const api = nock('https://api.github.com')
      .get('/repos/foo/bar/releases')
      .query({per_page: 100})
      .reply(200, releases);

    const main = require('../src/main');
    await main.run();

    expect(api.isDone()).toBeTruthy();
  });
});
