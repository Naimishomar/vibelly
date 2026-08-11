import { Types } from 'mongoose';
export declare const REWARD_DAYS_PER_REFERRAL = 3;
export declare const ensureReferralCode: (userId: string) => Promise<string>;
/**
 * Extend a user's premium by `days`. Persists and also bumps `premiumStatus`.
 */
export declare const grantPremiumDays: (userId: string, days: number) => Promise<(import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | null>;
/**
 * Claim a referral: called by a newly-registered (or first-time) user
 * right after auth. Rewards BOTH the referrer and the referred user.
 */
export declare const claimReferral: (userId: string, code: string) => Promise<{
    referred: import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    referrer: import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    rewardDays: number;
}>;
//# sourceMappingURL=referral.service.d.ts.map