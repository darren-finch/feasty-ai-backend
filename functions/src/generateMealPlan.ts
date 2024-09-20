import * as functions from "firebase-functions"
import { Request, Response } from "express"
import { configDotenv } from "dotenv"
import OpenAI from "openai"

configDotenv()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Define the request body interface for strong typing
interface MealPlanRequest {
	budget: number
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

	const { budget, calories, carbs, fats, protein, meals } = req.body as MealPlanRequest

	console.log(`Budget: ${budget}
	    \nCalories: ${calories}
	    \nCarbs: ${carbs}
	    \nFats: ${fats}
	    \nProtein: ${protein}
	    \nMeals: ${meals}
	`)

	const openAiApiKey = process.env.OPENAI_API_KEY
	if (openAiApiKey == null) {
		res.status(500).send("OPENAI_API_KEY is null!")
		return
	}
	const openAiApiUrl = process.env.OPENAI_API_URL
	if (openAiApiUrl == null) {
		res.status(500).send("OPENAI_API_URL is null!")
		return
	}

	const prompt = `
	        You are a nutrition expert that specializes in helping people gain or lose weight in an efficient, healthy, and still tasty way. Generate me a meal plan that meets the following criteria:
	        - Prep time for each meal should be less than 5 minutes.
	        - The cost for each meal should be less than ${budget} dollars
	        - The sum of the calories for each meal should be within 1% of ${calories}
	        - The sum of the carbohydrates for each meal should be within 2% of ${carbs}
	        - The sum of the fats for each meal should be within 2% of ${fats}
	        - The sum of the proteins for each meal should be within 2% of ${protein}
	        - There should be ${meals} meals each day

	        The output should be in the following exact format. Do not add totals or any explanation about how you came up with this result:

	        First meal name
	        - Food 1 name | x units | x calories | x carbs | x fats | x protein
	        - Food 2 name | x units | x calories | x carbs | x fats | x protein

	        Second meal name
	        - Food 1 name | x units | x calories | x carbs | x fats | x protein

	        ... (more meal plans would continue)
	  `

	try {
		console.log("Before function")
		const completion = await openai.chat.completions.create({
			messages: [{ role: "system", content: prompt }],
			temperature: 0.3,
			model: "gpt-4o",
		})
		console.log("After function")
		console.log(completion.choices)

		const mealPlan = completion.choices[0].message.content
		res.status(200).json({ mealPlan })
		return
	} catch (error) {
		console.error("Error generating meal plan:", error)
		res.status(500).json({ error: "Failed to generate meal plan" })
		return
	}
})
