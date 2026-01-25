import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // Upsert user from auth provider info
  async upsertAuthUser(input: {
    clerkUserId: string;
    email: string;
    name: string;
  }): Promise<User> {
    const now = new Date();
    return this.userModel
      .findOneAndUpdate(
        { clerkUserId: input.clerkUserId },
        {
          $set: {
            email: input.email,
            name: input.name,
            lastSeenAt: now,
          },
          $setOnInsert: {
            role: 'user',
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  // Find user by clerkUserid
  async findByClerkUserId(clerkUserId: string): Promise<User | null> {
    return this.userModel.findOne({ clerkUserId }).exec();
  }
}
