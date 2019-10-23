"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const pullRequestParser = __importStar(require("./pull-request-parser"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (github.context.eventName !== 'release') {
                console.log('The event that triggered this action was not a release, exiting');
                return;
            }
            if (github.context.payload.action !== 'published') {
                console.log('No release was published, exiting');
                return;
            }
            const repoToken = core.getInput('repo-token', { required: true });
            const client = new github.GitHub(repoToken);
            const prNumbers = []; // TODO: Support getting a pull request numbers
            for (let prNumber of prNumbers) {
                yield addCommentToReferencedIssue(client, prNumber);
                yield removeLabel(client, prNumber, core.getInput('pr-label-to-remove'));
                yield addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
function addCommentToReferencedIssue(client, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const pullRequest = yield getPullRequest(client, prNumber);
        const body = pullRequest['body'];
        if (body) {
            const issueNumber = pullRequestParser.getReferencedIssue(github.context.repo.owner, github.context.repo.repo, body);
            if (issueNumber) {
                // TODO: Post a correct message.
                yield addIssueComment(client, issueNumber, 'TODO');
            }
        }
    });
}
function getPullRequest(client, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.pulls.get({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber
        });
    });
}
function addLabels(client, prNumber, labels) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            labels: labels
        });
    });
}
function removeLabel(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.removeLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            name: label
        });
    });
}
function addIssueComment(client, issueNumber, message) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issueNumber,
            body: message
        });
    });
}
run();
