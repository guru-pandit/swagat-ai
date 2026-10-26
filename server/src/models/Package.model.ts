import { Prisma, Package } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { BaseModel } from '../lib/base.model.js';

/**--------- Package ---------- */
class PackageModel extends BaseModel<
    Package,
    Prisma.PackageCreateInput,
    Prisma.PackageUpdateInput,
    Prisma.PackageWhereUniqueInput,
    Prisma.PackageWhereInput,
    Prisma.PackageOrderByWithRelationInput
> {
    constructor() {
        super(prisma.package);
    }

    collect(id: string) {
        return this.db.update({
            where: { id },
            data: {
                status: 'PICKED_UP',
                pickedUpAt: new Date(),
            }
        });
    }

    listPending() {
        return this.db.findMany({
            where: { status: "PENDING" },
            include: { recipient: true },
            orderBy: { arrivedAt: 'asc' }
        });
    }
}

export const packageModel = new PackageModel();
