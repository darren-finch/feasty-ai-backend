import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

if (!admin.apps.length) {
    admin.initializeApp();
}

export const updateUserInfo = functions.https.onRequest(async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { user } = req.body;

    if (!user) {
        res.status(400).send('Bad Request: Missing user data');
        return;
    }

    try {
        const userRef = admin.firestore().collection('users').doc(user.id);
        await userRef.update(user);
        const updatedUser = await userRef.get();

        if (!updatedUser.exists) {
            res.status(404).send('User not found');
            return;
        }

        res.status(200).send(updatedUser.data());
    } catch (error) {
        console.error('Error updating user info: ', error);
        res.status(500).send('Internal Server Error');
    }
});