import { prisma } from "../src/lib/prisma"

async function seed() {
    await prisma.event.create({
        data: {
            id: "3a123da9-e45b-46d0-ab8f-1d993a040e11",
            title: "Unite Summit",
            slug: "unite-summit",
            details: "Um evento para devs apaixonados(as) por código!",
            maximumAttendees: 120,
        }
    })
}

seed().then(() => {
    console.log("Database seeded!")
    prisma.$disconnect()
})
