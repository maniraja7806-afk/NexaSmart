import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole =
  | 'Super Admin'
  | 'Campus Administrator'
  | 'Facility Manager'
  | 'Security Officer'
  | 'Maintenance Technician'
  | 'Energy Manager'
  | 'Water Manager'
  | 'Department Administrator'
  | 'Viewer';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  department?: string;
  assignedBuildings?: mongoose.Types.ObjectId[];
  isActive: boolean;
  rfidCardUid?: string;
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        'Super Admin',
        'Campus Administrator',
        'Facility Manager',
        'Security Officer',
        'Maintenance Technician',
        'Energy Manager',
        'Water Manager',
        'Department Administrator',
        'Viewer',
      ],
      default: 'Viewer',
      index: true,
    },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    assignedBuildings: [{ type: Schema.Types.ObjectId, ref: 'Building' }],
    isActive: { type: Boolean, default: true },
    rfidCardUid: { type: String, sparse: true, uppercase: true, trim: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
