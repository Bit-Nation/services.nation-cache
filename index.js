const express = require('express');
const app = express();

const ethers = require('ethers');
const InfuraProvider = ethers.providers.InfuraProvider;

const {nationABI, nationProdAddress, nationDevAddress} = require('./constants');

// If for some reason the configuration is reset or fails on the server, 
// then this default key, exposed to the public, will be used as a fallback
// This key is exposed to the public, but not used by default
const fallbackKey = '8a7509ce6b0744b2a6e93c8de5b2faec'; 

const infuraKey = process.env['app_infuraKey'] || fallbackKey; 

const environments = ['development', 'production'];

const getEnvVars = (env) => {
    if (env == 'development') {
        return {
            provider: new InfuraProvider('rinkeby'),
            nationContractAddress: nationDevAddress,
            startBlock: 2375943
        };
    }
    else if (env == 'production') {
        return {
            provider: new InfuraProvider('homestead', infuraKey),
            nationContractAddress: nationProdAddress,
            startBlock: 4977201
        };
    }
    else {
        throw "Unsupported env!";
    }
};

(async () => {
    for(i in environments) {
        let env = environments[i];
        let envVars = getEnvVars(env);

        let provider = envVars.provider;
        let contract = new ethers.Contract(envVars.nationContractAddress, nationABI, provider);

        let nationData = [];
        contract.on('NationCreated', (founderAddress, nationId, ev) => {
            let log = ev;
            nationData.push({
                tx_hash: log.transactionHash,
                id: log.args.nationId.toNumber(),
            })
        });

        //This is needed in order to get past, historical events
        provider.resetEventsBlock(envVars.startBlock);

        // Returns all nation information. 
        app.get(`/nations/${env}`, (req, res) => {
            res.send(nationData);
        });

        const serve = (name, f) => app.get(`/nations/${env}/${name}`, f);

        // Returns the total number of nations on the blockchain
        serve("count", async (req, res) => {
            res.send((await contract.numNations()).toNumber().toString());
        });
    }
})();

app.listen(process.env.PORT || 3000, () => console.log(`Listening on ${process.env.PORT || 3000}`));
