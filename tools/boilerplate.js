const { createProjectGraphAsync } = require('@nrwl/workspace/src/core/project-graph');
const { workspaceRoot } = require('nx/src/utils/workspace-root');
const fs = require('fs');


(async () => {
  const projGraph = await createProjectGraphAsync()
  const nodeNames = Object.keys(projGraph.nodes);
  const tsReferences = []
  const paths = {};
  nodeNames.forEach((name) => {
    if(!projGraph.nodes[name].data.targets.typecheck) {
      return;
    }

    tsReferences.push(
      {
        path: `./${projGraph.nodes[name].data.root}`
      }
    );

    const pkgName = `@kbn/${projGraph.nodes[name].name.replace(/^kbn-/gi, '').replace(/-/gi, '/')}`
    paths[`${pkgName}/*`] = [`${projGraph.nodes[name].data.root}/src/*`];
  })

  // references
  const mainTS = JSON.parse(fs.readFileSync(`${workspaceRoot}/tsconfig.json`, 'utf8'));
  mainTS.references = tsReferences.sort();

  fs.writeFileSync(`${workspaceRoot}/tsconfig.json`, JSON.stringify(mainTS, null, 2));

  // paths
  const baseTS = JSON.parse(fs.readFileSync(`${workspaceRoot}/tsconfig.base.json`, 'utf8'));
  baseTS.compilerOptions.paths = paths;

  fs.writeFileSync(`${workspaceRoot}/tsconfig.base.json`, JSON.stringify(baseTS, null, 2));

  process.exit(0);
})();
