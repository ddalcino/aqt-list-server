# aqt list server

[![codecov](https://codecov.io/gh/ddalcino/aqt-list-server/branch/main/graph/badge.svg?token=8SVNX4YCGE)](
  https://codecov.io/gh/ddalcino/aqt-list-server
)

This project is meant to provide a web-based GUI interface to help users find 
out what options are available for [aqtinstall](https://github.com/miurahr/aqtinstall) 
and [install-qt-action](https://github.com/jurplel/install-qt-action).
`aqtinstall` provides CLI-only tools called `aqt list-qt` and `aqt list-tool`,
but these tools must be installed locally in order to be used.
This project assumes that many users of `aqtinstall` and `install-qt-action`
have no interest in installing the `aqtinstall` locally, because they intend
to use it as part of a CI/CD workflow.
Those users will be able to use this project instead of those CLI-based tools.

This project is meant as a convenience for users of `aqtinstall` and `install-qt-action`.
Please refer to [the `aqtinstall` documentation](https://aqtinstall.readthedocs.io/en/latest/)
for definitive information on how `aqtinstall` should be used.

## Technical design
This project includes a Typescript re-implementation of `aqt list-qt` and
`aqt list-tool`, at `src/aqt-list-qt-ts`.
Instead of accessing data directly from download.qt.io, it reads cached .json
files at https://github.com/ddalcino/qt-repo-cache that are updated daily.
This cache is meant to make access fast and available from any website, without
the need for any backend server.
The CORS policy at download.qt.io prevents any browser-based implementation
of `aqt list-qt` from reading HTML and XML files directly from download.qt.io,
which means that 
It is possible that this data is stale or incorrect; if you discover any 
inaccuracies, you are strongly encouraged to [file an issue](https://github.com/ddalcino/aqt-list-server/issues)!

This project includes a frontend written in React, using Vite, that consumes
the above-described re-implementation of `aqt list-qt`.

# Setup:

First, make sure you have [python 3.13](https://www.python.org) and [nodejs 24](https://nodejs.org/) installed.

Install this project's dependencies with:
```bash
pip install aqtinstall
npm install 
```

Note that Python and aqtinstall are only required for running the functional tests.

## Available Scripts

In the project directory, you can run:

### `npm lint`
Runs code auto-formatting and linting tasks. 
Strongly recommended: set up your editor to run this when you save your code.
This project will fail to transpile if the code is not properly formatted.

### `npm dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm test:nowatch`

Launches the test runner without interactive watch mode.

### `npm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

