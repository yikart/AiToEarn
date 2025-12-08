# CONTRIBUTING

So you're looking to contribute to AiToEarn - that's awesome! We can't wait to see what you do. We have grand ambitions to build the best platform for AI-driven earning. Any help from the community counts, truly.

We need to be nimble and ship fast, but we also want to make sure that contributors like you get as smooth an experience as possible. We've assembled this contribution guide for that purpose, aiming at getting you familiarized with the codebase & how we work with contributors, so you could quickly jump to the fun part.

This guide is a constant work in progress. We highly appreciate your understanding if at times it lags behind the actual project, and welcome any feedback for us to improve.

## Before you jump in

Looking for something to tackle? Browse our [issues](https://github.com/AiToEarn/AiToEarn/issues) and pick one to get started!

### Recruitment

Issues with titles containing **【招聘】** are our recruitment tasks. If you want to join our team, please submit a PR linked to such an issue.

Join the fun, contribute, and let's build something awesome together! 💡✨

Don't forget to link an existing issue or open a new issue in the PR's description.

### Bug reports

> [!IMPORTANT]
> Please make sure to include the following information when submitting a bug report:

- A clear and descriptive title
- A detailed description of the bug, including any error messages
- Steps to reproduce the bug
- Expected behavior
- **Logs**, if available (really important for backend issues)
- Screenshots or videos, if applicable

How we prioritize:

| Issue Type | Priority |
| ------------------------------------------------------------ | --------------- |
| Bugs in core functions (cannot login, applications not working, security loopholes) | Critical |
| Non-critical bugs, performance boosts | Medium Priority |
| Minor fixes (typos, confusing but working UI) | Low Priority |

### Feature requests

> [!NOTE]
> Please make sure to include the following information when submitting a feature request:

- A clear and descriptive title
- A detailed description of the feature
- A use case for the feature
- Any other context or screenshots about the feature request

How we prioritize:

| Feature Type | Priority |
| ------------------------------------------------------------ | --------------- |
| High-Priority Features as being labeled by a team member | High Priority |
| Popular feature requests from our community | Medium Priority |
| Non-core features and minor enhancements | Low Priority |
| Valuable but not immediate | Future-Feature |

## Development Environment Setup

1. Fork the project to your own GitHub account
2. Create a feature branch:
  ```bash
  git checkout -b feature/your-feature-name
  ```
3. Commit your changes:
  ```bash
  git add .
  git commit -m "feat: add new feature"
  ```
4. Push to your forked repository:
  ```bash
  git push origin feature/your-feature-name
  ```
5. Create a Pull Request on GitHub

## Submitting your PR

### Pull Request Process

1. Fork the repository
2. Before you draft a PR, please create an issue to discuss the changes you want to make
3. Create a new branch for your changes
4. Please add tests for your changes accordingly
5. Ensure your code passes the existing tests
6. Please link the issue in the PR description, `fixes #<issue_number>`
7. Get merged!

### Setup the project

#### Backend

For setting up the backend service, kindly refer to our detailed instructions in [project/backend/DEVELOPER_GUIDE.md](./project/backend/DEVELOPER_GUIDE.md). This document contains step-by-step guidance to help you get the backend up and running smoothly.

#### Other things to note

We recommend reviewing these documents carefully before proceeding with the setup.

## Getting Help

If you ever get stuck or get a burning question while contributing, simply shoot your queries our way via the related GitHub issue.
