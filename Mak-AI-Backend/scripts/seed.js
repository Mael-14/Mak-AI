const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Initialize Firebase Admin
// Make sure 'serviceAccountKey.json' is in the same folder as this script
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedDatabase() {
    try {
        const dataPath = path.join(__dirname, 'data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const examData = JSON.parse(rawData);

        for (const subject of examData) {
            console.log(`Seeding ${subject.mathType}...`);

            const subjectDocId = `${subject.subjectCode}_P1_${subject.year}`;
            const subjectRef = db.collection('exams').doc(subjectDocId);

            // Metadata for the subject
            await subjectRef.set({
                subjectCode: subject.subjectCode,
                mathType: subject.mathType,
                level: subject.level,
                paper: subject.paper,
                year: subject.year,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const batch = db.batch();
            const questionsCol = subjectRef.collection('questions');

            subject.questions.forEach((q) => {
                const qRef = questionsCol.doc(q.id);
                batch.set(qRef, {
                    id: q.id,
                    topic: q.topic,
                    text: q.text,
                    options: q.options,
                    answer: q.answer,
                    explanation: q.explanation || "No explanation provided.",
                    hasImage: q.hasImage || false,
                    imageUrl: q.hasImage ? `questions/${subjectDocId}/${q.id}.png` : null
                });
            });

            await batch.commit();
            console.log(`✅ ${subject.questions.length} questions uploaded with explanations.`);
        }
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    }
}

seedDatabase();