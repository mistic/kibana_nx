const { createProjectGraphAsync } = require('@nrwl/workspace/src/core/project-graph');
const {
  calculateProjectDependencies,
} = require('@nrwl/workspace/src/utilities/buildable-libs-utils');
const execa = import('execa');
const fs = require('fs');
const path = require('path');

module.exports = async function boilerplateExecutor(
  options,
  context
) {
  if (!context.projectName) {
    throw new Error('No projectName')
  }
  if (!context.targetName) {
    throw new Error('No targetName')
  }

  const projGraph = await createProjectGraphAsync()
  const libRoot = context.workspace.projects[context.projectName].root
  const { dependencies } = calculateProjectDependencies(
    projGraph,
    context.root,
    context.projectName,
    context.targetName,
    context.configurationName || 'production',
  )

  const tsConfig = fs.existsSync(`${libRoot}/tsconfig.json`)
    ? JSON.parse(fs.readFileSync(`${libRoot}/tsconfig.json`).toString())
    : {}

  const tsRefs = [];
  dependencies.forEach((dep) => {
    if (!dep.name.startsWith("@kbn")) {
      return;
    }

    const pkgName = dep.node.data.packageName;
    const projectName = pkgName.replace(/^@/gi, '').replace(/\//gi, '-');
    const nxProject = projGraph.nodes[projectName];
    if (!nxProject || !nxProject.data.targets.typecheck) {
      return;
    }

    tsRefs.push({
      path: `./${path.relative(libRoot, nxProject.data.root)}`,
    });
  })
  tsRefs.sort();

  tsConfig.references = tsRefs;
  fs.writeFileSync(`${libRoot}/tsconfig.json`, JSON.stringify(tsConfig, null, 2))

  return {
    success: true,
  }
}
