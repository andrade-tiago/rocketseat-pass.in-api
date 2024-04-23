import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma"

export async function getEventAttendees(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .get("/events/:eventId/attendees", {
            schema: {
                summary: "Get event attendees",
                tags: ["events"],
                params: z.object({
                    eventId: z.string().uuid()
                }),
                querystring: z.object({
                    pageIndex: z.string().nullish().default("0").transform(Number),
                    query: z.string().nullish(),
                }),
                response: {
                    200: z.object({
                        attendees: z.array(
                            z.object({
                                id: z.number(),
                                name: z.string(),
                                email: z.string().email(),
                                createdAt: z.date(),
                                checkedInAt: z.date().nullable(),
                            }),
                        ),
                        total: z.number(),
                    }),
                },
            },
        }, async (request, reply) => {
            const { eventId } = request.params
            const { pageIndex, query } = request.query

            const itemsPerPage = 10;
            const [attendees, total] = await Promise.all([
                prisma.attendee.findMany({
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createAt: true,
                        checkIn: {
                            select: {
                                createAt: true,
                            },
                        },
                    },
                    where: query ? {
                        eventId,
                        name: {
                            contains: query,
                        },
                    } : {
                        eventId,
                    },
                    take: itemsPerPage,
                    skip: pageIndex * itemsPerPage,
                    orderBy: {
                        createAt: "desc",
                    },
                }),
                prisma.attendee.count({
                    where: query ? {
                        eventId,
                        name: {
                            contains: query,
                        }
                    } : {
                        eventId,
                    },
                }),
            ])

            return reply.send({
                attendees: attendees.map(attendee => ({
                    id: attendee.id,
                    name: attendee.name,
                    email: attendee.email,
                    createdAt: attendee.createAt,
                    checkedInAt: attendee.checkIn?.createAt ?? null,
                })),
                total,
            })
        })
}
