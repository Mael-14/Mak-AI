// backend/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

router.get('/questions/:subjectCode', async (req, res) => {
    try {
        const { subjectCode } = req.params;
        const examId = `${subjectCode}_P1_2025`; // Matches your seed ID

        const snapshot = await db.collection('exams')
            .doc(examId)
            .collection('questions')
            .orderBy('id') // Ensures Q1 comes before Q2
            .get();

        const questions = snapshot.docs.map(doc => doc.data());
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;