import { Prisma, KnowledgeBase } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { BaseModel } from '../lib/base.model.js';

/**--------- KnowledgeBase ---------- */
class KnowledgeBaseModel extends BaseModel<
    KnowledgeBase,
    Prisma.KnowledgeBaseCreateInput,
    Prisma.KnowledgeBaseUpdateInput,
    Prisma.KnowledgeBaseWhereUniqueInput,
    Prisma.KnowledgeBaseWhereInput,
    Prisma.KnowledgeBaseOrderByWithRelationInput
> {
    constructor() {
        super(prisma.knowledgeBase);
    }

    /** Full-test search across question +  answer - sed by the AI service */
    search(query: string) {
        return this.db.findMany({
            where: {
                OR: [
                    { question: { contains: query, mode: "insensitive" } },
                    { answer: { contains: query, mode: "insensitive" } },
                ],
            },
        });
    }
}

export const knowledgeBaseModel = new KnowledgeBaseModel();