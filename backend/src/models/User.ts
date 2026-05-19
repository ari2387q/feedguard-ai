import mongoose, { Schema, Document } from 'mongoose';

/** Shape of a single daily stat entry stored in the dailyStats array */
export interface IDailyStat {
  date: string;
  timeSpent: number;
  filtered: number;
}

/** Full User document shape (extends Mongoose Document for type safety) */
export interface IUser extends Document {
  userId: string;
  videosFiltered: number;
  toxicBlocked: number;
  timeSpent: number;
  dailyStats: IDailyStat[];
  createdAt: Date;
  updatedAt: Date;
}

const DailyStatSchema = new Schema<IDailyStat>(
  {
    /** ISO date string (YYYY-MM-DD) */
    date: { type: String, required: true },
    /** Seconds spent browsing on this date */
    timeSpent: { type: Number, default: 0 },
    /** Number of videos filtered on this date */
    filtered: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    /** Unique identifier (extension install ID or future auth ID) */
    userId: { type: String, required: true, unique: true, index: true },
    /** Total videos flagged as clickbait */
    videosFiltered: { type: Number, default: 0 },
    /** Total toxic tweets/posts blocked */
    toxicBlocked: { type: Number, default: 0 },
    /** Cumulative time spent in seconds */
    timeSpent: { type: Number, default: 0 },
    /** Per-day breakdown of usage */
    dailyStats: { type: [DailyStatSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
