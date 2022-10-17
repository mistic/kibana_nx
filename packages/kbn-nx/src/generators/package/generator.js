const {
    addProjectConfiguration,
    formatFiles,
    generateFiles,
    getWorkspaceLayout,
    names,
    offsetFromRoot,
    updateJson,
    installPackagesTask,
} = require('@nrwl/devkit');

const path = require('path');

function normalizeOptions(
    host,
    options,
) {
    const workspaceNamePrefix = "@kbn";
    const fileNameCasing = names(options.name).fileName;
    const name = fileNameCasing.startsWith('kbn-') ? fileNameCasing : `kbn-${fileNameCasing}`;
    const projectName = name.replace(new RegExp('/', 'g'), '-')
    const projectDirectory = options.directory
      ? `${names(options.directory).fileName}/${projectName}`
      : `${getWorkspaceLayout(host).libsDir}/${projectName}`
    const parsedTags = options.tags
      ? options.tags.split(',').map((s) => s.trim())
      : ['shared-common']
    const packageName = `${workspaceNamePrefix}/${projectName.replace(/^kbn-/gi, '').replace(/-/gi, '/')}`

    return {
      ...options,
      name,
      projectName,
      projectRoot: projectDirectory,
      projectDirectory,
      parsedTags,
      packageName,
      workspaceNamePrefix
    }
}

function addFiles(host, options) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  }
  generateFiles(
    host,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions,
  )
}

module.exports =  async function (host, options) {
  const normalizedOptions = normalizeOptions(host, options)
  const hostPkgJson = JSON.parse(host.read('package.json', 'utf8'));

  // todo: check on the list of projects
  if (hostPkgJson.devDependencies[options.packageName]) {
    throw new Error('Theres already a package with that name');
  }

  const defaultTargets = {
    lint: {
      executor: '@nrwl/linter:eslint',
      options: {
        lintFilePatterns: [`${normalizedOptions.projectRoot}/**/*.ts`],
      },
    },
    boilerplate: {
      executor: '@kbn/nx:boilerplate',
    },
    build: {
      executor: '@kbn/nx:transpile',
    },
    typecheck: {
      executor: '@kbn/nx:typecheck',
    },
  }

  addProjectConfiguration(host, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: defaultTargets,
    tags: normalizedOptions.parsedTags,
  })

  addFiles(host, normalizedOptions)

  updateJson(host, 'package.json', (pkgJson) => {
    pkgJson.dependencies[normalizedOptions.packageName] = `link:${normalizedOptions.projectDirectory}`;
    return pkgJson;
  })

  if (host.exists('tsconfig.json')) {
    updateJson(host, 'tsconfig.json', (tsconfig) => {
      if (tsconfig.references) {
        tsconfig.references.push({
          path: `./${normalizedOptions.projectRoot}`,
        })

        tsconfig.references.sort((a, b) => a.path.localeCompare(b.path));
      }
      return tsconfig
    })
  }

  if (host.exists('tsconfig.base.json')) {
    updateJson(host, 'tsconfig.base.json', (tsconfig) => {
      if (tsconfig.compilerOptions.paths) {
        tsconfig.compilerOptions.paths[`${normalizedOptions.packageName}/*`] = [`${normalizedOptions.projectRoot}/src/*`];
      }
      return tsconfig
    })
  }

  await formatFiles(host);

  return () => {
    installPackagesTask(host)
  };
}
