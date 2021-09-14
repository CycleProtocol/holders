const BN = require('bn.js');

// Returns array of addresses currently deposited
const getDepositors = async (contract, inEvent, outEvent) => {
    const BalanceMap = new Map();

    const stakeEvents = await contract.getPastEvents(inEvent, { fromBlock: 0, toBlock: 'latest' });

    // Add up total deposit for each user
    stakeEvents.forEach(ev => {
        const { amount, user } = ev.returnValues;
        const previousAmountBN = BalanceMap.get(user) || new BN('0');
        BalanceMap.set(user, previousAmountBN.add(new BN(amount)));
    });

    const withdrawEvents = await contract.getPastEvents(outEvent, { fromBlock: 0, toBlock: 'latest' });

    // Reduce balances based on withdraws
    withdrawEvents.forEach(ev => {
        const { amount, user } = ev.returnValues;
        const previousAmountBN = BalanceMap.get(user); // user will have balance if withdrawing
        BalanceMap.set(user, previousAmountBN.sub(new BN(amount)));
    });

    BalanceMap.forEach((balance, user) => {
        if (balance.toString() === '0') {
            BalanceMap.delete(user);
        }
    });

    const currentDepositors = Array.from(BalanceMap, ([user,]) => user);

    return currentDepositors;
}

module.exports = getDepositors;
