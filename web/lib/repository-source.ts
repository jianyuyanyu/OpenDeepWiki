export const REPOSITORY_SOURCE_TYPE_NAMES = ["Git", "Archive", "LocalDirectory"] as const;

export type RepositorySourceTypeName = (typeof REPOSITORY_SOURCE_TYPE_NAMES)[number];
export type RepositorySourceTypeValue = RepositorySourceTypeName | 0 | 1 | 2;

function normalizeNumericRepositorySourceType(value: number): RepositorySourceTypeName | null {
  switch (value) {
    case 0:
      return "Git";
    case 1:
      return "Archive";
    case 2:
      return "LocalDirectory";
    default:
      return null;
  }
}

function normalizeNamedRepositorySourceType(value: unknown): RepositorySourceTypeName | null {
  if (typeof value !== "string") return null;

  switch (value.trim().toLowerCase()) {
    case "git":
      return "Git";
    case "archive":
      return "Archive";
    case "localdirectory":
    case "local-directory":
    case "local_directory":
      return "LocalDirectory";
    default:
      return null;
  }
}

export function normalizeRepositorySourceType(
  sourceType: RepositorySourceTypeValue | string | number | null | undefined,
  sourceTypeName?: RepositorySourceTypeName | string | null
): RepositorySourceTypeName {
  const namedSourceType = normalizeNamedRepositorySourceType(sourceTypeName);
  if (namedSourceType) return namedSourceType;

  const sourceTypeNameFromValue = normalizeNamedRepositorySourceType(sourceType);
  if (sourceTypeNameFromValue) return sourceTypeNameFromValue;

  if (typeof sourceType === "number") {
    return normalizeNumericRepositorySourceType(sourceType) ?? "Git";
  }

  if (typeof sourceType === "string" && sourceType.trim() !== "") {
    const numericSourceType = Number(sourceType);
    if (Number.isInteger(numericSourceType)) {
      return normalizeNumericRepositorySourceType(numericSourceType) ?? "Git";
    }
  }

  return "Git";
}

export function isGitRepositorySource(
  sourceType: RepositorySourceTypeValue | string | number | null | undefined,
  sourceTypeName?: RepositorySourceTypeName | string | null
) {
  return normalizeRepositorySourceType(sourceType, sourceTypeName) === "Git";
}

export function getRepositorySourceTypeLabelKey(
  sourceType: RepositorySourceTypeValue | string | number | null | undefined,
  sourceTypeName?: RepositorySourceTypeName | string | null
) {
  switch (normalizeRepositorySourceType(sourceType, sourceTypeName)) {
    case "Archive":
      return "sourceTypeArchive";
    case "LocalDirectory":
      return "sourceTypeLocal";
    default:
      return "sourceTypeGit";
  }
}
