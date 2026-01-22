// backend/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
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
            .orderBy('id') // Ensures Q1 comes before Q2
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

module.exports = router;