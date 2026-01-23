/**
 * Subject ID to Subject Code Mapping (Backend)
 * Maps the frontend subject IDs (1-8) to GCE subject codes
 */

const SUBJECT_ID_TO_CODE = {
  // Subject ID: { ordinaryLevel: 'code', advanceLevel: 'code' }
  1: {
    name: 'Mathematics',
    ordinaryLevel: '0570', // Mathematics (O-Level)
    advanceLevel: '9709',  // Mathematics (A-Level)
  },
  2: {
    name: 'Biology',
    ordinaryLevel: '0610', // Biology (O-Level)
    advanceLevel: '9700',  // Biology (A-Level)
  },
  3: {
    name: 'Chemistry',
    ordinaryLevel: '0620', // Chemistry (O-Level)
    advanceLevel: '9701',  // Chemistry (A-Level)
  },
  4: {
    name: 'Physics',
    ordinaryLevel: '0625', // Physics (O-Level)
    advanceLevel: '9702',  // Physics (A-Level)
  },
  5: {
    name: 'Computer Science',
    ordinaryLevel: '0478', // Computer Science (O-Level)
    advanceLevel: '9608',  // Computer Science (A-Level)
  },
  6: {
    name: 'Math Stats',
    ordinaryLevel: '4040', // Statistics (O-Level)
    advanceLevel: '9709',  // Statistics (A-Level)
  },
  7: {
    name: 'Geography',
    ordinaryLevel: '0460', // Geography (O-Level)
    advanceLevel: '9696',  // Geography (A-Level)
  },
  8: {
    name: 'Further Math',
    ordinaryLevel: '0606', // Additional Mathematics (O-Level)
    advanceLevel: '9231',  // Further Mathematics (A-Level)
  },
};

/**
 * Get subject code based on subject ID and level
 * @param {number} subjectId - The subject ID (1-8)
 * @param {string} level - The level ('Ordinary Level' or 'Advance Level')
 * @returns {string|null} The subject code or null if not found
 */
const getSubjectCode = (subjectId, level) => {
  const subject = SUBJECT_ID_TO_CODE[subjectId];
  if (!subject) {
    console.warn(`Subject ID ${subjectId} not found in mapping`);
    return null;
  }

  if (level === 'Ordinary Level') {
    return subject.ordinaryLevel;
  } else if (level === 'Advance Level') {
    return subject.advanceLevel;
  }

  console.warn(`Invalid level: ${level}. Expected 'Ordinary Level' or 'Advance Level'`);
  return null;
};

/**
 * Get subject name by ID
 * @param {number} subjectId - The subject ID (1-8)
 * @returns {string|null} The subject name or null if not found
 */
const getSubjectName = (subjectId) => {
  const subject = SUBJECT_ID_TO_CODE[subjectId];
  return subject ? subject.name : null;
};

module.exports = {
  SUBJECT_ID_TO_CODE,
  getSubjectCode,
  getSubjectName,
};

