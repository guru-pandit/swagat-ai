import { PrismaClient } from '@prisma/client';

/**
 * Generic base - extend once per prisma model.
 * TEntity -> the Prisma raw type e.g. User
 * TCreateInput -> Prisma.UserCreateInput
 * TUpdateInput -> Prisma.UserUpdateInput
 * TWhereUniqueInput -> Prisma.UserWhereUniqueInput
 * TWhereInput -> Prisma.UserWhereInput
 * TOrderByInput -> Prisma.UserOrderByInput
 */

export class BaseModel<
    TEntity,
    TCreateInput,
    TUpdateInput,
    TWhereUniqueInput,
    TWhereInput,
    TOrderByInput
> {
    protected db: any;

    constructor(delegate: any) {
        this.db = delegate;
    }

    findById(id: string) {
        return this.db.findUnique({ where: { id } }) as Promise<TEntity | null>;
    }

    findOne(where: TWhereUniqueInput) {
        return this.db.findUnique({ where }) as Promise<TEntity | null>;
    }

    findMany(
        args?: {
            where?: TWhereInput;
            orderBy?: TOrderByInput;
            take?: number;
            skip?: number;
        }) {
        // Prisma expects where/orderBy at the top level; wrapping them in `args` silently breaks filters.
        return this.db.findMany(args ?? {}) as Promise<TEntity[]>;
    }

    create(data: TCreateInput) {
        return this.db.create({ data }) as Promise<TEntity>;
    }

    update(id: string, data: TUpdateInput) {
        return this.db.update({ where: { id }, data }) as Promise<TEntity>;
    }

    delete(id: string) {
        return this.db.delete({ where: { id } }) as Promise<TEntity>;
    }

    count(where?: TWhereInput) {
        return this.db.count({ where }) as Promise<number>;
    }
}
