const admin = require('firebase-admin');
const fs = require('fs');

// 1. Initialize Firebase Admin
// Make sure 'serviceAccountKey.json' is in the same folder as this script
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedDatabase() {
    try {
        // 2. Read the data.json file
        const rawData = fs.readFileSync('./data.json', 'utf8');
        const examData = JSON.parse(rawData);

        for (const subject of examData) {
            console.log(`Processing: ${subject.mathType} (${subject.subjectCode})...`);

            // 3. Create a reference to the main subject document
            const subjectId = `${subject.subjectCode}_P1_${subject.year}`;
            const subjectRef = db.collection('exams').doc(subjectId);

            // Set subject metadata
            await subjectRef.set({
                subjectCode: subject.subjectCode,
                mathType: subject.mathType,
                paper: subject.paper,
                year: subject.year,
                totalQuestions: subject.questions.length
            });

            // 4. Use a Batch to upload all 50 questions efficiently
            const batch = db.batch();
            const questionsCollection = subjectRef.collection('questions');

            subject.questions.forEach((q) => {
                const qRef = questionsCollection.doc(q.id);
                batch.set(qRef, {
                    ...q,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            // Commit the batch
            await batch.commit();
            console.log(`✅ Successfully uploaded 50 questions for ${subject.subjectCode}`);
        }

        console.log("🚀 Database seeding completed successfully!");
        process.exit();

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();