// backend/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { db } = require('../config/firebase')
router.get('/questions/:subjectCode', async (req, res) => {
    try {
        const { subjectCode } = req.params;
        const examId = `${subjectCode}_P1_2025`;

        // 1. Fetch the main Exam document (contains year, subjectCode, mathType)
        const examDoc = await db.collection('exams').doc(examId).get();

        if (!examDoc.exists) {
            return res.status(404).json({ error: "Exam not found" });
        }

        // 2. Fetch the questions sub-collection
        const questionsSnapshot = await db.collection('exams')
            .doc(examId)
            .collection('questions')
            .orderBy('id')
            .get();

        const questions = questionsSnapshot.docs.map(doc => doc.data());

        console.log(`✅ Questions Fetched: ${questions.length} items found.`);
        // 3. Return combined data
        res.status(200).json({
            success: true,
            examDetails: examDoc.data(), // Access mathType, paper, year here
            questions: questions        // Access your list of questions here
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;