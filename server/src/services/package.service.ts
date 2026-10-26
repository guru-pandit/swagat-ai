import { packageModel, userModel } from '../models';
import { io } from '../sockets';
import { SOCKET_EVENTS } from '@swagat/shared';
import { AppError } from '../middleware/errorHandler';
import { MESSAGES, HTTP_STATUS_CODE, PACKAGE_STATUS } from '../constants';

interface LogData {
    carrier: string;
    trackingNo?: string;
    description?: string;
    recipientId: string;
    loggedById: string;
}

export const packageService = {
    async log(data: LogData) {
        if (!data.carrier?.trim() || !data.recipientId || data.carrier.trim().length > 80) {
            throw new AppError('Carrier and recipient are required.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        if ((data.description?.length ?? 0) > 300 || (data.trackingNo?.length ?? 0) > 120) {
            throw new AppError('Package description or tracking number is too long.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        const recipient = await userModel.findById(data.recipientId);
        if (!recipient || !recipient.isActive) throw new AppError('The selected recipient is unavailable.', HTTP_STATUS_CODE.NOT_FOUND);

        // Build the Prisma input from approved fields so callers cannot override package status or timestamps.
        const pkg = await packageModel.create({
            carrier: data.carrier.trim(),
            trackingNo: data.trackingNo?.trim() || undefined,
            description: data.description?.trim() || undefined,
            recipient: { connect: { id: data.recipientId } },
            loggedById: data.loggedById,
        });

        // Notify recipient in real-time
        io.to(`user:${data.recipientId}`).emit(
            SOCKET_EVENTS.PACKAGE_RECEIVED,
            {
                carrier: data.carrier,
                trackingNo: data.trackingNo,
                packageId: pkg.id,

            }
        );

        return pkg;
    },

    async collect(packageId: string) {
        const pkg = await packageModel.findById(packageId);
        if (!pkg) throw new AppError(MESSAGES.PACKAGE_NOT_FOUND, HTTP_STATUS_CODE.NOT_FOUND);
        if (pkg.status === PACKAGE_STATUS.PICKED_UP) throw new AppError(MESSAGES.PACKAGE_ALREADY_COLLECTED, HTTP_STATUS_CODE.BAD_REQUEST);
        return packageModel.update(
            packageId,
            {
                status: PACKAGE_STATUS.PICKED_UP,
                pickedUpAt: new Date(),
            });
    },

    pending() {
        // listPending() uses this.db internally - includes recipient relation 
        return packageModel.listPending();
    }
}
