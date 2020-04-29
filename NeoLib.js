const { default: Neon, api, wallet } = require("@cityofzion/neon-js");
const fetch = require('node-fetch');
const network = "MainNet"
const NEO = "NEO";
const GAS = 'GAS';
const NEOSCAN = "https://neoscan.io"
const NEO_ASSET_ID = 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
const GAS_ASSET_ID = '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';

class NeoLib {
    constructor(){
        this.apiProvider = new api.neoscan.instance(network)
        this.generateAccount()
    }

    async getBalance(address, ticker = "NEO"){
    	try {
            let balance = await this.apiProvider.getBalance(address);
            balance = balance.assets[ticker].balance.toNumber();
            console.log('balance', balance)
			return balance
    	} catch (error) {
            console.error(error)
	    }
    }

    async sendTransaction(to, value , ticker = NEO){
    	try {
            const privateKey = undefined; // your privateKey
            const intent = api.makeIntent({ [ticker]: value}, to);
            const account = new wallet.Account(privateKey);
            const config = {
                api: this.apiProvider, // The network to perform the action, MainNet or TestNet.
                account: account, // This is the address which the assets come from.
                intents: intent // This is where you want to send assets to.
            };
            const result = await Neon.sendAsset(config);
            const txHash = result.response.txid;
            console.log('txHash', txHash)
            return txHash;
    	} catch (error) {
            console.error(error);
    	}
    }
    
    async getTxHistory(address, ticker = NEO, assetId = NEO_ASSET_ID){
        try{
            let result = [];
            const url = `${NEOSCAN}/api/main_net/v1/get_address_abstracts/${address}/1`;
            let allTx = await fetch(url).then(res => res.json())
            allTx = allTx.entries
            const rate = "8.6000";
			for(let txKey in allTx){
                const tx = allTx[txKey];
                if(tx.asset === assetId){
                    const hash = tx.txid;
                    const txFee = 0;
                    const amount = tx.amount;
                    const timeStamp = tx.time;
                    const from = tx.address_from;
                    const to = tx.address_to;
                    const status = "CONFIRM";
                    let action;
                    if(to != from){
                        if(address == to){
                            action = "DEPOSIT";
                        }else if(address == from){
                            action = "SEND";
                        }
                    }else{
                        action = "SELF";
                    }
                    const moneyQuantity = (amount*rate).toFixed(2); 
                    let id = result.length+1;
                    let txData = this.formatTxData(timeStamp, id, action, status, amount, moneyQuantity, hash, from, to, txFee);
                    result.push(txData);
                    if(result.length > 9) break;
                } continue;
            }
            console.log("HISTORY: ", result)
            return result;
        }catch(e){
            console.error(e.message)
            return [];
        }
    }

    formatTxData(timeStamp, id, action, status, amount, moneyQuantity, hash, from, to, txFee){
		let txData = {
            timeStamp,
            id,
            action,
            status,
            cryptoAmount: amount,
            moneyQuantity,
            copy: hash,
            explorer: `${NEOSCAN}/transaction/${hash}`,
            fromAddress: from,
            toAddress: to,
            txFee, 
		};
		return txData;
    }
    // address is valid or not. return boolean
    async validateAddress(address){
        try {
            const result = wallet.isAddress(address);
            return result;
        } catch (error) {
            console.log(error)
            return false;
        }
    }
    async generateAccount() {
        try {
            const privateKey = wallet.generatePrivateKey();
            const account = new wallet.Account(privateKey);
            const address = account.address;
            const data = {
                address,
                privateKey
            }
            console.log(data)
            return data;
        } catch (error) {
            console.error(error)
        }
    }
}

let neoLib = new NeoLib()