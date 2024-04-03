import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma"

export async function getEventAttendees(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .get("/events/:eventId/attendees", {
            schema: {
                summary: "Get an event attendees",
                tags: ["events"],
                params: z.object({
                    eventId: z.string().uuid()
                }),
                querystring: z.object({
                    query: z.string().nullish(),
                    pageIndex: z.string().nullish().default("0").transform(Number),
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
                            })
                        ),
                    }),
                },
            },
        }, async (request, reply) => {
            const { eventId } = request.params
            const { query, pageIndex } = request.query

            const itensForPage = 10;
            const attendees = await prisma.attendee.findMany({
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
                take: itensForPage,
                skip: pageIndex * itensForPage,
                orderBy: {
                    createAt: "desc",
                },
            })

            return reply.send({
                attendees: attendees.map(attendee => {
                    return {
                        id: attendee.id,
                        name: attendee.name,
                        email: attendee.email,
                        createdAt: attendee.createAt,
                        checkedInAt: attendee.checkIn?.createAt ?? null,
                    }
                }),
            })
        })
}
