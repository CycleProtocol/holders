const BN = require('bn.js');
const Web3 = require('web3');
const { xCycle } = require('./addresses');
const { connectionURL } = require('./constants');
const XCycleABI = require('./abis/xCycle.json');

const web3 = new Web3(new Web3.providers.HttpProvider(connectionURL));

const XCycleContract = new web3.eth.Contract(XCycleABI, xCycle);

// Returns array of addresses currently deposited
const getxCycleDepositors = async () => {
    const BalanceMap = new Map();

    const stakeEvents = await XCycleContract.getPastEvents("Deposit", { fromBlock: 0, toBlock: 'latest' });

    // Add up total deposit for each user
    stakeEvents.forEach(ev => {
        const { xCYCLEreceived, account } = ev.returnValues;
        const previousAmountBN = BalanceMap.get(account) || new BN('0');
        BalanceMap.set(account, previousAmountBN.add(new BN(xCYCLEreceived)));
    });

    const withdrawEvents = await XCycleContract.getPastEvents("Withdraw", { fromBlock: 0, toBlock: 'latest' });

    // Reduce balances based on withdraws
    withdrawEvents.forEach(ev => {
        const { xCYCLEredeemed, account } = ev.returnValues;
        const previousAmountBN = BalanceMap.get(account); // user will have balance if withdrawing
        BalanceMap.set(account, previousAmountBN.sub(new BN(xCYCLEredeemed)));
    });

    BalanceMap.forEach((balance, user) => {
        if (balance.toString() === '0') {
            BalanceMap.delete(user);
        }
    });

    const currentDepositors = Array.from(BalanceMap, ([user,]) => user);

    return currentDepositors;
}

module.exports = getxCycleDepositors;
