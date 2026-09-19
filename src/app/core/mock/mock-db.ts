import { Organizer } from '../auth/auth.model';

interface StoredOrganizer extends Organizer {
  passwordObfuscated: string;
}

interface DbSchema {
  organizers: StoredOrganizer[];
  tokens: Record<string, string>;
}

const STORAGE_KEY = 'events_planner::mock-auth-db::v1';

function obfuscate(password: string): string {
  return btoa(unescape(encodeURIComponent(password)));
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function buildSeed(): DbSchema {
  return {
    organizers: [
      {
        id: 'org-demo-a',
        name: 'Julián Tejada',
        email: 'demo@eventos.test',
        passwordObfuscated: obfuscate('demo1234')
      },
      {
        id: 'org-demo-b',
        name: 'Organizadora Beta',
        email: 'beta@eventos.test',
        passwordObfuscated: obfuscate('demo1234')
      }
    ],
    tokens: {}
  };
}

function readDb(): DbSchema {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeed();
    writeDb(seeded);
    return seeded;
  }

  try {
    return JSON.parse(raw) as DbSchema;
  } catch {
    const seeded = buildSeed();
    writeDb(seeded);
    return seeded;
  }
}

function writeDb(db: DbSchema): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function toPublicOrganizer(organizer: StoredOrganizer): Organizer {
  return { id: organizer.id, name: organizer.name, email: organizer.email };
}

/**
 * events-api no documenta endpoints de autenticación (ver README.md); el login/registro
 * de la demo se simula aquí contra localStorage mientras el backend real no exponga uno
 * propio. El resto de recursos (eventos, subtareas, capacidad, conflictos, hoy) consumen
 * siempre el backend real — ver mock-api.interceptor.ts.
 */
export const mockDb = {
  resetForTests(): void {
    writeDb(buildSeed());
  },

  findOrganizerByEmail(email: string): StoredOrganizer | undefined {
    const db = readDb();
    return db.organizers.find(
      (organizer) => organizer.email.toLowerCase() === email.trim().toLowerCase()
    );
  },

  verifyPassword(organizer: StoredOrganizer, password: string): boolean {
    return organizer.passwordObfuscated === obfuscate(password);
  },

  createOrganizer(input: { name: string; email: string; password: string }): Organizer {
    const db = readDb();
    const organizer: StoredOrganizer = {
      id: createId('org'),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordObfuscated: obfuscate(input.password)
    };
    db.organizers.push(organizer);
    writeDb(db);
    return toPublicOrganizer(organizer);
  },

  createToken(organizerId: string): string {
    const db = readDb();
    const token = createId('tok');
    db.tokens[token] = organizerId;
    writeDb(db);
    return token;
  },

  resolveToken(token: string | null): Organizer | undefined {
    if (!token) {
      return undefined;
    }
    const db = readDb();
    const organizerId = db.tokens[token];
    const organizer = db.organizers.find((item) => item.id === organizerId);
    return organizer ? toPublicOrganizer(organizer) : undefined;
  },

  toPublicOrganizer
};
