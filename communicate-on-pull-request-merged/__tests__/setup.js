import nock from 'nock';

beforeEach(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();

  delete process.env['INPUT_REPO-TOKEN'];
  delete process.env['INPUT_PR-COMMENT'];
  delete process.env['INPUT_PR-LABEL-TO-ADD'];
  delete process.env['INPUT_PR-LABEL-TO-REMOVE'];
  delete process.env['GITHUB_REPOSITORY'];
  delete process.env['GITHUB_EVENT_PATH'];
});
