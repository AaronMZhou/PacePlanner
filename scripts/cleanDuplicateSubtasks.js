const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const assignments = await prisma.assignment.findMany({
    include: {
      subtasks: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  let deletedCount = 0

  for (const assignment of assignments) {
    const subtasksByKey = new Map()

    for (const subtask of assignment.subtasks) {
      const key = `${subtask.order}|${subtask.label}`
      if (!subtasksByKey.has(key)) {
        subtasksByKey.set(key, [])
      }
      subtasksByKey.get(key).push(subtask)
    }

    for (const [key, subtasks] of subtasksByKey.entries()) {
      if (subtasks.length <= 1) {
        continue
      }

      subtasks.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? -1 : 1
        }
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      const [toKeep, ...duplicates] = subtasks

      for (const duplicate of duplicates) {
        await prisma.subtask.delete({
          where: { id: duplicate.id }
        })
        deletedCount++
        console.log(
          `Deleted duplicate subtask ${duplicate.id} (assignment ${assignment.id}, key ${key})`
        )
      }

      console.log(
        `Keeping subtask ${toKeep.id} for assignment ${assignment.id} key ${key}`
      )
    }
  }

  console.log(`Removed ${deletedCount} duplicate subtasks.`)
}

main()
  .catch((error) => {
    console.error('Failed to clean duplicate subtasks:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
