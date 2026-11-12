import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// Un seed nunca debe ejecutarse contra producción. El chequeo es deliberadamente
// temprano: si el entorno está mal configurado, preferimos abortar antes de
// escribir una sola fila.
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run the seed with NODE_ENV=production.')
  process.exit(1)
}

async function main() {
  console.log('🌱 Starting seed...')

  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Demo user (idempotent by email)
  const demoUser = await db.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: passwordHash,
    },
  })
  console.log(`✓ Demo user: ${demoUser.email}`)

  // 2. Organizations (idempotent by slug)
  const acme = await db.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      ownerId: demoUser.id,
    },
  })
  console.log(`✓ Organization: ${acme.name} (owner: demo)`)

  const globex = await db.organization.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      name: 'Globex',
      slug: 'globex',
      ownerId: demoUser.id,
    },
  })
  console.log(`✓ Organization: ${globex.name}`)

  const initech = await db.organization.upsert({
    where: { slug: 'initech' },
    update: {},
    create: {
      name: 'Initech',
      slug: 'initech',
      ownerId: demoUser.id,
    },
  })
  console.log(`✓ Organization: ${initech.name}`)

  // 3. Memberships (idempotent by @@unique [userId, organizationId])
  await db.membership.upsert({
    where: { userId_organizationId: { userId: demoUser.id, organizationId: acme.id } },
    update: { role: Role.ADMIN },
    create: {
      userId: demoUser.id,
      organizationId: acme.id,
      role: Role.ADMIN,
    },
  })
  console.log(`✓ Membership: demo → Acme Corp (ADMIN)`)

  await db.membership.upsert({
    where: { userId_organizationId: { userId: demoUser.id, organizationId: globex.id } },
    update: { role: Role.MANAGER },
    create: {
      userId: demoUser.id,
      organizationId: globex.id,
      role: Role.MANAGER,
    },
  })
  console.log(`✓ Membership: demo → Globex (MANAGER)`)

  await db.membership.upsert({
    where: { userId_organizationId: { userId: demoUser.id, organizationId: initech.id } },
    update: { role: Role.VIEWER },
    create: {
      userId: demoUser.id,
      organizationId: initech.id,
      role: Role.VIEWER,
    },
  })
  console.log(`✓ Membership: demo → Initech (VIEWER)`)

  // 4. Projects: 5 per organization (15 total) — idempotent by (name, organizationId)
  const projectNames = [
    'E-commerce Platform',
    'Mobile App v2',
    'Dashboard Analytics',
    'API Gateway',
    'Client Portal',
  ]

  const organizations = [acme, globex, initech]
  let projectsCreated = 0
  let projectsSkipped = 0

  for (const org of organizations) {
    const existing = await db.project.findMany({
      where: { organizationId: org.id },
      select: { name: true },
    })
    const existingNames = new Set(existing.map((p) => p.name))

    for (const name of projectNames) {
      if (existingNames.has(name)) {
        projectsSkipped++
        continue
      }
      await db.project.create({
        data: {
          name,
          description: `Project ${name} for ${org.name}`,
          organizationId: org.id,
        },
      })
      projectsCreated++
    }
  }
  console.log(
    `✓ Projects: ${projectsCreated} new, ${projectsSkipped} already existed`,
  )

  // 5. Tasks: 20 per organization distributed across projects — idempotent
  const statuses = ['todo', 'in_progress', 'done'] as const
  let tasksCreated = 0
  let tasksSkipped = 0

  for (const org of organizations) {
    const projects = await db.project.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true },
    })

    for (let i = 0; i < 20; i++) {
      const project = projects[i % projects.length]
      const title = `Task ${i + 1} of ${project.name}`
      const existing = await db.task.findFirst({
        where: { title, projectId: project.id },
      })
      if (existing) {
        tasksSkipped++
        continue
      }
      await db.task.create({
        data: {
          title,
          status: statuses[i % statuses.length],
          projectId: project.id,
          assigneeId: i % 3 === 0 ? demoUser.id : null,
        },
      })
      tasksCreated++
    }
  }
  console.log(`✓ Tasks: ${tasksCreated} new, ${tasksSkipped} already existed`)

  // 6. Extra: 2000 tasks in Acme Corp to demonstrate virtualization with real volume.
  // In tests we keep the dataset small so E2E remains fast and deterministic.
  const bulkTaskCount = process.env.NODE_ENV === 'test' ? 0 : 2000
  const acmeProjects = await db.project.findMany({
    where: { organizationId: acme.id },
    select: { id: true, name: true },
  })
  let massiveCreated = 0
  let massiveSkipped = 0

  for (let i = 0; i < bulkTaskCount; i++) {
    const project = acmeProjects[i % acmeProjects.length]
    const title = `Bulk Task ${i + 1} - ${project.name}`
    const existing = await db.task.findFirst({
      where: { title },
    })
    if (existing) {
      massiveSkipped++
      continue
    }
    await db.task.create({
      data: {
        title,
        status: statuses[i % statuses.length],
        projectId: project.id,
        assigneeId: i % 5 === 0 ? demoUser.id : null,
      },
    })
    massiveCreated++
  }
  console.log(
    `✓ Bulk tasks: ${massiveCreated} new, ${massiveSkipped} already existed (Acme Corp)`,
  )

  console.log('✅ Seed completed successfully')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
