import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { RequestPayment } from '../types';
import auth from "../middlewares/auth";
import mongoGenerator from "../mongoGenerator";
import { ObjectId } from "mongodb";
import { encrypt } from "../utils";

const PaymentStatusResponse = Type.Object({
    publicKey: Type.String(),
    // privateKey: Type.String(),
    amount: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    ipnCallbackUrl: Type.Optional(Type.String({ format: "uri" })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: "uri" })),
    payoutTransactionHash: Type.Optional(Type.String()),
    invoiceUrl: Type.String(),
});

const PaymentStatusQueryString = Type.Object({
    id: Type.String()
})

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            300: Type.String(),
            200: PaymentStatusResponse,
        },
        querystring: PaymentStatusQueryString
    },
    preHandler: auth
}

const String = Type.String();

export default function createPaymentStatusRoute(server: FastifyInstance) {
    server.get<{ Reply: Static<typeof PaymentStatusResponse> | Static<typeof String>, Querystring: Static<typeof PaymentStatusQueryString> }>(
        '/getPaymentStatus',
        opts,
        async (request, reply) => {
            const id = request.query.id;
            const { db } = await mongoGenerator();
            const selectedPayment: Record<string, any> | null = await db.collection('payments').findOne({ _id: new ObjectId(id) });
            if (!selectedPayment) {
                return reply.status(300).send("No payment found");
            }
            delete selectedPayment['privateKey'];
            selectedPayment.id = selectedPayment._id.toString();
            selectedPayment.createdAt = selectedPayment.createdAt.toISOString();
            selectedPayment.updatedAt = selectedPayment.updatedAt.toISOString();
            selectedPayment.expiresAt = selectedPayment.expiresAt.toISOString();
            selectedPayment.invoiceUrl = `/invoice/${selectedPayment.currency}/${encrypt(selectedPayment.id)}`
            delete selectedPayment._id;
            reply.status(200).send(selectedPayment as RequestPayment);
        }
    )
}