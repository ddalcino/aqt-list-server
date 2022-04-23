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

This project includes a frontend written in React, boostrapped with 
[Create React App](https://github.com/facebook/create-react-app), that consumes
the above-described re-implementation of `aqt list-qt`.

# Setup:

First, make sure you have [python](https://www.python.org), [nodejs](https://nodejs.org/) and 
[yarn](https://yarnpkg.com/) installed.

Install this project's dependencies with:
```bash
pip install aqtinstall
yarn install 
```

Note that Python and aqtinstall are only required for running the functional tests.

## Available Scripts

In the project directory, you can run:

### `yarn lint`
Runs code auto-formatting and linting tasks. 
Strongly recommended: set up your editor to run this when you save your code.
This project will fail to transpile if the code is not properly formatted.

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
