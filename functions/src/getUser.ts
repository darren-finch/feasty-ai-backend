import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

if (!admin.apps.length) {
    admin.initializeApp();
}

export const getUser = functions.https.onRequest(async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        res.status(400).send('Bad Request: Missing or invalid sub');
        return;
    }

    try {
        const doc = await admin.firestore().collection('users').doc(userId).get();
        if (doc.exists) {
            res.status(200).send(doc.data());
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user: ', error);
        res.status(500).send('Internal Server Error');
    }
});