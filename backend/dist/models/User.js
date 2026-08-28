"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },
    appleId: { type: String, sparse: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    country: { type: String },
    profileImage: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: [{ type: String }],
    premiumStatus: { type: Boolean, default: false },
    premiumExpiryDate: { type: Date },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    referralCount: { type: Number, default: 0 },
    referralRewardDays: { type: Number, default: 0 },
    liveEarnings: { type: Number, default: 0 },
    blockedUsers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    chatsThisWeek: { type: Number, default: 0 },
    lastChatResetDate: { type: Date, default: Date.now },
    isBanned: { type: Boolean, default: false },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map