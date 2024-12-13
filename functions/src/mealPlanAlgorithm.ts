import { configDotenv } from "dotenv"
import OpenAI from "openai"

configDotenv()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const NUM_RETRIES = 3
const ALLOWED_CALORIE_VARIANCE_PERCENT: number = 0.03

interface MealPlan {
	totalActualCalories: number
	totalActualCarbs: number
	totalActualFats: number
	totalActualProtein: number
	meals: Meal[]
}

interface Meal {
	name: string
	totalCalories: number
	totalCarbs: number
	totalFats: number
	totalProtein: number
	foods: Food[]
}

interface Food {
	name: string
	unitCalories: number
	unitCarbs: number
	unitFats: number
	unitProtein: number
	unitAmount: number
	desiredAmount: number
	unit: string
	primaryMacroClass: string
}

const proteinSourcesRef: Food[] = [
	{
		name: "Grilled Chicken Breast",
		unitCalories: 120,
		unitCarbs: 0,
		unitFats: 3,
		unitProtein: 26,
		unitAmount: 4,
		desiredAmount: 4,
		unit: "oz",
		primaryMacroClass: "Protein",
	},
	{
		name: "Grilled Steak",
		unitCalories: 307,
		unitCarbs: 0,
		unitFats: 20,
		unitProtein: 29,
		unitAmount: 110,
		desiredAmount: 110,
		unit: "g",
		primaryMacroClass: "Protein",
	},
	{
		name: "Protein Scoop",
		unitCalories: 120,
		unitCarbs: 3,
		unitFats: 2,
		unitProtein: 24,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "scoop",
		primaryMacroClass: "Protein",
	},
	{
		name: "Garbonzo Beans",
		unitCalories: 364,
		unitCarbs: 61,
		unitFats: 6,
		unitProtein: 19,
		unitAmount: 100,
		desiredAmount: 100,
		unit: "g",
		primaryMacroClass: "Protein",
	},
	{
		name: "Fried Tofu",
		unitCalories: 271,
		unitCarbs: 10,
		unitFats: 2,
		unitProtein: 17,
		unitAmount: 100,
		desiredAmount: 100,
		unit: "g",
		primaryMacroClass: "Protein",
	},
]

const carbSourcesRef: Food[] = [
	{
		name: "Pasta (cooked)",
		unitCalories: 200,
		unitCarbs: 42,
		unitFats: 1,
		unitProtein: 7,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "cup",
		primaryMacroClass: "Carb",
	},
	{
		name: "White Rice (cooked)",
		unitCalories: 205,
		unitCarbs: 45,
		unitFats: 0.4,
		unitProtein: 4.3,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "cup",
		primaryMacroClass: "Carb",
	},
	{
		name: "Whole Wheat Bread",
		unitCalories: 69,
		unitCarbs: 12,
		unitFats: 1,
		unitProtein: 3.6,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "slice",
		primaryMacroClass: "Carb",
	},
	{
		name: "Sweet Potato (medium, cooked)",
		unitCalories: 112,
		unitCarbs: 26,
		unitFats: 0.1,
		unitProtein: 2,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "medium",
		primaryMacroClass: "Carb",
	},
	{
		name: "Apple (medium)",
		unitCalories: 95,
		unitCarbs: 25,
		unitFats: 0.3,
		unitProtein: 0.5,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "medium",
		primaryMacroClass: "Carb",
	},
]

const fatSourcesRef: Food[] = [
	{
		name: "Olive Oil",
		unitCalories: 119,
		unitCarbs: 0,
		unitFats: 13.5,
		unitProtein: 0,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "tablespoon",
		primaryMacroClass: "Fat",
	},
	{
		name: "Coconut Oil",
		unitCalories: 121,
		unitCarbs: 0,
		unitFats: 13.5,
		unitProtein: 0,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "tablespoon",
		primaryMacroClass: "Fat",
	},
	{
		name: "Peanut Butter",
		unitCalories: 188,
		unitCarbs: 6,
		unitFats: 16,
		unitProtein: 8,
		unitAmount: 2,
		desiredAmount: 2,
		unit: "tablespoons",
		primaryMacroClass: "Fat",
	},
	{
		name: "Almond Butter",
		unitCalories: 196,
		unitCarbs: 6,
		unitFats: 18,
		unitProtein: 7,
		unitAmount: 2,
		desiredAmount: 2,
		unit: "tablespoons",
		primaryMacroClass: "Fat",
	},
	{
		name: "Egg Yolk (large)",
		unitCalories: 55,
		unitCarbs: 0.6,
		unitFats: 4.5,
		unitProtein: 2.7,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "large",
		primaryMacroClass: "Fat",
	},
]

export const createMealPlan = async (
	mealsPerDay: number,
	desiredCalories: number,
	desiredCarbs: number,
	desiredFats: number,
	desiredProteins: number
) => {
	const openAiApiKey = process.env.OPENAI_API_KEY
	if (openAiApiKey == null) return null

	const proteinNames = proteinSourcesRef.map((food: Food) => `"${food.name}"`)
	const carbNames = carbSourcesRef.map((food: Food) => `"${food.name}"`)
	const fatNames = fatSourcesRef.map((food: Food) => `"${food.name}"`)

	try {
		for (let i = 0; i < NUM_RETRIES; i++) {
			const prompt = `
Create a one day meal plan with ${mealsPerDay} meals using the following exact food names. Be sure to include one protein food, one carb food, and one fat food with each meal:

Proteins: ${proteinNames.join(", ")}
Carbs: ${carbNames.join(", ")}
Fats: ${fatNames.join(", ")}

Give your output in this format:
<Meal Name>
- <Protein food name> | <serving amount>
- <Carb food name> | <serving amount>
- <Fat food name> | <serving amount>

Only give me the names of each meal, the expected serving amounts, and the names of each food going into the meal. Don't give me the summary or any other explanation. Don't list "Meal 1", "Meal 2", etc, in the meal names.
			`
			const completion = await openai.chat.completions.create({
				messages: [{ role: "system", content: prompt }],
				temperature: 0.5,
				model: "gpt-4o",
			})

			const mealPlanString = completion.choices[0].message.content
			if (!mealPlanString) throw new Error("No response from ChatGPT")

			let mealPlan: MealPlan | null = null
			try {
				mealPlan = parseAndTransformMealPlan(mealPlanString)
				adjustMacros(mealPlan, desiredCalories, desiredCarbs, desiredFats, desiredProteins)
				return mealPlan
			} catch (error) {
				console.log(error)
				console.log(`Couldn't parse ChatGPT output, retry #${i + 1}...`)
				continue
			}
		}
		throw Error("Failed to generate meal plan")
	} catch (error) {
		console.error("Error generating meal plan:", error)
		return null
	}
}

export function parseAndTransformMealPlan(mealPlanText: string): MealPlan {
	console.log(`\n\nParsing mealPlanText = ${mealPlanText}`)
	const meals: Meal[] = []
	const mealBlocks = mealPlanText.trim().split("\n\n")

	mealBlocks.forEach((block) => {
		const lines = block.split("\n")
		const mealName = lines[0].trim()

		const foods: Food[] = lines.slice(1).map((line) => {
			const [foodName, serving] = line.replace("- ", "").split(" | ")
			const [servingAmount, servingUnit] = serving.split(" ")

			// Find the matching food from the reference lists
			const foodRef =
				proteinSourcesRef.find((food) => food.name === foodName.trim()) ||
				carbSourcesRef.find((food) => food.name === foodName.trim()) ||
				fatSourcesRef.find((food) => food.name === foodName.trim())

			if (!foodRef) throw new Error(`Food item ${foodName} not found in references`)

			return {
				...foodRef,
				desiredAmount: parseFloat(servingAmount),
				unit: servingUnit.trim(),
			}
		})

		const meal: Meal = {
			name: mealName,
			totalCalories: foods.reduce(
				(sum, food) => sum + food.unitCalories * (food.desiredAmount / food.unitAmount),
				0
			),
			totalCarbs: foods.reduce((sum, food) => sum + food.unitCarbs * (food.desiredAmount / food.unitAmount), 0),
			totalFats: foods.reduce((sum, food) => sum + food.unitFats * (food.desiredAmount / food.unitAmount), 0),
			totalProtein: foods.reduce(
				(sum, food) => sum + food.unitProtein * (food.desiredAmount / food.unitAmount),
				0
			),
			foods,
		}

		meals.push(meal)
	})

	return {
		totalActualCalories: meals.reduce((sum, meal) => sum + meal.totalCalories, 0),
		totalActualCarbs: meals.reduce((sum, meal) => sum + meal.totalCarbs, 0),
		totalActualFats: meals.reduce((sum, meal) => sum + meal.totalFats, 0),
		totalActualProtein: meals.reduce((sum, meal) => sum + meal.totalProtein, 0),
		meals,
	}
}

function adjustMacros(
	mealPlan: MealPlan,
	desiredCalories: number,
	desiredCarbs: number,
	desiredFats: number,
	desiredProteins: number
) {
	const varianceThreshold = ALLOWED_CALORIE_VARIANCE_PERCENT * desiredCalories

	mealPlan.meals.forEach((meal) => {
		let calorieDiff = desiredCalories - mealPlan.totalActualCalories

		while (Math.abs(calorieDiff) > varianceThreshold) {
			const primaryMacros = { carbs: desiredCarbs, fats: desiredFats, proteins: desiredProteins }
			Object.keys(primaryMacros).forEach((macro) => {
				meal.foods.forEach((food) => {
					if (food.primaryMacroClass.toLowerCase() === macro && calorieDiff > 0) {
						food.desiredAmount *= 1.05 // Increase by 5%
					} else if (food.primaryMacroClass.toLowerCase() === macro && calorieDiff < 0) {
						food.desiredAmount *= 0.95 // Decrease by 5%
					}
				})
			})

			meal.totalCalories = meal.foods.reduce(
				(sum, food) => sum + food.unitCalories * (food.desiredAmount / food.unitAmount),
				0
			)
			calorieDiff = desiredCalories - mealPlan.totalActualCalories
		}

		mealPlan.totalActualCalories = mealPlan.meals.reduce((sum, meal) => sum + meal.totalCalories, 0)
	})
}
