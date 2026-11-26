export const PROJECT_PATH_LIMITS = {
  folder: 100,
  file: 120,
  fileName: 80
} as const

export const PROJECT_FILE_EXTENSIONS = ['html', 'css', 'js'] as const

const SEGMENT_CHARACTER_RE = /^[\p{L}\p{N}._-]$/u
const FILE_NAME_START_RE = /^[\p{L}\p{N}]/u

export type ProjectLanguage = typeof PROJECT_FILE_EXTENSIONS[number]

export type ProjectPathErrorCode =
  | 'required'
  | 'structure'
  | 'length'
  | 'characters'
  | 'extension'
  | 'filename'

export type ProjectPathValidation =
  | {
      ok: true
      path: string
      language?: ProjectLanguage
    }
  | {
      ok: false
      code: ProjectPathErrorCode
      message: string
      invalidCharacters?: string[]
    }

function characterLength(value: string) {
  return [...value].length
}

function quoted(value: string) {
  return JSON.stringify(value)
}

function quotedList(values: string[]) {
  if (values.length < 2) return values[0] || ''
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`
}

function unsupportedCharacters(path: string) {
  const invalid: string[] = []
  const seen = new Set<string>()
  for (const character of path) {
    if (character === '/' || SEGMENT_CHARACTER_RE.test(character) || seen.has(character)) continue
    seen.add(character)
    invalid.push(character)
  }
  return invalid
}

function structureError(path: string, kind: 'File' | 'Folder'): ProjectPathValidation | null {
  if (!path || !path.trim()) {
    return { ok: false, code: 'required', message: `${kind} path is required.` }
  }
  if (path.startsWith('/') || path.endsWith('/')) {
    return {
      ok: false,
      code: 'structure',
      message: `${kind} paths must not start or end with "/".`
    }
  }
  if (path.includes('\\')) {
    return {
      ok: false,
      code: 'characters',
      message: `${kind} paths must use "/" as the folder separator.`
    }
  }
  const segments = path.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    return {
      ok: false,
      code: 'structure',
      message: `${kind} paths must not contain empty, "." or ".." segments.`
    }
  }
  return null
}

function characterError(path: string, kind: 'File' | 'Folder'): ProjectPathValidation | null {
  const invalidCharacters = unsupportedCharacters(path)
  if (!invalidCharacters.length) return null
  const label = invalidCharacters.length === 1 ? 'character' : 'characters'
  const formatted = quotedList(invalidCharacters.map(character => quoted(character)))
  return {
    ok: false,
    code: 'characters',
    message: `${kind} path ${quoted(path)} contains the unsupported ${label} ${formatted}. `
      + 'Use only Unicode letters (including Chinese), numbers, dots, underscores and hyphens. '
      + 'Spaces, brackets and other symbols are not allowed.',
    invalidCharacters
  }
}

export function validateFolderPath(value: string): ProjectPathValidation {
  const structure = structureError(value, 'Folder')
  if (structure) return structure

  const characters = characterError(value, 'Folder')
  if (characters) return characters

  if (characterLength(value) > PROJECT_PATH_LIMITS.folder) {
    return {
      ok: false,
      code: 'length',
      message: `Folder path ${quoted(value)} is too long. Use ${PROJECT_PATH_LIMITS.folder} characters or fewer.`
    }
  }

  return { ok: true, path: value }
}

export function validateFilePath(value: string): ProjectPathValidation {
  const structure = structureError(value, 'File')
  if (structure) return structure

  const parts = value.split('/')
  const baseName = parts[parts.length - 1] || ''
  const segments = parts.slice(0, -1)
  const characters = characterError(value, 'File')
  if (characters) return characters

  if (characterLength(value) > PROJECT_PATH_LIMITS.file) {
    return {
      ok: false,
      code: 'length',
      message: `File path ${quoted(value)} is too long. Use ${PROJECT_PATH_LIMITS.file} characters or fewer.`
    }
  }

  let folderPrefix = ''
  for (const segment of segments) {
    folderPrefix = folderPrefix ? `${folderPrefix}/${segment}` : segment
    if (characterLength(folderPrefix) > PROJECT_PATH_LIMITS.folder) {
      return {
        ok: false,
        code: 'length',
        message: `Folder path ${quoted(folderPrefix)} is too long. Use ${PROJECT_PATH_LIMITS.folder} characters or fewer.`
      }
    }
  }

  const dot = baseName.lastIndexOf('.')
  const extension = dot > 0 ? baseName.slice(dot + 1) : ''
  if (!PROJECT_FILE_EXTENSIONS.includes(extension as ProjectLanguage)) {
    return {
      ok: false,
      code: 'extension',
      message: 'File names must end with lowercase .html, .css or .js.'
    }
  }

  if (characterLength(baseName) > PROJECT_PATH_LIMITS.fileName) {
    return {
      ok: false,
      code: 'filename',
      message: `File name ${quoted(baseName)} is too long. Use ${PROJECT_PATH_LIMITS.fileName} characters or fewer, including the extension.`
    }
  }

  if (!FILE_NAME_START_RE.test(baseName)) {
    return {
      ok: false,
      code: 'filename',
      message: 'File names must start with a Unicode letter or number.'
    }
  }

  return {
    ok: true,
    path: value,
    language: extension as ProjectLanguage
  }
}

export function languageFromFilePath(path: string): ProjectLanguage | null {
  const validation = validateFilePath(path)
  return validation.ok ? validation.language || null : null
}
