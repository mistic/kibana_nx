const { createProjectGraphAsync } = require('@nrwl/workspace/src/core/project-graph');
const { workspaceRoot } = require('nx/src/utils/workspace-root');


(async () => {
  const projGraph = await createProjectGraphAsync()
  const nodeNames = Object.keys(projGraph.nodes);

  const tsReferences = []
  nodeNames.forEach((name) => {
    if(!projGraph.nodes[name].data.targets.typecheck) {
      return;
    }

    tsReferences.push(
      {
        path: `./${projGraph.nodes[name].data.root}`
      }
    );
  })

  const mainTS = JSON.parse(require('fs').readFileSync(`${workspaceRoot}/tsconfig.json`, 'utf8'));
  mainTS.references = tsReferences.sort();

  require('fs').writeFileSync(`${workspaceRoot}/tsconfig.json`, JSON.stringify(mainTS, null, 2));

  process.exit(0);
})();
