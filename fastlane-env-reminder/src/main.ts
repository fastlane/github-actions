import * as core from '@actions/core';
import * as github from '@actions/github';
import fetch from 'node-fetch';

export async function run() {
  try {
    const context = github.context;

    const isIssue: boolean = !!context.payload.issue;
    if (!isIssue) {
      console.log('The event that triggered this action was not an issue, exiting');
      return;
    }

    if (context.payload.action !== 'opened') {
      console.log('No issue was opened, exiting');
      return;
    }

    const issueBody = context.payload.issue!.body;
    if (issueBody == null) {
      console.log('The issue body is empty, exiting');
      return;
    }

    if (issueBody.includes('Loaded fastlane plugins')) {
      console.log('`fastlane env` was already provided, exiting');
      return;
    }

    if (issueBody.includes('### Feature Request')) {
      console.log('The issue is a feature request, exiting');
      return;
    }

    const issueMessage = core.getInput('issue-message');
    const repoToken = core.getInput('repo-token', {required: true});
    const issue: {owner: string; repo: string; number: number} = context.issue;
    const client = github.getOctokit(repoToken, {request: {fetch}});
    await client.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: issueMessage
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
    return;
  }
}

run();
