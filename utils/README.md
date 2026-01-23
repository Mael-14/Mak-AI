# Subject Mapping Utility

This utility provides mapping between frontend subject IDs and GCE subject codes.

## Usage

### Import the mapping utilities

```javascript
import { getSubjectCode, getSubjectName, SUBJECT_ID_TO_CODE } from '../utils/subjectMapping';
import { examAPI } from '../services/api';
```

### Get Subject Code by ID and Level

```javascript
// Get subject code for Mathematics (ID: 1) at Ordinary Level
const code = getSubjectCode(1, 'Ordinary Level'); // Returns '0570'

// Get subject code for Biology (ID: 2) at Advance Level
const code = getSubjectCode(2, 'Advance Level'); // Returns '9700'
```

### Fetch Questions Using Subject ID

```javascript
// Fetch questions using subject ID and level (recommended)
const questions = await examAPI.getQuestionsBySubjectId(1, 'Ordinary Level');

// Or fetch using subject code directly
const questions = await examAPI.getQuestions('0570', 'Ordinary Level');
```

### Get Subject Name

```javascript
const name = getSubjectName(1); // Returns 'Mathematics'
```

## Subject ID Mapping

| ID | Subject Name | Ordinary Level Code | Advance Level Code |
|----|--------------|-------------------|-------------------|
| 1  | Mathematics  | 0570              | 9709              |
| 2  | Biology      | 0610              | 9700              |
| 3  | Chemistry    | 0620              | 9701              |
| 4  | Physics      | 0625              | 9702              |
| 5  | Computer Science | 0478          | 9608              |
| 6  | Math Stats   | 4040              | 9709              |
| 7  | Geography    | 0460              | 9696              |
| 8  | Further Math | 0606              | 9231              |

## Example: Using in a Screen Component

```javascript
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { examAPI } from '../services/api';

const QuestionScreen = () => {
  const { subjectId, level } = useLocalSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await examAPI.getQuestionsBySubjectId(
          parseInt(subjectId),
          level || 'Ordinary Level'
        );
        setQuestions(response.data || response);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (subjectId && level) {
      fetchQuestions();
    }
  }, [subjectId, level]);

  // ... rest of component
};
```

## Notes

- Subject codes are based on standard GCE/IGCSE codes
- If you need to update codes, modify `utils/subjectMapping.js`
- The mapping supports both Ordinary Level (O-Level) and Advance Level (A-Level)
- Always pass the level parameter when fetching questions to ensure correct filtering

