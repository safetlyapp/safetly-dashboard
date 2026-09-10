import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { children, parents } from '../src/db/schema';

const records = [
  {
    name: 'Rahim Uddin',
    email: 'rahim.uddin@example.com',
    password: 'P@ss1234',
    childs: [
      {
        username: 'rahim_jr1',
        email: 'rahimjr1@example.com',
        password: 'Child@001',
        expireDate: '2026-12-31',
      },
      {
        username: 'rahim_jr2',
        email: 'rahimjr2@example.com',
        password: 'Child@002',
        expireDate: '2025-06-15',
      },
    ],
  },
  {
    name: 'Karim Ahmed',
    email: 'karim.ahmed@example.com',
    password: 'Karim#5678',
    childs: [
      {
        username: 'karim_baby',
        email: 'karimbaby@example.com',
        password: 'Child@003',
        expireDate: '2027-01-20',
      },
    ],
  },
  {
    name: 'Fatema Begum',
    email: 'fatema.begum@example.com',
    password: 'Fatema$9012',
    childs: [
      {
        username: 'fatema_kid1',
        email: 'fatemakid1@example.com',
        password: 'Child@004',
        expireDate: '2026-03-10',
      },
      {
        username: 'fatema_kid2',
        email: 'fatemakid2@example.com',
        password: 'Child@005',
        expireDate: '2024-11-05',
      },
      {
        username: 'fatema_kid3',
        email: 'fatemakid3@example.com',
        password: 'Child@006',
        expireDate: '2026-08-22',
      },
    ],
  },
  {
    name: 'Nasrin Akter',
    email: 'nasrin.akter@example.com',
    password: 'Nasrin!3456',
    childs: [
      {
        username: 'nasrin_son',
        email: 'nasrinson@example.com',
        password: 'Child@007',
        expireDate: '2025-09-30',
      },
    ],
  },
];

async function main() {
  for (const record of records) {
    let [parent] = await db()
      .select()
      .from(parents)
      .where(eq(parents.email, record.email))
      .limit(1);
    if (!parent) {
      [parent] = await db()
        .insert(parents)
        .values({
          name: record.name,
          email: record.email,
          passwordHash: await bcrypt.hash(record.password, 12),
        })
        .returning();
    }
    for (const child of record.childs) {
      const [existing] = await db()
        .select({ id: children.id })
        .from(children)
        .where(eq(children.email, child.email))
        .limit(1);
      if (!existing)
        await db()
          .insert(children)
          .values({
            parentId: parent.id,
            username: child.username,
            email: child.email,
            passwordHash: await bcrypt.hash(child.password, 12),
            expireDate: new Date(`${child.expireDate}T23:59:59.000Z`),
          });
    }
  }
  console.log('Parent and child demo accounts seeded.');
}

void main();
