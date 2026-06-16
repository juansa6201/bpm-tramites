// Valida que los mensajes de commit sigan Conventional Commits.
// Tipos permitidos por config-conventional: feat, fix, chore, docs, style,
// refactor, perf, test, build, ci, revert.
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
