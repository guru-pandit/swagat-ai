import { Prisma, User } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma';
import { BaseModel } from '../lib/base.model';

class UserModel extends BaseModel<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereUniqueInput,
    Prisma.UserWhereInput,
    Prisma.UserOrderByWithRelationInput
> {
    constructor() {
        super(prisma.user);
    }

    /** Extra query not on BaseModel - find by email */
    findByEmail(email: string) {
        return this.db.findUnique({ where: { email } }) as Promise<User | null>;
    }

    /** Google OAuth upsert - must use prisma.user directly (upsert not on delegate type) */
    upsertGoogle(googleId: string, data: Prisma.UserCreateInput) {
        return this.db.upsert({
            where: { googleId },
            create: data,
            update: {
                displayName: data.displayName,
                avatar: data.avatar
            },
        });
    }
}

export const userModel = new UserModel();