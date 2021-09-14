const Web3 = require('web3');
const getDepositors = require('./getDepositors');
const { avaxRewards, coreRewards, cycle } = require('./addresses');
const { connectionURL } = require('./constants');
const CycleABI = require('./abis/Cycle.json');
const AVAXRewardsABI = require('./abis/AVAXRewards.json');
const CoreRewardsABI = require('./abis/CoreRewards.json');
const getxCycleDepositors = require('./getxCycleDepositors');

const web3 = new Web3(new Web3.providers.HttpProvider(connectionURL));

const AVAXRewardsContract = new web3.eth.Contract(AVAXRewardsABI, avaxRewards);
const CoreRewardsContract = new web3.eth.Contract(CoreRewardsABI, coreRewards);
const CycleContract = new web3.eth.Contract(CycleABI, cycle);

(async () => {
    const promiseAR = getDepositors(AVAXRewardsContract, 'Staked', 'Withdrawn');
    const promiseCR = getDepositors(CoreRewardsContract, 'Staked', 'Withdrawn');
    const promiseXC = getxCycleDepositors();
    const [depositorsAR, depositorsCR, depositorsXC] = await Promise.all([promiseAR, promiseCR, promiseXC]);

    const uniqueAddresses = [...(new Set(depositorsAR.concat(depositorsCR).concat(depositorsXC)))];

    const cycleBalanceARpromiseArray = uniqueAddresses.map(u => CycleContract.methods.balanceOf(u).call());

    const balances = await Promise.allSettled(cycleBalanceARpromiseArray);

    const pureDeposits = balances.filter(b => b.status === 'fulfilled' && b.value === '0').length;

    console.log(pureDeposits);
})();
