import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from "express"
import { User } from './User';
import { ActivityLevel } from './ActivityLevel';
import { FitnessPlan } from './FitnessPlan';
import { PaymentPlan } from './PaymentPlan';
import { UnitSystem } from './UnitSystem';

if (!admin.apps.length) {
    admin.initializeApp();
}

export const createUser = functions.https.onRequest(async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return
    }

    const { userId } = req.body;

    if (!userId) {
        res.status(400).send('Bad Request: Missing sub');
        return
    }

    const newUser: User = {
        id: userId,
        age: 0,
        height: 0,
        weight: 0,
        gender: 'Male',
        activityLevel: ActivityLevel.LIGHTLY_ACTIVE,
        fitnessPlan: FitnessPlan.MAINTAIN,
        paymentPlan: PaymentPlan.NONE,
        preferredUnits: UnitSystem.METRIC
    };

    try {
        await admin.firestore().collection('users').doc(userId).set(newUser);
        res.status(201).send(newUser);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});