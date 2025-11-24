import { db } from '@/lib/db'

/**
 * Term abbreviations for class code generation
 */
const TERM_ABBREVIATIONS: Record<string, string> = {
  Fall: 'FA',
  Spring: 'SP',
  Summer: 'SU',
  Winter: 'WI',
}

/**
 * Generate a unique class code for a professor's class
 * Format: {PROF_SCHOOLID}-{COURSE_CODE}-{TERM}{YY}-{SECTION}
 * Example: ALI-CS101-FA25-01
 *
 * @param professorSchoolId - Professor's school ID (e.g., "ALI", "SMITH")
 * @param courseCode - Course code (e.g., "CS101")
 * @param term - Full term name (e.g., "Fall", "Spring")
 * @param year - Full year (e.g., 2025)
 * @param section - Section number (e.g., "01", "1", "02")
 * @returns Generated class code string
 */
export function generateClassCode(
  professorSchoolId: string,
  courseCode: string,
  term: string,
  year: number,
  section: string
): string {
  // Get term abbreviation
  const termAbbr = TERM_ABBREVIATIONS[term]
  if (!termAbbr) {
    throw new Error(`Invalid term: ${term}. Must be one of: Fall, Spring, Summer, Winter`)
  }

  // Get last 2 digits of year
  const yearShort = year.toString().slice(-2)

  // Pad section to 2 digits
  const sectionPadded = section.padStart(2, '0')

  // Generate class code
  const classCode = `${professorSchoolId}-${courseCode}-${termAbbr}${yearShort}-${sectionPadded}`

  return classCode.toUpperCase()
}

/**
 * Check if a class code already exists in the database
 *
 * @param classCode - The class code to check
 * @returns true if code exists, false otherwise
 */
export async function classCodeExists(classCode: string): Promise<boolean> {
  const existing = await db.class.findUnique({
    where: { classCode: classCode.toUpperCase() },
  })

  return existing !== null
}

/**
 * Generate a unique class code, ensuring it doesn't already exist
 * If the generated code exists, suggests incrementing the section number
 *
 * @param professorSchoolId - Professor's school ID
 * @param courseCode - Course code
 * @param term - Full term name
 * @param year - Full year
 * @param section - Section number
 * @returns Object with { classCode, isUnique, suggestion }
 */
export async function generateUniqueClassCode(
  professorSchoolId: string,
  courseCode: string,
  term: string,
  year: number,
  section: string
): Promise<{ classCode: string; isUnique: boolean; suggestion?: string }> {
  const classCode = generateClassCode(professorSchoolId, courseCode, term, year, section)
  const exists = await classCodeExists(classCode)

  if (!exists) {
    return { classCode, isUnique: true }
  }

  // Suggest next section number
  const nextSection = (parseInt(section, 10) + 1).toString().padStart(2, '0')
  const suggestion = `Class code ${classCode} already exists. Try section ${nextSection} instead.`

  return { classCode, isUnique: false, suggestion }
}

/**
 * Get the next available section number for a course/term/year combination
 *
 * @param professorId - Professor's ID
 * @param courseId - Course ID
 * @param term - Term name
 * @param year - Year
 * @returns Next available section number as string (e.g., "01", "02")
 */
export async function getNextAvailableSection(
  professorId: string,
  courseId: string,
  term: string,
  year: number
): Promise<string> {
  // Find all classes for this professor, course, term, and year
  const existingClasses = await db.class.findMany({
    where: {
      professorId,
      courseId,
      term,
      year,
    },
    select: {
      section: true,
    },
  })

  if (existingClasses.length === 0) {
    return '01'
  }

  // Parse all section numbers
  const sectionNumbers = existingClasses
    .map((cls) => parseInt(cls.section || '0', 10))
    .filter((num) => !isNaN(num))

  // Get max section number
  const maxSection = Math.max(...sectionNumbers, 0)

  // Return next section
  return (maxSection + 1).toString().padStart(2, '0')
}
