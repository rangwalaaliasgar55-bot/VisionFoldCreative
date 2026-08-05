# Contributing to VisionFold Creative

Thank you for your interest in contributing to VisionFold Creative!

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/visionfold-creative.git
cd visionfold-creative

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Development

```bash
# Start development server
npm run dev

# Run type checking
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed project structure.

## Coding Standards

### TypeScript
- Use strict TypeScript mode
- Define interfaces for all component props
- Use explicit return types for functions
- Avoid `any` type

### React Components
- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Co-locate component-specific styles

### Styling
- Use Tailwind CSS classes
- Follow the design system's color palette
- Use CSS variables for theme values
- Ensure responsive design

### Testing
- Write tests for new features
- Update tests for modified features
- Maintain minimum 90% coverage
- Use descriptive test names

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting, no code change
refactor: code refactoring
test: adding/updating tests
chore: maintenance tasks
```

### Examples
```
feat: add portfolio item creation form
fix: resolve contact form submission error
docs: update API documentation
refactor: extract API client into separate module
test: add tests for validation schemas
```

## Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Run linting and fix any issues
3. Update documentation if needed
4. Add/update tests for your changes

### PR Description
- Clear title describing the change
- Detailed description of what changed
- Link to related issues
- Screenshots for UI changes

### Review Criteria
- Code quality and style
- Test coverage maintained
- Documentation updated
- No breaking changes (or properly documented)

## Code Review

### For Reviewers
- Be constructive and respectful
- Focus on code, not person
- Suggest improvements, don't dictate
- Approve when ready to merge

### For Authors
- Respond to feedback promptly
- Ask questions if unclear
- Don't take feedback personally
- Explain your decisions

## Branching Strategy

```
main          - Production-ready code
├── develop    - Integration branch
├── feature/*  - New features
├── fix/*      - Bug fixes
├── chore/*    - Maintenance tasks
└── refactor/* - Code refactoring
```

### Workflow
1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request to `develop`
4. After approval, merge to `develop`
5. When ready, merge `develop` to `main`

## Reporting Issues

### Bug Reports
- Include steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Minimal reproduction code

### Feature Requests
- Clear description of the feature
- Use case and motivation
- Potential alternatives considered
- Implementation suggestions (optional)

## Questions?

Feel free to:
- Open an issue for bugs/questions
- Start a discussion for ideas
- Reach out to the maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
