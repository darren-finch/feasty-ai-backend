import { ActivityLevel } from "./ActivityLevel"
import { FitnessPlan } from "./FitnessPlan"
import { PaymentPlan } from "./PaymentPlan"
import { UnitSystem } from "./UnitSystem"

export interface User {
    id: string
    age: number
    height: number
    weight: number
    gender: string
    activityLevel: ActivityLevel
    fitnessPlan: FitnessPlan
    paymentPlan: PaymentPlan
    preferredUnits: UnitSystem
}