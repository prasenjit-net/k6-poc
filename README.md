# Collection of WSO2 Test Scripts

A Collection of WSO2 Test Scripts

## Installation

To install the scripts, run the following command:

```shell
yarn install --frozen-lockfile
# or
npm ci
```

## Build

To build the scripts, run the following command:

```shell
yarn build
# or
npm run build
```

To continuously build the scripts, run the following command:

```shell
yarn build:watch
# or
npm run build:watch
```

## K6 Installation

K6 binary can be installed from k6.io website or downloading the binary from [K6 Github](https://github.com/grafana/k6).

## Running the Scripts

K6 scripts can be run from the command line using the following command:

```shell
k6 run dist/<script_name>.js
```

## Advanced CLI Usage

For more advanced CLI usage, please refer to the [K6 CLI documentation](https://k6.io/docs/cli).
