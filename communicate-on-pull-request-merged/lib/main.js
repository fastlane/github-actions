"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isPullRequest = !!github.context.payload.pull_request;
            if (!isPullRequest) {
                console.log('The event that triggered this action was not a pull request, exiting');
                return;
            }
            if (github.context.payload.action !== 'closed') {
                console.log('No pull request was closed, exiting');
                return;
            }
            const repoToken = core.getInput('repo-token', { required: true });
            const client = new github.GitHub(repoToken);
            const prNumber = github.context.payload.pull_request.number;
            const merged = github.context.payload.pull_request['merged'];
            if (!merged) {
                console.log('No pull request was merged, exiting');
                return;
            }
            const labelToRemove = core.getInput('pr-label-to-remove');
            const canRemoveLabel = yield canRemoveLabelFromIssue(client, prNumber, labelToRemove);
            if (canRemoveLabel) {
                yield removeLabel(client, prNumber, labelToRemove);
            }
            yield addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
            yield addComment(client, prNumber, core.getInput('pr-comment', { required: true }));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
function addComment(client, prNumber, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.pulls.createReview({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber,
            body: comment,
            event: 'COMMENT'
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
function canRemoveLabelFromIssue(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.issues.listLabelsOnIssue({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber
        });
        const issueLabels = response.data;
        for (let issueLabel of issueLabels) {
            if (issueLabel.name === label) {
                return true;
            }
        }
        return false;
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
run();
