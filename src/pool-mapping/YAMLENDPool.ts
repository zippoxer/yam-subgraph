import {
  Staked,
  Withdrawn,
  RewardAdded,
  RewardPaid,
  YAMLENDPool,
} from "../../generated/YAMLENDPool/YAMLENDPool";
import { Pool } from "../../generated/schema";
import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { YAM } from "../../generated/YAM/YAM";

export function handleStaked(event: Staked): void {
  let pool = getPool(event);
  pool.staked = pool.staked.plus(event.params.amount);
  pool.save();
}
export function handleWithdrawn(event: Withdrawn): void {
  let pool = getPool(event);
  pool.staked = pool.staked.minus(event.params.amount);
  pool.save();
}
export function handleRewardAdded(event: RewardAdded): void {
  let pool = getPool(event);
  pool.rewardAllocated = pool.rewardAllocated.plus(event.params.reward);

  let contract = YAMLENDPool.bind(event.address);
  pool.rewardRate = contract.rewardRate();
  pool.periodFinish = contract.periodFinish();

  pool.save();
}
export function handleRewardPaid(event: RewardPaid): void {
  let pool = getPool(event);

  let contract = YAMLENDPool.bind(event.address);
  const yam = YAM.bind(contract.yam());
  pool.rewardPaid = pool.rewardPaid.plus(
    event.params.reward
      .times(BigInt.fromI32(1).pow(18))
      .div(yam.yamsScalingFactor())
  );

  pool.save();
}

function getPool(event: ethereum.Event): Pool {
  let pool = Pool.load("2");

  if (pool == null) {
    pool = new Pool("2");
    pool.rewardRate = BigInt.fromI32(0);
    pool.startTime = BigInt.fromI32(1597172400);
    pool.periodFinish = BigInt.fromI32(0);
    pool.duration = BigInt.fromI32(625000);
    pool.staked = BigInt.fromI32(0);
    pool.rewardAllocated = BigInt.fromI32(0);
    pool.rewardPaid = BigInt.fromI32(0);
  }

  return pool as Pool;
}
