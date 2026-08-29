"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPremiumActive = isPremiumActive;
// Single source of truth for "is this user premium right now".
// The premiumStatus boolean is a cache; premiumExpiryDate is the real deadline.
// Reading the boolean alone lets an expired user keep paid features until some
// code path happens to flip it, so always check expiry here.
function isPremiumActive(user) {
    if (!user || !user.premiumStatus)
        return false;
    // If an expiry is set, enforce it. (No expiry => legacy/admin grant, leave as-is.)
    if (user.premiumExpiryDate && new Date(user.premiumExpiryDate).getTime() <= Date.now()) {
        return false;
    }
    return true;
}
//# sourceMappingURL=premium.js.map