// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title SimpleSavingPlan
 * @notice A contract for daily savings with commitment stakes, penalties, and rewards
 * Uses native CELO token instead of ERC20 tokens
 * 
 * Features:
 * - Users create saving plans with daily payment requirements
 * - Penalty stake is required upfront
 * - 2-day grace period for first missed payment
 * - Daily penalties deducted from stake after grace period
 * - Penalties go to reward pool
 * - 20% completion bonus
 * - Reward pool distributed to completers
 */
contract SimpleSavingPlan is ReentrancyGuard, Ownable {
    using Address for address payable;

    struct Plan {
        address user;              // Plan owner
        uint256 dailyAmount;       // Amount required per day (in CELO wei)
        uint256 totalDays;         // Total days in the plan
        uint256 penaltyStake;      // Stake amount (in CELO wei)
        uint256 penaltyPercent;    // Penalty percentage (e.g., 10 = 10%, 15 = 15%, 20 = 20%)
        uint256 currentDay;        // Current day (number of successful payments)
        uint256 missedDays;        // Number of missed days
        bool isActive;             // Plan is active
        bool isCompleted;          // Plan is completed
        bool isFailed;             // Plan has failed
        uint256 startTime;         // When plan started (first payment timestamp)
        uint256 lastPaidAt;        // Timestamp of last payment
        uint256 firstMissTime;     // Timestamp of first missed payment (for grace period)
        bool hasUsedGracePeriod;   // Whether grace period has been used
    }

    uint256 public planCounter;
    mapping(uint256 => Plan) public plans;
    
    // Reward pool tracking (native CELO)
    uint256 public rewardPool; // Total CELO in reward pool
    mapping(uint256 => bool) public hasClaimedReward; // planId => has claimed reward pool share
    
    // Constants
    uint256 public constant GRACE_PERIOD = 2 days; // 2-day grace period for first miss
    uint256 public constant REWARD_PERCENTAGE = 20; // 20% completion bonus (basis points: 2000 = 20%)
    uint256 public constant REWARD_PERCENTAGE_BPS = 2000; // 20% in basis points
    
    // Events
    event PlanCreated(uint256 indexed planId, address indexed owner, uint256 dailyAmount, uint256 totalDays, uint256 penaltyStake);
    event DailyPaid(uint256 indexed planId, address indexed payer, uint256 currentDay);
    event PenaltyDeducted(uint256 indexed planId, uint256 amount, uint256 remainingStake);
    event PlanFailed(uint256 indexed planId);
    event PlanCompleted(uint256 indexed planId);
    event Claimed(uint256 indexed planId, address indexed owner, uint256 savedAmount, uint256 rewardBonus, uint256 rewardPoolShare);
    event RewardPoolContributed(uint256 amount);
    event RewardPoolDistributed(uint256 indexed planId, address indexed recipient, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new saving plan
     * @param dailyAmount Amount to pay each day (in CELO wei)
     * @param totalDays Total number of days for the plan
     * @param penaltyStake Penalty stake amount (in CELO wei)
     * @param penaltyPercent Penalty percentage (e.g., 10 = 10%, 15 = 15%, 20 = 20%)
     * @return planId The ID of the created plan
     */
    function createPlan(
        uint256 dailyAmount,
        uint256 totalDays,
        uint256 penaltyStake,
        uint256 penaltyPercent
    ) external payable nonReentrant returns (uint256) {
        require(totalDays > 0, "totalDays>0");
        require(dailyAmount > 0, "dailyAmount>0");
        require(penaltyStake > 0, "penaltyStake>0");
        require(penaltyPercent > 0 && penaltyPercent <= 100, "invalid-penalty-percent");
        require(msg.value == penaltyStake, "incorrect-stake-amount");

        planCounter++;
        plans[planCounter] = Plan({
            user: msg.sender,
            dailyAmount: dailyAmount,
            totalDays: totalDays,
            penaltyStake: penaltyStake,
            penaltyPercent: penaltyPercent,
            currentDay: 0,
            missedDays: 0,
            isActive: true,
            isCompleted: false,
            isFailed: false,
            startTime: 0, // Will be set on first payment
            lastPaidAt: 0,
            firstMissTime: 0,
            hasUsedGracePeriod: false
        });

        emit PlanCreated(planCounter, msg.sender, dailyAmount, totalDays, penaltyStake);
        return planCounter;
    }

    /**
     * @notice Pay the daily amount for a plan
     * @param planId The ID of the plan
     */
    function payDaily(uint256 planId) external payable nonReentrant {
        Plan storage p = plans[planId];
        require(p.isActive && !p.isFailed && !p.isCompleted, "plan-not-active");
        require(p.currentDay < p.totalDays, "plan-already-complete");
        require(msg.sender == p.user, "not-plan-owner");
        require(msg.value == p.dailyAmount, "incorrect-daily-amount");

        // Set start time on first payment
        if (p.startTime == 0) {
            p.startTime = block.timestamp;
        }

        // Reset missed days if payment is made (user caught up)
        if (p.missedDays > 0 && p.lastPaidAt > 0) {
            // Check if payment is within grace period
            if (p.hasUsedGracePeriod || block.timestamp <= p.firstMissTime + GRACE_PERIOD) {
                // Still in grace period, no penalty
                p.missedDays = 0;
                p.firstMissTime = 0;
            }
        }

        p.currentDay += 1;
        p.lastPaidAt = block.timestamp;

        // Check if plan is completed
        if (p.currentDay >= p.totalDays) {
            p.isCompleted = true;
            p.isActive = false;
            emit PlanCompleted(planId);
        }

        emit DailyPaid(planId, msg.sender, p.currentDay);
    }

    /**
     * @notice Check and mark missed payments, deduct penalties
     * @param planId The ID of the plan to check
     */
    function checkAndDeductPenalty(uint256 planId) external nonReentrant {
        Plan storage p = plans[planId];
        require(p.isActive && !p.isFailed && !p.isCompleted, "plan-not-active");
        require(p.lastPaidAt > 0, "no-payments-yet");

        // Check if payment is overdue (more than 1 day since last payment)
        if (block.timestamp - p.lastPaidAt > 1 days) {
            // Check if this is the first miss
            if (p.firstMissTime == 0) {
                p.firstMissTime = block.timestamp;
            }

            // Check if grace period has expired
            if (p.hasUsedGracePeriod || block.timestamp > p.firstMissTime + GRACE_PERIOD) {
                // Grace period expired, deduct penalties
                p.hasUsedGracePeriod = true;
                
                // Calculate days to penalize
                uint256 graceExpiredAt = p.firstMissTime + GRACE_PERIOD;
                uint256 daysToPenalize = block.timestamp > graceExpiredAt 
                    ? (block.timestamp - graceExpiredAt) / 1 days 
                    : 0;

                if (daysToPenalize > 0) {
                    // Calculate total penalty (percentage of daily amount per day)
                    uint256 totalPenalty = (p.dailyAmount * p.penaltyPercent * daysToPenalize) / 100;

                    // Only deduct if there's stake remaining
                    if (totalPenalty > 0 && p.penaltyStake >= totalPenalty) {
                        p.penaltyStake -= totalPenalty;
                        p.missedDays += daysToPenalize;
                        rewardPool += totalPenalty;
                        
                        emit PenaltyDeducted(planId, totalPenalty, p.penaltyStake);
                        emit RewardPoolContributed(totalPenalty);
                    }

                    // If stake is depleted, mark as failed
                    if (p.penaltyStake == 0) {
                        p.isFailed = true;
                        p.isActive = false;
                        emit PlanFailed(planId);
                    }
                }
            }
        }
    }

    /**
     * @notice Mark a plan as failed (simple version for frontend compatibility)
     * @param planId The ID of the plan
     */
    function markFailed(uint256 planId) external nonReentrant {
        Plan storage p = plans[planId];
        require(p.isActive && !p.isFailed && !p.isCompleted, "plan-not-active");
        require(p.lastPaidAt > 0, "no-payments-yet");
        require(block.timestamp > p.lastPaidAt + GRACE_PERIOD, "still-in-grace");

        p.isFailed = true;
        p.isActive = false;
        
        // Send remaining stake to reward pool
        if (p.penaltyStake > 0) {
            rewardPool += p.penaltyStake;
            emit RewardPoolContributed(p.penaltyStake);
            p.penaltyStake = 0;
        }

        emit PlanFailed(planId);
    }

    /**
     * @notice Mark a plan as failed if no payments after extended period
     * @param planId The ID of the plan
     * @param allowAfterSeconds Time in seconds after creation to allow marking as failed
     */
    function markFailedNoPayments(uint256 planId, uint256 allowAfterSeconds) external nonReentrant {
        Plan storage p = plans[planId];
        require(p.isActive && !p.isFailed && !p.isCompleted, "plan-not-active");
        require(p.lastPaidAt == 0, "has-payments");
        require(block.timestamp > p.startTime + allowAfterSeconds || (p.startTime == 0 && block.timestamp > allowAfterSeconds), "too-soon");

        p.isFailed = true;
        p.isActive = false;
        
        // Send remaining stake to reward pool
        if (p.penaltyStake > 0) {
            rewardPool += p.penaltyStake;
            p.penaltyStake = 0;
            emit RewardPoolContributed(p.penaltyStake);
        }

        emit PlanFailed(planId);
    }

    /**
     * @notice Withdraw saved amount and rewards when plan is completed
     * @param planId The ID of the plan
     */
    function withdraw(uint256 planId) external nonReentrant {
        Plan storage p = plans[planId];
        require(p.user == msg.sender, "not-plan-owner");
        require(p.isCompleted, "plan-not-completed");

        // Calculate amounts
        uint256 savedAmount = p.dailyAmount * p.totalDays;
        uint256 rewardBonus = (savedAmount * REWARD_PERCENTAGE_BPS) / 10000;
        uint256 rewardPoolShare = _calculateRewardPoolShare(planId, msg.sender);
        uint256 totalToWithdraw = savedAmount + rewardBonus + rewardPoolShare + p.penaltyStake;

        // Zero out to prevent reentrancy
        p.currentDay = 0;
        p.penaltyStake = 0;
        p.isCompleted = false;

        // Transfer all funds in native CELO
        payable(msg.sender).sendValue(totalToWithdraw);

        emit Claimed(planId, msg.sender, savedAmount, rewardBonus, rewardPoolShare);
    }

    /**
     * @notice Internal function to calculate reward pool share
     */
    function _calculateRewardPoolShare(uint256 planId, address recipient) internal returns (uint256) {
        if (rewardPool == 0 || hasClaimedReward[planId]) {
            return 0;
        }
        
        uint256 unclaimedCount = _getUnclaimedCompletedCount();
        if (unclaimedCount == 0) {
            return 0;
        }
        
        uint256 share = rewardPool / unclaimedCount;
        if (share > rewardPool) {
            share = rewardPool;
        }
        
        rewardPool -= share;
        hasClaimedReward[planId] = true;
        emit RewardPoolDistributed(planId, recipient, share);
        
        return share;
    }

    /**
     * @notice Get plan details
     * @param planId The ID of the plan
     * @return plan The plan struct
     */
    function getPlan(uint256 planId) external view returns (Plan memory) {
        return plans[planId];
    }

    /**
     * @notice Get reward pool balance
     * @return balance The reward pool balance in CELO wei
     */
    function getRewardPoolBalance() external view returns (uint256) {
        return rewardPool;
    }

    /**
     * @notice Internal function to get count of unclaimed completed plans
     * @dev This is a simplified version - in production, you'd want to track this more efficiently
     */
    function _getUnclaimedCompletedCount() internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= planCounter; i++) {
            if (plans[i].isCompleted && !hasClaimedReward[i]) {
                count++;
            }
        }
        // If no unclaimed completers, return 1 to avoid division by zero
        return count > 0 ? count : 1;
    }

    /**
     * @notice Emergency function to withdraw reward pool (admin only)
     * @dev Only use in case of issues with reward distribution
     */
    function emergencyWithdrawRewardPool(address payable to) external onlyOwner {
        require(to != address(0), "invalid-address");
        uint256 amount = rewardPool;
        rewardPool = 0;
        to.sendValue(amount);
    }
}

