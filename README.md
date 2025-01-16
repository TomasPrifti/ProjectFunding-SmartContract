# ProjectFunding-SmartContract
This project uses Hardhat to manage the compilation, deploy and test for an Ethereum Smart Contract Project.<br>This repository can work very well with the following one: <a href="https://github.com/TomasPrifti/ProjectFunding-Platform" target="_blank">ProjectFunding-Platform</a>

## Contracts
There are 3 contracts:
- **Manager**: is the main contract that manage all the other inside
- **Project**: is the contract used to manage a single project created and all its functionality
- **MockUSDT**: is the mock contract to simulate the use of `USDT` Token

## Ignition Modules
There are 3 deployments scripts:
- **deploy-manager**: is the script to deploy the `Manager` contract
- **deploy-project**: is the script to deploy a single `Project` contract (used only for test)
- **mocks**: is the script to deploy all the mocks contract (used only for test)

## Scripts
There are 2 utility scripts:
- **update-front-end**: is the script used to update the data that will be used by the `Front-End` application
- **update-parameters**: is the script used to update the internal parameters

## Test
There are 2 test scripts:
- **Manager**: is the script that define all the tests for the `Manager` contract
- **Project**: is the script that define all the tests for the `Project` contract

## Other

### hardhat.config.js
Here, are defined the constants used for the `HardHat` project's configuration.

### Bash
Here, there are the `bash` scripts used to deploy the entire project through a sequence of sub-operation grouped in one file.

## Usage
Copy the file `.env.example` in a new file `.env` and insert your data.

Run the following command to install all the modules requested:
```bash
npm ci
```

Then you have to run in a separate terminal an HardHat node through this command:
```bash
npx hardhat node
```

After that, you are ready to deploy the project using the command:
```bash
npm run deploy-localhost
```
