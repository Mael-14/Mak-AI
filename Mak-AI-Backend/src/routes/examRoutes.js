// backend/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { getSubjectCode, getSubjectName } = require('../utils/subjectMapping');

/**
 * Get questions by subject code
 * GET /api/exams/questions/:subjectCode?level=Ordinary Level
 */
router.get('/questions/:subjectCode', async (req, res) => {
    try {
        const { subjectCode } = req.params;
        const { level } = req.query; // Get level from query parameters

        // Build query to find exams matching subject code and optionally level
        let examsQuery = db.collection('exams')
            .where('subjectCode', '==', subjectCode);

        // If level is provided, filter by level
        if (level) {
            examsQuery = examsQuery.where('level', '==', level);
        }

        const examsSnapshot = await examsQuery.get();

        if (examsSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: `No exams found for subject code ${subjectCode}${level ? ` with level ${level}` : ''}`
            });
        }

        // Get questions from the first matching exam
        const examDoc = examsSnapshot.docs[0];
        const examData = examDoc.data();

        const questionsSnapshot = await examDoc.ref
            .collection('questions')
            .orderBy('id')
            .get();

        const questions = questionsSnapshot.docs.map(doc => doc.data());

        res.status(200).json({
            success: true,
            data: questions,
            examInfo: {
                subjectCode: examData.subjectCode,
                mathType: examData.mathType,
                level: examData.level,
                paper: examData.paper,
                year: examData.year
            }
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get questions by subject ID
 * GET /api/exams/questions-by-id/:subjectId?level=Ordinary Level
 * This route converts subject ID to subject code automatically
 */
router.get('/questions-by-id/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { level } = req.query;

        // Validate subjectId
        const subjectIdNum = parseInt(subjectId);
        if (isNaN(subjectIdNum) || subjectIdNum < 1 || subjectIdNum > 8) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID. Must be between 1 and 8.'
            });
        }

        // Validate level
        if (!level) {
            return res.status(400).json({
                success: false,
                error: 'Level parameter is required. Use "Ordinary Level" or "Advance Level".'
            });
        }

        // Convert subject ID to subject code
        const subjectCode = getSubjectCode(subjectIdNum, level);
        if (!subjectCode) {
            return res.status(400).json({
                success: false,
                error: `Invalid level: ${level}. Expected 'Ordinary Level' or 'Advance Level'.`
            });
        }

        // Get subject name for better error messages
        const subjectName = getSubjectName(subjectIdNum);

        // Build query to find exams matching subject code and level
        const examsQuery = db.collection('exams')
            .where('subjectCode', '==', subjectCode)
            .where('level', '==', level);

        const examsSnapshot = await examsQuery.get();

        if (examsSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: `No exams found for ${subjectName} (${subjectCode}) at ${level}`,
                subjectInfo: {
                    subjectId: subjectIdNum,
                    subjectName: subjectName,
                    subjectCode: subjectCode,
                    level: level
                }
            });
        }

        // Get questions from the first matching exam
        const examDoc = examsSnapshot.docs[0];
        const examData = examDoc.data();

        const questionsSnapshot = await examDoc.ref
            .collection('questions')
            .orderBy('id')
            .get();

        const questions = questionsSnapshot.docs.map(doc => doc.data());

        res.status(200).json({
            success: true,
            data: questions,
            examInfo: {
                subjectId: subjectIdNum,
                subjectName: subjectName,
                subjectCode: examData.subjectCode,
                mathType: examData.mathType,
                level: examData.level,
                paper: examData.paper,
                year: examData.year
            }
        });
    } catch (error) {
        console.error('Error fetching questions by subject ID:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get questions by exam ID
 * GET /api/exams/exam/:examId?topic=Algebra
 * Returns questions for a specific exam document, optionally filtered by topic
 */
router.get('/exam/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        const { topic } = req.query; // Optional topic filter

        console.log(`Fetching questions for examId: ${examId}${topic ? `, topic: ${topic}` : ''}`);

        // Get the exam document
        const examDoc = await db.collection('exams').doc(examId).get();

        if (!examDoc.exists) {
            return res.status(404).json({
                success: false,
                error: `Exam not found: ${examId}`
            });
        }

        const examData = examDoc.data();

        // Build query for questions
        let questionsQuery = examDoc.ref.collection('questions');
        let questionsSnapshot;

        // If topic is provided, filter by topic
        if (topic) {
            // When filtering by topic, we can't use orderBy without a composite index
            // So we'll fetch without orderBy and sort in memory
            try {
                questionsQuery = questionsQuery.where('topic', '==', topic).orderBy('id');
                questionsSnapshot = await questionsQuery.get();
            } catch (error) {
                // If orderBy fails (no composite index), fetch without ordering
                if (error.code === 'failed-precondition' || error.code === 9 || error.message?.includes('index')) {
                    console.warn(`Firestore index missing for topic filtering with orderBy. Fetching without orderBy and sorting in memory.`);
                    questionsQuery = examDoc.ref.collection('questions').where('topic', '==', topic);
                    questionsSnapshot = await questionsQuery.get();
                } else {
                    throw error;
                }
            }
        } else {
            // No topic filter, can use orderBy
            questionsQuery = questionsQuery.orderBy('id');
            questionsSnapshot = await questionsQuery.get();
        }

        let questions = questionsSnapshot.docs.map(doc => doc.data());

        // Sort by question ID if we didn't use orderBy
        if (topic) {
            questions = questions.sort((a, b) => {
                const numA = parseInt(a.id.replace(/^\D+/g, '')) || 0;
                const numB = parseInt(b.id.replace(/^\D+/g, '')) || 0;
                return numA - numB;
            });
        }

        res.status(200).json({
            success: true,
            data: questions,
            examInfo: {
                examId: examId,
                subjectCode: examData.subjectCode,
                mathType: examData.mathType,
                level: examData.level,
                paper: examData.paper,
                year: examData.year,
                topic: topic || null
            }
        });
    } catch (error) {
        console.error('Error fetching questions by exam ID:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all available exams
 * GET /api/exams
 */
router.get('/', async (req, res) => {
    try {
        const { level, subjectCode } = req.query;

        let examsQuery = db.collection('exams');

        // Apply filters if provided
        if (subjectCode) {
            examsQuery = examsQuery.where('subjectCode', '==', subjectCode);
        }
        if (level) {
            examsQuery = examsQuery.where('level', '==', level);
        }

        const examsSnapshot = await examsQuery.get();

        const exams = examsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({
            success: true,
            data: exams,
            count: exams.length
        });
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get available years and papers for a subject
 * GET /api/exams/years/:subjectId?level=Ordinary Level
 * Returns years grouped with their papers
 */
router.get('/years/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { level } = req.query;

        console.log(`Fetching years for subjectId: ${subjectId}, level: ${level}`);

        // Validate subjectId
        const subjectIdNum = parseInt(subjectId);
        if (isNaN(subjectIdNum) || subjectIdNum < 1 || subjectIdNum > 8) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID. Must be between 1 and 8.'
            });
        }

        // Validate level
        if (!level) {
            return res.status(400).json({
                success: false,
                error: 'Level parameter is required. Use "Ordinary Level" or "Advance Level".'
            });
        }

        // Convert subject ID to subject code
        const subjectCode = getSubjectCode(subjectIdNum, level);
        if (!subjectCode) {
            return res.status(400).json({
                success: false,
                error: `Invalid level: ${level}. Expected 'Ordinary Level' or 'Advance Level'.`
            });
        }

        console.log(`Converted subjectId ${subjectIdNum} to code ${subjectCode} for level ${level}`);

        // Get subject name
        const subjectName = getSubjectName(subjectIdNum);

        // Query exams for this subject and level
        // Note: Firestore requires an index for compound queries with orderBy
        // If index doesn't exist, we'll fetch without orderBy and sort in memory
        let examsSnapshot;
        try {
            // Try with orderBy first (requires Firestore index)
            const examsQuery = db.collection('exams')
                .where('subjectCode', '==', subjectCode)
                .where('level', '==', level)
                .orderBy('year', 'desc');

            examsSnapshot = await examsQuery.get();
        } catch (error) {
            // If orderBy fails (no index), fetch without ordering and sort in memory
            if (error.code === 'failed-precondition' || error.code === 9 || error.message?.includes('index')) {
                console.warn('Firestore index missing for year ordering, fetching without orderBy and sorting in memory');
                const examsQuery = db.collection('exams')
                    .where('subjectCode', '==', subjectCode)
                    .where('level', '==', level);

                examsSnapshot = await examsQuery.get();
            } else {
                console.error('Firestore query error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details
                });
                throw error;
            }
        }

        if (examsSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: `No exams found for ${subjectName} at ${level}`,
                data: []
            });
        }

        // Group exams by year
        const yearsMap = {};
        examsSnapshot.docs.forEach(doc => {
            const examData = doc.data();
            const year = examData.year;

            if (!yearsMap[year]) {
                yearsMap[year] = {
                    year: year,
                    papers: []
                };
            }

            yearsMap[year].papers.push({
                id: doc.id,
                paper: examData.paper,
                subjectCode: examData.subjectCode,
                mathType: examData.mathType,
                level: examData.level,
                year: examData.year
            });
        });

        // Convert to array and sort by year (descending)
        // Sort papers within each year by paper number if needed
        Object.keys(yearsMap).forEach(year => {
            yearsMap[year].papers.sort((a, b) => {
                // Extract paper number (e.g., "Paper 1" -> 1)
                const paperNumA = parseInt(a.paper.replace(/\D/g, '')) || 0;
                const paperNumB = parseInt(b.paper.replace(/\D/g, '')) || 0;
                return paperNumA - paperNumB;
            });
        });

        const years = Object.values(yearsMap).sort((a, b) => b.year - a.year);

        res.status(200).json({
            success: true,
            data: years,
            subjectInfo: {
                subjectId: subjectIdNum,
                subjectName: subjectName,
                subjectCode: subjectCode,
                level: level
            }
        });
    } catch (error) {
        console.error('Error fetching years:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? {
                code: error.code,
                message: error.message
            } : undefined
        });
    }
});

/**
 * Get topics for a subject with question counts
 * GET /api/exams/topics/:subjectId?level=Ordinary Level&paper=Paper 1
 * Returns topics grouped with question counts
 */
router.get('/topics/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { level, paper } = req.query;

        console.log(`Fetching topics for subjectId: ${subjectId}, level: ${level}, paper: ${paper || 'all'}`);

        // Validate subjectId
        const subjectIdNum = parseInt(subjectId);
        if (isNaN(subjectIdNum) || subjectIdNum < 1 || subjectIdNum > 8) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID. Must be between 1 and 8.'
            });
        }

        // Validate level
        if (!level) {
            return res.status(400).json({
                success: false,
                error: 'Level parameter is required. Use "Ordinary Level" or "Advance Level".'
            });
        }

        // Convert subject ID to subject code
        const subjectCode = getSubjectCode(subjectIdNum, level);
        if (!subjectCode) {
            return res.status(400).json({
                success: false,
                error: `Invalid level: ${level}. Expected 'Ordinary Level' or 'Advance Level'.`
            });
        }

        // Get subject name
        const subjectName = getSubjectName(subjectIdNum);

        // Build query to find exams matching subject code and level
        let examsQuery = db.collection('exams')
            .where('subjectCode', '==', subjectCode)
            .where('level', '==', level);

        // If paper is specified, filter by paper
        if (paper) {
            examsQuery = examsQuery.where('paper', '==', paper);
        }

        const examsSnapshot = await examsQuery.get();

        if (examsSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: `No exams found for ${subjectName} at ${level}${paper ? ` for ${paper}` : ''}`,
                data: []
            });
        }

        // Collect all questions from all matching exams and group by topic
        const topicsMap = {};
        let totalQuestions = 0;

        for (const examDoc of examsSnapshot.docs) {
            const questionsSnapshot = await examDoc.ref
                .collection('questions')
                .get();

            questionsSnapshot.docs.forEach(doc => {
                const questionData = doc.data();
                const topicName = questionData.topic || 'Uncategorized';

                if (!topicsMap[topicName]) {
                    topicsMap[topicName] = {
                        name: topicName,
                        questionCount: 0,
                        papers: new Set() // Track which papers have this topic
                    };
                }

                topicsMap[topicName].questionCount++;
                const examData = examDoc.data();
                topicsMap[topicName].papers.add(examData.paper);
                totalQuestions++;
            });
        }

        // Convert to array and sort by name
        const topics = Object.values(topicsMap).map(topic => ({
            name: topic.name,
            questionCount: topic.questionCount,
            papers: Array.from(topic.papers).sort()
        })).sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({
            success: true,
            data: topics,
            subjectInfo: {
                subjectId: subjectIdNum,
                subjectName: subjectName,
                subjectCode: subjectCode,
                level: level,
                paper: paper || 'all',
                totalQuestions: totalQuestions,
                totalTopics: topics.length
            }
        });
    } catch (error) {
        console.error('Error fetching topics:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? {
                code: error.code,
                message: error.message
            } : undefined
        });
    }
});

/**
 * Submit quiz results
 * POST /api/exams/submit
 */
router.post('/submit', async (req, res) => {
    try {
        const { subject, correct, total, durationInMinutes } = req.body;

        // 1. Get the user ID from the Authorization header
        // Your auth middleware likely attaches 'user' to the request. 
        // If not, we extract it from the token manually here:
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Prepare the data
        const percentage = total > 0 ? (correct / total) * 100 : 0;
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        const quizResult = {
            userId,
            subject,
            score: {
                correct,
                total,
                percentage: Math.round(percentage)
            },
            durationInMinutes,
            completedAt: timestamp
        };

        // 3. Save to Firestore in a 'user_stats' collection
        await db.collection('user_stats').add(quizResult);

        // 4. (Optional) Update user's aggregate stats or streaks here later for Day 6

        console.log(`✅ Stats saved for User: ${userId} - ${subject}: ${correct}/${total}`);

        res.status(200).json({
            success: true,
            message: 'Quiz results synced successfully',
            data: { percentage: Math.round(percentage) }
        });

    } catch (error) {
        console.error('Error submitting quiz results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET: Summary of all user performance
router.get('/stats-summary', authenticateToken, async (req, res) => { // Don't forget verifyToken!
    try {
        const userId = req.user.uid;
        const snapshot = await db.collection('user_stats')
            .where('userId', '==', userId)
            .orderBy('completedAt', 'desc')
            .get();

        if (snapshot.empty) {
            return res.json({
                success: true,
                data: { totalHours: 0, strongSubject: 'N/A', weakSubject: 'N/A', totalQuizzes: 0, dailyBreakdown: {}, streak: 0 }
            });
        }

        let totalMinutes = 0;
        const subjectTotals = {};
        const dailyBreakdown = {};

        snapshot.forEach(doc => {
            const data = doc.data();

            // 1. Calculate Time
            const duration = data.durationInMinutes || 0;
            totalMinutes += duration;

            // 2. SAFE Date Parsing (Replaces the duplicate/unsafe block)
            let dateKey;
            if (data.completedAt) {
                if (typeof data.completedAt.toDate === 'function') {
                    dateKey = data.completedAt.toDate().toISOString().split('T')[0];
                } else if (typeof data.completedAt === 'string') {
                    dateKey = data.completedAt.split('T')[0];
                } else if (typeof data.completedAt === 'number') {
                    dateKey = new Date(data.completedAt).toISOString().split('T')[0];
                }

                if (dateKey) {
                    dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + duration;
                }
            }

            // 3. Subject Performance (Group by Code, not Name)
            const code = data.subject || 'Unknown'; // Use 0570 as the unique key
            const displayName = data.subjectName || code; // Use GCE June as the label

            if (!subjectTotals[code]) {
                subjectTotals[code] = {
                    totalPct: 0,
                    count: 0,
                    name: displayName
                };
            }

            const percentage = data.score?.percentage ?? 0;
            subjectTotals[code].totalPct += percentage;
            subjectTotals[code].count += 1;
        });

        // --- SECTION 4: Determine Strong/Weak ---
        const subjectsArray = Object.keys(subjectTotals).map(code => ({
            name: subjectTotals[code].name,
            avg: subjectTotals[code].totalPct / subjectTotals[code].count
        }));

        let strong = 'N/A';
        let weak = 'N/A';

        if (subjectsArray.length === 1) {
            // Only one subject exists
            strong = subjectsArray[0].name;
            weak = "Keep practicing!";
        } else if (subjectsArray.length > 1) {
            // Sort by average score (highest to lowest)
            subjectsArray.sort((a, b) => b.avg - a.avg);

            strong = subjectsArray[0].name;
            weak = subjectsArray[subjectsArray.length - 1].name;

            // Optional: If top and bottom scores are the same, don't show a weak one
            if (subjectsArray[0].avg === subjectsArray[subjectsArray.length - 1].avg) {
                weak = "All balanced";
            }
        }

        // 5. STREAK CALCULATION: Walking backwards through the calendar
        let currentStreak = 0;
        let dateToCheck = new Date(); // Starts today

        for (let i = 0; i < 365; i++) {
            const dateStr = dateToCheck.toISOString().split('T')[0];

            if (dailyBreakdown[dateStr]) {
                currentStreak++;
                dateToCheck.setDate(dateToCheck.getDate() - 1); // Move to previous day
            } else {
                // If no study today yet, allow the streak to continue from yesterday
                if (i === 0) {
                    dateToCheck.setDate(dateToCheck.getDate() - 1);
                    const yesterdayStr = dateToCheck.toISOString().split('T')[0];
                    if (dailyBreakdown[yesterdayStr]) {
                        continue;
                    }
                }
                break; // Streak broken
            }
        }
        res.json({
            success: true,
            data: {
                totalHours: (totalMinutes / 60).toFixed(1),
                strongSubject: subjectsArray[0].name,
                weakSubject: subjectsArray[subjectsArray.length - 1].name,
                totalQuizzes: snapshot.size,
                streak: currentStreak,
                dailyBreakdown: dailyBreakdown
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        // TEMPORARY: Send the full error message to the frontend to debug
        res.status(500).json({
            success: false,
            message: error.message, // This will say "The query requires an index" if that's the issue
            code: error.code
        });
    }
});

module.exports = router;