import {
  Staked,
  Withdrawn,
  RewardAdded,
  RewardPaid,
  TemplatePoolName,
} from "../../generated/TemplatePoolName/TemplatePoolName";
import { Pool, PoolHourData } from "../../generated/schema";
import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { YAM } from "../../generated/YAM/YAM";

export function handleStaked(event: Staked): void {
  let pool = getPool(event);
  pool.balance = pool.balance.plus(event.params.amount);
  pool.save();

  let poolHourData = updateHourData(event, pool);
  poolHourData.hourlyDepositVolume = poolHourData.hourlyDepositVolume.plus(
    event.params.amount
  );
  poolHourData.save();
}
export function handleWithdrawn(event: Withdrawn): void {
  let pool = getPool(event);
  pool.balance = pool.balance.minus(event.params.amount);
  pool.save();

  let poolHourData = updateHourData(event, pool);
  poolHourData.hourlyWithdrawalVolume = poolHourData.hourlyWithdrawalVolume.plus(
    event.params.amount
  );
  poolHourData.save();
}
export function handleRewardAdded(event: RewardAdded): void {
  let pool = getPool(event);
  pool.rewardAllocated = pool.rewardAllocated.plus(event.params.reward);

  let contract = TemplatePoolName.bind(event.address);
  pool.rewardRate = contract.rewardRate();
  pool.periodFinish = contract.periodFinish();

  pool.save();
}
export function handleRewardPaid(event: RewardPaid): void {
  let pool = getPool(event);

  let contract = TemplatePoolName.bind(event.address);
  let yam = YAM.bind(contract.yam());
  pool.rewardPaid = pool.rewardPaid.plus(
    event.params.reward
      .times(BigInt.fromI32(1).pow(18))
      .div(yam.yamsScalingFactor())
  );

  pool.save();
}

function updateHourData(event: ethereum.Event, pool: Pool): PoolHourData {
  const tickAmount = 12;
  let timestamp = event.block.timestamp.toI32();
  let hourIndex = timestamp / 3600; // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600; // want the rounded effect
  let hourPoolID = event.address
    .toHexString()
    .concat("-")
    .concat(BigInt.fromI32(hourIndex).toString());
  let poolHourData = PoolHourData.load(hourPoolID);
  if (poolHourData == null) {
    poolHourData = new PoolHourData(hourPoolID);
    poolHourData.hourStartUnix = hourStartUnix;
    poolHourData.pool = pool.id;
    poolHourData.hourlyDepositVolume = BigInt.fromI32(0);
    poolHourData.hourlyWithdrawalVolume = BigInt.fromI32(0);
    poolHourData.ticks = new Array(tickAmount).fill(0);
  }
  poolHourData.balance = pool.balance;
  poolHourData.ticks[timestamp] = pool.balance;
  return poolHourData as PoolHourData;
}

function getPool(event: ethereum.Event): Pool {
  let pool = Pool.load(event.address.toHexString());

  if (pool == null) {
    pool = new Pool(event.address.toHexString());
    pool.rewardRate = BigInt.fromI32(0);
    pool.startTime = BigInt.fromI32(1597172400);
    pool.periodFinish = BigInt.fromI32(0);
    pool.duration = BigInt.fromI32(625000);
    pool.balance = BigInt.fromI32(0);
    pool.rewardAllocated = BigInt.fromI32(0);
    pool.rewardPaid = BigInt.fromI32(0);
  }

  return pool as Pool;
}
