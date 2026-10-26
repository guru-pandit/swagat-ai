import { Prisma, WatchList } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { BaseModel } from '../lib/base.model.js';

/**--------- WatchList ---------- */
class WatchListModel extends BaseModel<
    WatchList,
    Prisma.WatchListCreateInput,
    Prisma.WatchListUpdateInput,
    Prisma.WatchListWhereUniqueInput,
    Prisma.WatchListWhereInput,
    Prisma.WatchListOrderByWithRelationInput
> {
    constructor() {
        super(prisma.watchList);
    }

    /** Case-insensitive partial match against active entries only. */
    findByName(fullName: string) {
        return this.db.findFirst({
            where: {
                isActive: true,
                fullName: {
                    contains: fullName.trim(),
                    mode: 'insensitive',
                }
            }
        }) as Promise<WatchList | null>;
    }
}

export const watchListModel = new WatchListModel();
