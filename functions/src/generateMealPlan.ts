import * as functions from "firebase-functions"
import { Request, Response } from "express"
import { configDotenv } from "dotenv"
import { createMealPlan } from "./mealPlanAlgorithm"

configDotenv()

// Define the request body interface for strong typing
interface MealPlanRequest {
	calories: number
	carbs: number
	fats: number
	protein: number
	meals: number
}

// Firebase Cloud Function to generate a meal plan
export const generateMealPlan = functions.https.onRequest(async (req: Request, res: Response) => {
	// Ensure we only handle POST requests
	if (req.method !== "POST") {
		res.status(405).send("Method Not Allowed")
		return
	}

	// Parse request body
	const mealPlanRequest: MealPlanRequest = {
		calories: parseInt(req.body.calories),
		carbs: parseInt(req.body.carbs),
		fats: parseInt(req.body.fats),
		protein: parseInt(req.body.protein),
		meals: parseInt(req.body.meals),
	}
	const { calories, carbs, fats, protein, meals } = mealPlanRequest

	if (!process.env.OPENAI_API_KEY) {
		res.status(500).send("OPENAI_API_KEY is not defined")
		return
	}

	try {
		// Use createMealPlan to generate and adjust the meal plan according to macros and budget
		const mealPlan = await createMealPlan(meals, calories, carbs, fats, protein)

		if (!mealPlan) {
			res.status(500).json({ error: "Failed to generate meal plan" })
			return
		}

		console.log("Successfully generated meal plan:", JSON.stringify(mealPlan))
		res.status(200).json({ mealPlan })
	} catch (error) {
		console.error("Error generating meal plan:", error)
		res.status(500).json({ error: "Failed to generate meal plan" })
	}
})
