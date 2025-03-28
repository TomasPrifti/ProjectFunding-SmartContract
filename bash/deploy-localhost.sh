printf "Deploying all the contracts in order..."

printf "\nDeploying MockUSDT ..."
npx hardhat ignition deploy ignition/modules/mocks.js --network localhost

printf "\nUpdating Address parameter for MockUSDT ..."
npx hardhat run scripts/update-parameters.js

printf "\nMinting some token from MockUSDT for the other accounts ..."
npx hardhat run scripts/mint-token.js --network localhost

printf "\nDeploying Manager ..."
npx hardhat ignition deploy ignition/modules/deploy-manager.js --network localhost --parameters ignition/parameters.json

printf "\nUpdating Address and ABI parameters for Manager to Front-End ..."
npx hardhat run scripts/update-front-end.js
