printf "Deploying..."

printf "\nDeploying Manager ..."
npx hardhat ignition deploy ignition/modules/deploy-manager.js --network sepolia --parameters ignition/parameters.json

printf "\nUpdating Address and ABI parameters for Manager to Front-End ..."
npx hardhat run scripts/update-front-end.js
