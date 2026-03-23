# Git Workflow

## Branch Naming

Format: `<type>/<description>`, e.g., `feat/user-auth`, `fix/login-bug`, `refactor/rename-files`

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Note: Attribution disabled globally via ~/.claude/settings.json.

## Merge Strategy

- Feature branches must be rebased onto target branch before merging: `git rebase <target-branch>`
- Use squash merge to combine all commits into one: `git merge --squash <feature-branch>` (then `git commit`)
- Merge commits are prohibited; keep commit history linear and clean

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary following the PR template (`.github/pull_request_template.md`)
4. Include test plan with TODOs
5. Push with `-u` flag if new branch
6. Wait for Gemini code review, read review comments and fix any issues raised
7. After fixing review comments, resolve the review threads via GitHub GraphQL API (`resolveReviewThread` mutation)

## Feature Implementation Workflow

1. **Plan First**
   - Use **planner** agent to create implementation plan
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach**
   - Use **tdd-guide** agent
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. **Code Review**
   - Use **code-reviewer** agent immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format
