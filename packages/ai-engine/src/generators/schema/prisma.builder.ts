import type {
  EntitySchema,
  FieldSchema,
  RelationSchema,
} from '@oneatlas/shared';

const buildFieldLine = (field: FieldSchema): string => {
  const attributes: string[] = [];

  if (field.isId) {
    attributes.push('@id');
    attributes.push('@default(cuid())');
  }

  if (field.name === 'createdAt') {
    attributes.push('@default(now())');
  }

  if (field.name === 'updatedAt') {
    attributes.push('@updatedAt');
  }

  if (field.isUnique) {
    attributes.push('@unique');
  }

  return `  ${field.name} ${field.prismaType} ${attributes.join(' ')}`.trim();
};

const buildScalarForeignKeyLine = (
  relation: RelationSchema,
): string | null => {
  if (!relation.foreignKeyField) return null;
  const required = relation.isRequired && relation.type === 'one-to-one';
  const unique = relation.type === 'one-to-one' ? ' @unique' : '';
  return `  ${relation.foreignKeyField} String${required ? '' : '?'}${unique}`;
};

const buildRelationLine = (
  entity: EntitySchema,
  relation: RelationSchema,
): string | null => {
  if (relation.type === 'one-to-many') {
    if (entity.name === relation.fromEntity) {
      return `  ${relation.fieldName} ${relation.toEntity}[] @relation("${relation.relationName}")`;
    }

    if (entity.name === relation.toEntity) {
      return `  ${relation.inverseFieldName} ${relation.fromEntity}? @relation("${relation.relationName}", fields: [${relation.foreignKeyField}], references: [${relation.references ?? 'id'}], onDelete: SetNull)`;
    }

    return null;
  }

  if (relation.type === 'many-to-many') {
    if (entity.name === relation.fromEntity) {
      return `  ${relation.fieldName} ${relation.toEntity}[] @relation("${relation.relationName}")`;
    }

    if (entity.name === relation.toEntity) {
      return `  ${relation.inverseFieldName} ${relation.fromEntity}[] @relation("${relation.relationName}")`;
    }

    return null;
  }

  if (relation.type === 'one-to-one') {
    if (entity.name === relation.fromEntity) {
      return `  ${relation.fieldName} ${relation.toEntity}? @relation("${relation.relationName}")`;
    }

    if (entity.name === relation.toEntity) {
      return `  ${relation.inverseFieldName} ${relation.fromEntity} @relation("${relation.relationName}", fields: [${relation.foreignKeyField}], references: [${relation.references ?? 'id'}], onDelete: Cascade)`;
    }
  }

  return null;
};

const buildModelBlock = (entity: EntitySchema): string => {
  const fieldLines = entity.fields.map(buildFieldLine);

  const foreignKeyLines = entity.relations
    .filter((relation) => relation.ownerEntity === entity.name)
    .map(buildScalarForeignKeyLine)
    .filter((line): line is string => Boolean(line));

  const relationLines = entity.relations
    .map((relation) => buildRelationLine(entity, relation))
    .filter((line): line is string => Boolean(line));

  return `
model ${entity.name} {
${[...fieldLines, ...foreignKeyLines, ...relationLines].join('\n')}

  @@index([tenantId])
  @@map("${entity.tableName}")
}`.trim();
};

export const buildPrismaSchema = (
  entities: EntitySchema[],
): string => {
  const header = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`.trim();

  const models = entities.map(buildModelBlock).join('\n\n');

  return `${header}\n\n${models}`;
};

export const normalizePrismaSchema = (
  entities: EntitySchema[],
): EntitySchema[] => {
  return entities.map((entity) => ({
    ...entity,
    relations: entity.relations.filter((relation) =>
      [relation.fromEntity, relation.toEntity].includes(entity.name),
    ),
  }));
};

export const repairPrismaSchema = (content: string): string => {
  return content
    .replace(/\s+@relation\("([^"]+)"\)\s+@relation\("\1"\)/g, ' @relation("$1")')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const validatePrismaSchema = (
  content: string,
): { valid: boolean; error?: string } => {
  if (!content.includes('generator client') || !content.includes('datasource db')) {
    return {
      valid: false,
      error: 'Generated Prisma schema is missing a generator or datasource block.',
    };
  }

  return { valid: true };
};

export const prismaBuilder = {
  build: buildPrismaSchema,
  normalize: normalizePrismaSchema,
  repair: repairPrismaSchema,
  validate: validatePrismaSchema,
};

export default prismaBuilder;
