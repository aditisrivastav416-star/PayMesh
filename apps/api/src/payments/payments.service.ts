import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PayPalService } from '../paypal/paypal.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paypal: PayPalService,
  ) {}

  async create(
    agent: { id: string; ownerId: string },
    body: Record<string, unknown>,
  ) {
    const amount = body?.amount;
    const purpose = body?.purpose;
    const merchant = body?.merchant;
    if (
      typeof amount !== 'string' ||
      !/^(?:0|[1-9]\d*)\.\d{2}$/.test(amount) ||
      Number(amount) <= 0 ||
      amount.length > 10 ||
      typeof purpose !== 'string' ||
      !purpose.trim() ||
      purpose.length > 500 ||
      typeof merchant !== 'string' ||
      !merchant.trim() ||
      merchant.length > 100
    )
      throw new BadRequestException(
        'Valid USD amount, purpose and merchant are required',
      );
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: agent.ownerId },
    });
    return this.prisma.paymentRequest.create({
      data: {
        ownerId: agent.ownerId,
        agentId: agent.id,
        amountCents: Number(amount.replace('.', '')),
        purpose: purpose.trim(),
        merchant: merchant.trim(),
        status:
          Number(amount.replace('.', '')) <= owner.spendingLimitCents
            ? 'READY'
            : 'PENDING',
      },
    });
  }

  list(ownerId: string) {
    return this.prisma.paymentRequest.findMany({
      where: { ownerId },
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async owned(ownerId: string, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) throw new NotFoundException();
    const request = await this.prisma.paymentRequest.findFirst({
      where: { id, ownerId },
    });
    if (!request) throw new NotFoundException();
    return request;
  }

  async decide(ownerId: string, id: string, approve: boolean) {
    await this.owned(ownerId, id);
    const changed = await this.prisma.paymentRequest.updateMany({
      where: { id, ownerId, status: 'PENDING' },
      data: { status: approve ? 'READY' : 'REJECTED' },
    });
    if (!changed.count)
      throw new ConflictException('Request is no longer pending');
    return this.owned(ownerId, id);
  }

  async checkout(ownerId: string, id: string) {
    const request = await this.owned(ownerId, id);
    if (request.status === 'AWAITING_BUYER') return request;
    if (request.status !== 'READY' && request.status !== 'CREATING')
      throw new ConflictException('Request is not ready for checkout');
    await this.prisma.paymentRequest.updateMany({
      where: { id, ownerId, status: 'READY' },
      data: { status: 'CREATING' },
    });
    const order = await this.paypal.createOrder(
      (request.amountCents / 100).toFixed(2),
      id,
    );
    return this.prisma.paymentRequest.update({
      where: { id },
      data: {
        orderId: order.orderId,
        approveUrl: order.approveUrl,
        status: 'AWAITING_BUYER',
      },
    });
  }

  async capture(ownerId: string, id: string) {
    const request = await this.owned(ownerId, id);
    if (request.status === 'COMPLETED') return request;
    if (
      (request.status !== 'AWAITING_BUYER' && request.status !== 'CAPTURING') ||
      !request.orderId
    )
      throw new ConflictException('Buyer approval is required');
    await this.prisma.paymentRequest.updateMany({
      where: { id, ownerId, status: 'AWAITING_BUYER' },
      data: { status: 'CAPTURING' },
    });
    const result = await this.paypal.captureOrder(request.orderId);
    if (result.status !== 'COMPLETED' || !result.captureId)
      throw new ConflictException('PayPal did not complete the capture');
    return this.prisma.paymentRequest.update({
      where: { id },
      data: { status: 'COMPLETED', captureId: result.captureId },
    });
  }

  async limit(ownerId: string, value: unknown) {
    if (
      typeof value !== 'string' ||
      !/^(?:0|[1-9]\d*)\.\d{2}$/.test(value) ||
      value.length > 10
    )
      throw new BadRequestException('Limit must be a USD amount such as 1.00');
    return this.prisma.user.update({
      where: { id: ownerId },
      data: { spendingLimitCents: Number(value.replace('.', '')) },
      select: { spendingLimitCents: true },
    });
  }

  async getLimit(ownerId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { spendingLimitCents: true },
    });
  }
}
