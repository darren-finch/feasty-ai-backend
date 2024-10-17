import * as functions from "firebase-functions"
import { Request, Response } from "express"
import { configDotenv } from "dotenv"
import OpenAI from "openai"

configDotenv()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const NUM_RETRIES = 3
const PREFERRED_PER_MEAL_PREP_TIME_IN_MINS: number = 10
// const ALLOWED_PER_MEAL_PREP_TIME_VARIANCE_PERCENT: number = 0.3
// const ALLOWED_PER_MEAL_BUDGET_VARIANCE_PERCENT: number = 0.5
const ALLOWED_CALORIE_VARIANCE_PERCENT: number = 0.03
const CARBS_PERCENT: number = 0.3
const FATS_PERCENT: number = 0.3
const PROTEIN_PERCENT: number = 0.4
// const ALLOWED_CARBS_VARIANCE_PERCENT: number = 0.02
// const ALLOWED_FATS_VARIANCE_PERCENT: number = 0.02
// const ALLOWED_PROTEIN_VARIANCE_PERCENT: number = 0.02

// Define the request body interface for strong typing
interface MealPlanRequest {
	budget: number
	calories: number
	carbs: number
	fats: number
	protein: number
	meals: number
}

interface MealPlan {
	totalCost: number
	totalPrepTime: number
	totalCalories: number
	totalCarbs: number
	totalFats: number
	totalProtein: number

	meals: Meal[]
}

interface Meal {
	name: string
	cost: number
	prepTime: number

	foods: Food[]
}

interface Food {
	name: string
	calories: number
	carbs: number
	fats: number
	protein: number
}

// Firebase Cloud Function to generate a meal plan
export const generateMealPlan = functions.https.onRequest(async (req: Request, res: Response) => {
	// Ensure we only handle POST requests
	if (req.method !== "POST") {
		res.status(405).send("Method Not Allowed")
		return
	}

	const mealPlanRequest: MealPlanRequest = {
		budget: parseInt(req.body.budget),
		calories: parseInt(req.body.calories),
		carbs: parseInt(req.body.carbs),
		fats: parseInt(req.body.fats),
		protein: parseInt(req.body.protein),
		meals: parseInt(req.body.meals),
	}
	const { budget, calories, carbs, fats, protein, meals } = mealPlanRequest

	// console.log(`Budget: ${budget}
	//     \nCalories: ${calories}
	//     \nCarbs: ${carbs}
	//     \nFats: ${fats}
	//     \nProtein: ${protein}
	//     \nMeals: ${meals}
	// `)

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

	try {
		for (let i = 0; i < NUM_RETRIES; i++) {
			// Get ChatGPT output
			console.log(`Before ChatGPT call #${i}`)

			const perMealBudget = budget / (meals * 7)
			const prompt = `
				You are a nutrition expert that specializes in helping people gain or lose weight in an efficient, healthy, and still tasty way. Generate me a meal plan that meets the following criteria:
				- Prep time for each meal should be less than ${PREFERRED_PER_MEAL_PREP_TIME_IN_MINS} minutes.
				- The cost for each meal should be less than $${perMealBudget.toFixed(2)} dollars
				- The sum of the calories for each meal should be within ${ALLOWED_CALORIE_VARIANCE_PERCENT * 100}% of ${calories}
				- The macro percentage breakdown of those ${calories} calories should be as close to ${
				PROTEIN_PERCENT * 100
			}% protein, ${CARBS_PERCENT * 100}% carbs, ${FATS_PERCENT * 100}% fats as possible.
				- There should be ${meals} meals each day

				The output should be in the following exact format. Do not add totals or any explanation about how you came up with this result:

				First meal name - $<expected average cost> - <expected average prep time>
				- Food 1 name | x units | x calories | x carbs | x fats | x protein
				- Food 2 name | x units | x calories | x carbs | x fats | x protein

				Second meal name - $<expected average cost> - <expected average prep time>
				- Food 1 name | x units | x calories | x carbs | x fats | x protein
				- Food 2 name | x units | x calories | x carbs | x fats | x protein

				... (more meal plans would continue)
	  		`
			console.log("\n\nPrompt:", prompt)
			const completion = await openai.chat.completions.create({
				messages: [{ role: "system", content: prompt }],
				temperature: 0.5,
				model: "o1-mini",
			})

			console.log(`After ChatGPT call #${i}`)
			console.log(completion.choices)

			// Parse the output
			const mealPlanString = completion.choices[0].message.content
			console.log("\n\n", `Meal plan as string = ${JSON.stringify(mealPlanString)}`)
			if (mealPlanString == null) throw new Error("Could not get a response from ChatGPT")

			let mealPlan: MealPlan | null = null
			try {
				mealPlan = parseMealPlan(mealPlanString)
				console.log(`\n\nMeal plan = ${JSON.stringify(mealPlan)}`)
				if (!checkIfWithinAllowedVariance(mealPlan.totalCalories, calories, ALLOWED_CALORIE_VARIANCE_PERCENT))
					throw new Error(
						`Meal plan calories for generation attempt ${i} were out of allowed variance of ${ALLOWED_CALORIE_VARIANCE_PERCENT} (${mealPlan.totalCalories}/${calories})`
					)
			} catch (error) {
				console.log(`Couldn't parse ChatGPT output, retry #${i + 1}...`)
				continue
			}

			if (mealPlan == null) {
				throw new Error()
			} else {
				console.log("Successfully generated meal plan:")
				console.log(JSON.stringify(mealPlan))
				res.status(200).json({ mealPlan })
				return
			}
		}

		// // We will only come out of this loop if we couldn't generate a meal plan within parameters. Throw an error.
		throw Error("")
	} catch (error) {
		console.error("Error generating meal plan:", error)
		res.status(500).json({ error: "Failed to generate meal plan" })
		return
	}
})

function parseMealPlan(output: string): MealPlan {
	const mealPlan: MealPlan = {
		totalCost: 0,
		totalPrepTime: 0,
		totalCalories: 0,
		totalCarbs: 0,
		totalFats: 0,
		totalProtein: 0,
		meals: [],
	}

	const mealBlocks = output.trim().split("\n\n")
	console.log(`mealBlocks = ${mealBlocks}}`)

	mealBlocks.forEach((block) => {
		const lines = block.split("\n")
		const [mealHeader, ...foodLines] = lines

		const mealMatch = mealHeader.match(/(.*) - \$(\d+(\.\d{2,})?) - (\d+) minutes/)
		console.log(`\n\nmealMatch = ${JSON.stringify(mealMatch)}}`)
		if (!mealMatch) return

		const mealName = mealMatch[1].trim()
		const mealCost = parseFloat(mealMatch[3])
		const mealPrepTime = parseInt(mealMatch[4], 10)

		const meal: Meal = {
			name: mealName,
			cost: mealCost,
			prepTime: mealPrepTime,
			foods: [],
		}

		foodLines.forEach((foodLine) => {
			const foodMatch = foodLine.match(
				/- (.*) \| [\d\w ]* \| (\d+) calories \| (\d+\.?\d*)g carbs \| (\d+\.?\d*)g fats \| (\d+\.?\d*)g protein/
			)
			if (foodMatch) {
				const food: Food = {
					name: foodMatch[1].trim(),
					calories: parseInt(foodMatch[2], 10),
					carbs: parseFloat(foodMatch[3]),
					fats: parseFloat(foodMatch[4]),
					protein: parseFloat(foodMatch[5]),
				}

				meal.foods.push(food)

				// Add food macros to the meal plan totals
				mealPlan.totalCalories += food.calories
				mealPlan.totalCarbs += food.carbs
				mealPlan.totalFats += food.fats
				mealPlan.totalProtein += food.protein
			}
		})

		// Add meal details to the meal plan totals
		mealPlan.totalCost += meal.cost
		mealPlan.totalPrepTime += meal.prepTime
		mealPlan.meals.push(meal)
	})

	return mealPlan
}

function checkIfWithinAllowedVariance(val: number, refVal: number, variancePercentage: number) {
	const allowedVariance = val * variancePercentage
	console.log(
		`Checking if ${val} is within +/-${variancePercentage * 100}% of refVal. Allowed variance = ${allowedVariance}.
		refVal - allowed variance = ${refVal - allowedVariance}.
		refVal + allowed variance = ${refVal + allowedVariance}. ${
			!(val < refVal - allowedVariance || val > refVal + allowedVariance)
				? "val is within alllowed variance"
				: "val is not within allowed variance"
		}`
	)
	return !(val < refVal - allowedVariance || val > refVal + allowedVariance)
}
