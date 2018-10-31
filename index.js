const express = require('express');
const app = express();
const ethers = require('ethers');
const WebSocketProvider = require('./WebSocketProvider');
const {nationABI, nationProdAddress, nationDevAddress} = require('./constants');

const WebSocket = require('websocket').w3cwebsocket;
global.WebSocket = WebSocket;

const devProvider = new WebSocketProvider('rinkeby');

const prodNationData = [];

(() => {
    const provider = new WebSocketProvider('homestead');

    const contract = new ethers.Contract(nationProdAddress, nationABI, provider);

    contract.onnationcreated = function () {
        const log = this;
        prodNationData.push({
            tx_hash: log.transactionHash,
            id: log.args.nationId.toNumber(),
        })
    };

    provider.resetEventsBlock(4977201);
})();

app.get('/nations/production', (req, res) => res.send(prodNationData));

const devNationData = [];
(() => {
    const provider = new WebSocketProvider('rinkeby');

    const contract = new ethers.Contract(nationDevAddress, nationABI, provider);

    contract.onnationcreated = function () {
        const log = this;
        devNationData.push({
            tx_hash: log.transactionHash,
            id: log.args.nationId.toNumber(),
        })
    };

    provider.resetEventsBlock(2375943);
})();

app.get('/nations/development', (req, res) => res.send(devNationData));

/**


 app.get('/nations/development', (req, res) => {

    console.log(req);
    res.send({key: "nations development"})

});

*/
app.listen(process.env.PORT || 3000, () => console.log(`Listening on ${process.env.PORT || 3000}`))
